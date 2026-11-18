"""Pruebas locales: no consultan tiendas ni modifican el catálogo real."""
import json
from io import BytesIO
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

from PIL import Image

from imagenes_faltantes import auditar, ean_valido
from candidatos_imagenes import ReviewClient, SourceError, parse_products, run_review, details, quantity, brand_compatible

EAN = "7790139102449"
OTHER_EAN = "7790070431578"


class ImagenesTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "public/data").mkdir(parents=True)
        (self.root / "public/products").mkdir()
        self.catalog = self.root / "public/data/catalog-posberry.json"

    def tearDown(self):
        self.temporary.cleanup()

    def product(self, code, ean=EAN):
        return {"id": f"sku:{code}", "sku": code, "name": f"Producto {code}", "barcode": ean, "price": 100, "stock": 2, "category": "Almacén"}

    def write_catalog(self, products):
        self.catalog.write_text(json.dumps({"products": products}), encoding="utf-8")

    def write_image(self, name):
        path = self.root / "public/products" / name
        Image.new("RGB", (20, 20), "white").save(path, "WEBP")
        return path

    def manifest(self, rows):
        path = self.root / "public/data/product-image-local.json"
        path.write_text(json.dumps({"schemaVersion": 1, "associations": rows}), encoding="utf-8")
        return path

    def test_checksum(self):
        self.assertTrue(ean_valido(EAN))
        self.assertFalse(ean_valido(EAN[:-1] + "0"))
        self.assertFalse(ean_valido("00000000"))
        self.assertFalse(ean_valido("abc"))

    def test_audit_checks_file_and_duplicate_ean(self):
        self.write_catalog([self.product("1"), self.product("2", OTHER_EAN), self.product("3", OTHER_EAN), self.product("4", "bad")])
        self.write_image(f"{EAN}.webp")
        self.manifest([{"productId": "sku:1", "sku": "1", "barcode": EAN, "imageUrl": f"/products/{EAN}.webp"}])
        before = self.catalog.read_bytes()
        rows = auditar(self.root, self.catalog)
        self.assertTrue(rows[0]["tiene_imagen"])
        self.assertEqual([r["ean_estado"] for r in rows[1:]], ["duplicado", "duplicado", "invalido"])
        self.assertFalse(any(r["descargable"] for r in rows))
        self.assertEqual(self.catalog.read_bytes(), before)

    def test_corrupt_image_is_missing(self):
        self.write_catalog([self.product("1")])
        (self.root / "public/products/bad.webp").write_bytes(b"not an image")
        self.manifest([{"productId": "sku:1", "imageUrl": "/products/bad.webp"}])
        row = auditar(self.root, self.catalog)[0]
        self.assertFalse(row["tiene_imagen"])
        self.assertTrue(row["descargable"])

    def test_missing_ean_master_is_not_invented(self):
        self.write_catalog([self.product("1", "")])
        row = auditar(self.root, self.catalog)[0]
        self.assertEqual(row["ean_estado"], "ausente")
        self.assertFalse(row["descargable"])
        row = auditar(self.root, self.catalog, {"1": {EAN}})[0]
        self.assertEqual(row["ean"], EAN)
        self.assertTrue(row["descargable"])

    def response(self, status=200, data=None, content_type="application/json"):
        response = Mock()
        response.status_code, response.url = status, "https://example.org/search"
        response.headers = {"Content-Type": content_type}
        response.json.return_value = data
        response.text = "<html>unexpected</html>"
        return response

    def test_http_errors_are_not_empty_results(self):
        for status, state in [(403, "bloqueo"), (429, "bloqueo"), (500, "error_http")]:
            client = ReviewClient(self.root / "review", delay=0)
            client.session = Mock()
            client.session.get.return_value = self.response(status)
            with self.assertRaises(SourceError) as raised:
                client.search("carrefour", "coca cola", "texto")
            self.assertEqual(raised.exception.state, state)
            log = json.loads((client.output / "consultas.jsonl").read_text().splitlines()[-1])
            self.assertEqual(log["http"], status)
            self.assertIsNone(log["cantidad_resultados"])

    def test_html_instead_of_json_is_unexpected(self):
        client = ReviewClient(self.root / "review", delay=0)
        client.session = Mock()
        response = self.response(content_type="text/html")
        response.json.side_effect = ValueError("not json")
        client.session.get.return_value = response
        with self.assertRaises(SourceError) as raised:
            client.search("jumbo", "coca cola", "texto")
        self.assertEqual(raised.exception.state, "respuesta_inesperada")

    def test_schema_error_is_not_empty(self):
        with self.assertRaises(SourceError):
            parse_products("dia", {"error": "not a list"})
        with self.assertRaises(SourceError):
            parse_products("jumbo", [{"productName": "bad"}])
        with self.assertRaises(SourceError):
            parse_products("la-anonima", {"success": False})

    def test_empty_json_and_standard_query_encoding(self):
        client = ReviewClient(self.root / "review", delay=0)
        client.session = Mock()
        client.session.get.return_value = self.response(data=[])
        items, log = client.search("dia", "coca cola", "texto")
        self.assertEqual(items, [])
        self.assertEqual(log["estado"], "sin_coincidencias")
        self.assertEqual(log["cantidad_resultados"], 0)
        self.assertIn("ft=coca%20cola", client.session.get.call_args.args[0])
        self.assertNotIn("coca+cola", client.session.get.call_args.args[0])

    def test_brands_variants_and_presentation_queries(self):
        detail = details({"nombre": "PAVA ELECTRICA SMARTLIFE 1.7L", "marca": ""})
        self.assertEqual(detail["marca"], "smartlife")
        self.assertIn("1.7l", detail["consultas"][0])
        self.assertIn("smartlife", detail["consultas"])
        self.assertEqual(quantity("Jugo 1,5 L"), quantity("Jugo 1500 ml"))
        self.assertEqual(quantity("ELITE X6"), quantity("Pañuelos 6 x 10 uni"))
        self.assertNotEqual(quantity("ELITE X6"), quantity("Rollos 3 Ud."))

    def test_invalid_ean_candidates_never_publish_and_resume(self):
        self.write_catalog([self.product("1", "invalid")])
        existing = self.write_image("original.webp")
        manifest = self.manifest([])
        before = [self.catalog.read_bytes(), manifest.read_bytes(), existing.read_bytes()]
        row = auditar(self.root, self.catalog)[0]
        png = BytesIO()
        Image.new("RGB", (20, 20), "blue").save(png, "PNG")
        response = self.response()
        response.content = png.getvalue()
        candidate = {"nombre": "Producto 1", "marca": "", "ean": OTHER_EAN, "url_imagen": "https://example.org/image.png", "url_producto": "https://example.org/product"}
        client = Mock()
        client.request.return_value = response
        client.search.return_value = ([candidate], {"cantidad_resultados": 1})
        output = self.root / "review"
        health = {"carrefour": {"disponible": True, "metodo_ean_verificado": True}}
        with patch("candidatos_imagenes.ReviewClient", return_value=client), patch("candidatos_imagenes.diagnose", return_value=health):
            result = run_review(self.root, [row], output, ["carrefour"], max_per_source=1)
            self.assertEqual(result["candidatos_guardados"], 1)
            self.assertEqual(result["publicados"], 0)
            self.assertEqual(client.search.call_args.args[2], "texto")
            count = client.request.call_count
            run_review(self.root, [row], output, ["carrefour"], max_per_source=1)
            self.assertEqual(client.request.call_count, count)
        self.assertEqual([self.catalog.read_bytes(), manifest.read_bytes(), existing.read_bytes()], before)
        record = json.loads((output / "candidatos.json").read_text())[0]
        self.assertEqual(record["ean_original"], "invalid")
        self.assertEqual(record["estado"], "pendiente_revision")
        self.assertTrue((output / record["archivo"]).is_file())
        self.assertTrue((output / "revision.html").is_file())

    def test_reject_public_review_folder(self):
        with self.assertRaises(ValueError):
            run_review(self.root, [], self.root / "public/review", ["dia"])

    def test_wrong_brand_model_name_is_rejected(self):
        self.assertFalse(brand_compatible("Elite", "Donic", "Pelotas Donic Elite x6"))
        self.assertTrue(brand_compatible("Felfort", "FEL-FORT", "Chocolate"))

    def test_default_processes_more_than_ten_including_bad_ean(self):
        rows = [{"sku": str(i), "productId": f"sku:{i}", "nombre": f"Producto {i}", "ean": "", "ean_estado": "ausente", "tiene_imagen": False} for i in range(15)]
        health = {"la-anonima": {"disponible": False, "estado": "bloqueo", "error": "HTTP 403"}}
        with patch("candidatos_imagenes.ReviewClient"), patch("candidatos_imagenes.diagnose", return_value=health):
            result = run_review(self.root, rows, self.root / "review", ["la-anonima"])
        self.assertEqual(result["productos_procesados"], 15)
        self.assertEqual(result["estados"]["sin_candidatos_con_errores"], 15)


if __name__ == "__main__":
    unittest.main()
