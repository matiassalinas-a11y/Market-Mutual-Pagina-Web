"""Fuentes públicas y descargas aisladas para revisión manual. Nunca publica fotos."""
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
from html import escape
from html.parser import HTMLParser
from io import BytesIO
import json
from pathlib import Path
import re
import time
import unicodedata
from urllib.parse import quote, urlencode

import pandas as pd
import requests
from PIL import Image, ImageOps

SOURCES = {
    "carrefour": "https://www.carrefour.com.ar/api/catalog_system/pub/products/search",
    "dia": "https://diaonline.supermercadosdia.com.ar/api/catalog_system/pub/products/search",
    "jumbo": "https://www.jumbo.com.ar/api/catalog_system/pub/products/search",
    # Ruta observada en el JavaScript público del buscador de La Anónima.
    "la-anonima": "https://www.laanonima.com.ar/catalogo/buscador/",
}
BRANDS = ["coca cola", "la serenisima", "la virginia", "smartlife", "smart life", "felfort", "bubbaloo", "misky", "hellmanns", "peabody", "liliana", "benidorm", "marolio", "molto", "luchetti", "cachafaz", "rexona", "colgate", "elite", "arcor", "cofler", "tuy", "kos", "uvita", "bodega privada", "san agustin"]


def norm(value):
    return " ".join(re.sub(r"[^a-z0-9.,]+", " ", "".join(c for c in unicodedata.normalize("NFKD", str(value or "").lower()) if not unicodedata.combining(c))).split())


def words(value):
    return set(re.findall(r"[a-z]{3,}", norm(value))) - {"con", "para", "por", "del", "sin", "grs", "lts"}


def details(product):
    name = norm(product["nombre"])
    name = re.sub(r"\bfideoeos\b|\bfid\b", "fideos", name)
    name = re.sub(r"\bgalle\b", "galletitas", name)
    name = re.sub(r"\balf\b", "alfajor", name)
    name = re.sub(r"\blv\b", "la virginia", name)
    name = re.sub(r"\bls\b", "la serenisima", name)
    brand = norm(product.get("marca")) or next((b for b in BRANDS if b in name), "")
    if brand and brand not in name:
        name += " " + brand
    quantity = re.findall(r"\d+(?:[.,]\d+)?\s*(?:kg|grs?|g|ml|cc|lts?|l)\b|\bx\s*\d+\b", name)
    reduced = re.sub(r"\d+(?:[.,]\d+)?\s*(?:kg|grs?|g|ml|cc|lts?|l)\b|\bx\s*\d+\b", " ", name)
    reduced = " ".join(w for w in reduced.split() if w not in {"bolsa", "bolsitas", "pack", "surtido", "tet", "nvo"})
    broad_words = [w for w in re.findall(r"[a-z]{3,}", reduced) if w not in {"con", "sin", "para", "del"}]
    broad = brand or " ".join(broad_words[:2])
    queries = list(dict.fromkeys(q.strip() for q in [name, reduced, broad] if q.strip()))
    return {"nombre_busqueda": name, "marca": brand, "presentacion": "; ".join(quantity), "consultas": queries}


class SourceError(Exception):
    def __init__(self, state, message):
        super().__init__(message)
        self.state = state


class ProductPage(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ld = False
        self.buffer = ""
        self.images = []
        self.og_image = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self.ld, self.buffer = True, ""
        if tag == "meta" and attrs.get("property") == "og:image":
            self.og_image = attrs.get("content", "")

    def handle_data(self, data):
        if self.ld:
            self.buffer += data

    def handle_endtag(self, tag):
        if tag != "script" or not self.ld:
            return
        self.ld = False
        try:
            data = json.loads(self.buffer)
        except ValueError:
            return
        def visit(item):
            if isinstance(item, list):
                for entry in item:
                    visit(entry)
            elif isinstance(item, dict):
                if "Product" in str(item.get("@type", "")):
                    images = item.get("image", [])
                    if isinstance(images, str): images = [images]
                    if isinstance(images, dict): images = [images]
                    self.images.extend(i.get("url", "") if isinstance(i, dict) else i for i in images)
                visit(item.get("@graph", []))
        visit(data)


def parse_products(source, data):
    result = []
    if source == "la-anonima":
        if not isinstance(data, dict) or not isinstance(data.get("articulos"), list):
            raise SourceError("respuesta_inesperada", "Se esperaba JSON con articulos[]")
        for item in data["articulos"]:
            if not isinstance(item, dict) or not item.get("titulo") or not item.get("codAnonima"):
                raise SourceError("respuesta_inesperada", "Artículo sin titulo/codAnonima")
            result.append({"nombre": item["titulo"], "marca": "", "ean": "", "url_producto": f"https://www.laanonima.com.ar/art_{quote(str(item['codAnonima']))}", "url_imagen": ""})
        return result
    if not isinstance(data, list):
        raise SourceError("respuesta_inesperada", "Se esperaba una lista JSON VTEX")
    for product in data:
        if not isinstance(product, dict) or not isinstance(product.get("items"), list) or not product.get("productName"):
            raise SourceError("respuesta_inesperada", "Producto VTEX sin productName/items[]")
        for item in product["items"]:
            if not isinstance(item, dict) or not isinstance(item.get("images"), list):
                raise SourceError("respuesta_inesperada", "SKU VTEX sin images[]")
            for image in item["images"][:1]:
                if not isinstance(image, dict) or not isinstance(image.get("imageUrl"), str):
                    raise SourceError("respuesta_inesperada", "Imagen VTEX sin imageUrl")
                result.append({"nombre": item.get("nameComplete") or product["productName"], "marca": product.get("brand", ""), "ean": str(item.get("ean") or ""), "url_producto": product.get("link", ""), "url_imagen": image["imageUrl"]})
    return result


class ReviewClient:
    def __init__(self, output, delay=1.5):
        self.output, self.delay = output, delay
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "MarketCatalogReview/2.0", "Accept": "application/json,text/html;q=0.9,image/*;q=0.8"})
        self.last = 0.0
        self.context = {}

    def log(self, entry):
        entry = {"fecha": datetime.now(timezone.utc).isoformat(), **self.context, **entry}
        self.output.mkdir(parents=True, exist_ok=True)
        with (self.output / "consultas.jsonl").open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def request(self, source, url, params=None, kind="json"):
        time.sleep(max(0, self.delay - (time.monotonic() - self.last)))
        entry = {"fuente": source, "url": url, "parametros": params, "http": None, "tipo_respuesta": None, "cantidad_resultados": None, "cantidad_candidatos": None}
        try:
            # Estas rutas VTEX rechazan ft=coca+cola; usan espacios RFC 3986 (%20).
            request_url = url + ("?" + urlencode(params, quote_via=quote) if params else "")
            response = self.session.get(request_url, timeout=(8, 20))
            self.last = time.monotonic()
            content_type = response.headers.get("Content-Type", "")
            entry.update(url_final=response.url, http=response.status_code, content_type=content_type, tipo_respuesta="html" if "html" in content_type.lower() else "json_sin_validar" if "json" in content_type.lower() else "no_informado")
            if response.status_code in (401, 403, 429):
                raise SourceError("bloqueo", f"HTTP {response.status_code}")
            if response.status_code < 200 or response.status_code >= 300:
                raise SourceError("error_http", f"HTTP {response.status_code}")
            if kind != "json":
                entry.update(tipo_respuesta=kind, estado="ok")
                self.log(entry)
                return response
            try:
                data = response.json()
            except ValueError as error:
                entry["tipo_respuesta"] = "html" if "html" in entry["content_type"].lower() else "no_json"
                if any(marker in response.text[:20000].lower() for marker in ("captcha", "access denied", "just a moment")):
                    raise SourceError("bloqueo", "Desafío o página de acceso en lugar de JSON") from error
                raise SourceError("respuesta_inesperada", "No se recibió JSON") from error
            entry["tipo_respuesta"] = "json_" + type(data).__name__
            products = parse_products(source, data)
            count = len(data) if source != "la-anonima" else len(data["articulos"])
            entry.update(cantidad_resultados=count, cantidad_candidatos=len(products), estado="ok" if count else "sin_coincidencias")
            self.log(entry)
            return products, entry
        except requests.RequestException as error:
            self.last = time.monotonic()
            entry.update(estado="error_red", error=str(error))
            self.log(entry)
            raise SourceError("error_red", str(error)) from error
        except SourceError as error:
            entry.update(estado=error.state, error=str(error))
            self.log(entry)
            error.entry = entry
            raise

    def search(self, source, query, method):
        if source == "la-anonima":
            return self.request(source, SOURCES[source] + quote(query, safe=""), {"autocomplete": 1, "cp": "default", "ele": "", "sup": ""})
        params = {"_from": 0, "_to": 11}
        params.update({"fq": "alternateIds_Ean:" + query} if method == "ean" else {"ft": query})
        return self.request(source, SOURCES[source], params)


def diagnose(client, sources):
    report = {}
    for source in sources:
        client.context = {"etapa": "diagnostico", "consulta": "coca cola", "metodo": "texto"}
        try:
            products, entry = client.search(source, "coca cola", "texto")
            if not products:
                report[source] = {**entry, "disponible": False, "estado": "control_sin_resultados"}
                continue
            report[source] = {**entry, "disponible": True, "producto_control": products[0]["nombre"], "ean_control": products[0]["ean"], "metodo_ean_verificado": False}
            if source != "la-anonima" and products[0]["ean"]:
                ean = products[0]["ean"]
                client.context = {"etapa": "diagnostico", "consulta": ean, "metodo": "ean"}
                try:
                    returned, control = client.search(source, ean, "ean")
                    report[source]["control_ean"] = control
                    report[source]["metodo_ean_verificado"] = any(p["ean"] == ean for p in returned)
                except SourceError as error:
                    report[source]["control_ean"] = {"estado": error.state, "error": str(error)}
        except SourceError as error:
            report[source] = {**getattr(error, "entry", {}), "disponible": False, "estado": error.state, "error": str(error)}
    client.context = {}
    (client.output / "diagnostico_fuentes.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report


def quantity(value):
    output = set()
    text = norm(value)
    text = re.sub(r"\b(\d+)\s*x\s*\d+\s*(?:uni(?:dades)?|uds?|un|u)\b", r"\1 un", text)
    for number, unit in re.findall(r"(\d+(?:[.,]\d+)?)\s*(kg|grs?|g|ml|cc|lts?|l|uni(?:dades)?|uds?|un|u)\b", text):
        amount = float(number.replace(",", "."))
        dimension = "volumen" if unit in ("ml", "cc", "l", "lt", "lts") else "peso" if unit in ("kg", "g", "gr", "grs") else "unidades"
        output.add((dimension, round(amount * (1000 if unit in ("kg", "l", "lt", "lts") else 1), 3)))
    output.update(("unidades", float(n)) for n in re.findall(r"\bx\s*(\d+)\b", text))
    return output


def brand_compatible(expected, actual, name):
    compact = lambda value: re.sub(r"[^a-z0-9]", "", norm(value))
    expected, actual = compact(expected), compact(actual)
    if not expected:
        return True
    if actual and actual not in ("sinmarca", "generico"):
        return expected in actual or actual in expected
    return expected in compact(name)


def rank(product, candidate, detail):
    exact = bool(product.get("ean") and product["ean"] == candidate["ean"])
    overlap = len(words(detail["nombre_busqueda"]) & words(candidate["nombre"]))
    brand = bool(detail["marca"] and brand_compatible(detail["marca"], candidate["marca"], candidate["nombre"]))
    return (1000 if exact else 0) + overlap * 2 + (10 if brand else 0)


def save_candidate(client, source, sku, candidate, output):
    url = candidate["url_imagen"]
    if not url.startswith("https://"):
        raise SourceError("imagen_no_disponible", "La imagen no tiene URL HTTPS")
    safe_sku = re.sub(r"[^a-zA-Z0-9_-]", "_", sku)
    folder = output / "candidatos" / safe_sku
    folder.mkdir(parents=True, exist_ok=True)
    destination = folder / f"{source}-{sha256(url.encode()).hexdigest()[:16]}.webp"
    if destination.exists():
        if review_file_valid(destination):
            return destination, False
        destination = destination.with_name(destination.stem + "-recuperada-" + datetime.now().strftime("%Y%m%d%H%M%S%f") + ".webp")
    response = client.request(source, url, kind="imagen")
    if "html" in response.headers.get("Content-Type", "").lower():
        raise SourceError("respuesta_inesperada", "La descarga de imagen devolvió HTML")
    if len(response.content) > 20_000_000:
        raise SourceError("imagen_invalida", "Imagen mayor a 20 MB")
    try:
        with Image.open(BytesIO(response.content)) as image:
            image = ImageOps.exif_transpose(image).convert("RGBA")
            image.thumbnail((1200, 1200))
            canvas = Image.new("RGB", image.size, "white")
            canvas.paste(image, mask=image.getchannel("A"))
            buffer = BytesIO()
            canvas.save(buffer, "WEBP", quality=92)
        # Creación exclusiva: jamás reemplaza un candidato anterior.
        with destination.open("xb") as file:
            file.write(buffer.getvalue())
    except (OSError, ValueError, Image.DecompressionBombError) as error:
        raise SourceError("imagen_invalida", str(error)) from error
    return destination, True


def review_file_valid(path):
    try:
        with Image.open(path) as image:
            image.verify()
        return True
    except (OSError, ValueError, Image.DecompressionBombError):
        return False


def write_reports(output, candidates, products):
    for candidate in candidates:
        if candidate["metodo"] != "ean-exacto" and not brand_compatible(candidate.get("marca_esperada", ""), candidate.get("marca_candidata", ""), candidate["nombre_candidato"]):
            candidate["estado"] = "descartado_marca_distinta"
            candidate["advertencias"] = "La marca devuelta no corresponde a la marca del producto; no es un candidato útil"
        expected, actual = quantity(candidate["producto"]), quantity(candidate["nombre_candidato"])
        if expected and actual and expected != actual and "Presentación diferente" not in candidate["advertencias"]:
            candidate["advertencias"] += "; Presentación diferente"
    (output / "candidatos.json").write_text(json.dumps(candidates, ensure_ascii=False, indent=2), encoding="utf-8")
    (output / "productos.json").write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8")
    fields = list(candidates[0]) if candidates else ["sku", "producto", "fuente", "url_producto", "url_imagen", "metodo", "archivo", "estado", "advertencias"]
    pd.DataFrame(candidates, columns=fields).to_csv(output / "candidatos.csv", index=False, encoding="utf-8-sig")
    pd.DataFrame(products).to_csv(output / "productos.csv", index=False, encoding="utf-8-sig")
    html = ['<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Candidatos para revisión</title><style>body{font:16px system-ui;background:#f4f8fc;color:#16385f;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}article{background:white;padding:20px;border-radius:16px}img{width:100%;height:240px;object-fit:contain}small{display:block;margin:8px 0}</style><h1>Imágenes candidatas</h1><p>Pendientes de revisión manual. No están publicadas en la tienda.</p><main>']
    for candidate in candidates:
        if candidate.get("estado") != "pendiente_revision":
            continue
        html.append(f'<article><h2>SKU {escape(candidate["sku"])} — {escape(candidate["producto"])}</h2><img loading="lazy" src="{escape(candidate["archivo"], quote=True)}" alt="{escape(candidate["nombre_candidato"], quote=True)}"><p>{escape(candidate["nombre_candidato"])}</p><small>{escape(candidate["fuente"])} · {escape(candidate["metodo"])} · Consulta: {escape(candidate["consulta"])}</small><p>{escape(candidate["advertencias"])}</p><a target="_blank" rel="noreferrer" href="{escape(candidate["url_producto"], quote=True)}">Producto fuente</a> · <a target="_blank" rel="noreferrer" href="{escape(candidate["url_imagen"], quote=True)}">Imagen original</a></article>')
    html.append("</main></html>")
    (output / "revision.html").write_text("".join(html), encoding="utf-8")


def run_review(root, rows, output, sources, limit=0, max_per_source=2, diagnose_only=False, retry=False):
    output = output.resolve()
    if output.is_relative_to((root / "public").resolve()):
        raise ValueError("La carpeta de revisión debe estar fuera de public/ para no publicar candidatos")
    output.mkdir(parents=True, exist_ok=True)
    client = ReviewClient(output)
    candidates_path, products_path = output / "candidatos.json", output / "productos.json"
    candidates = json.loads(candidates_path.read_text(encoding="utf-8")) if candidates_path.exists() else []
    products = json.loads(products_path.read_text(encoding="utf-8")) if products_path.exists() else []
    try:
        health = diagnose(client, sources)
        print(json.dumps({"fuentes": health}, ensure_ascii=False, indent=2), flush=True)
        if diagnose_only:
            return {"diagnostico": health}
        missing = [r for r in rows if not r["tiene_imagen"]]
        chosen = missing[:limit or None]
        for number, product in enumerate(chosen, 1):
            sku = product["sku"] or product["productId"]
            fingerprint = sha256(json.dumps({k: product.get(k) for k in ("nombre", "ean", "marca")}, sort_keys=True).encode()).hexdigest()
            previous = next((p for p in products if p["sku"] == sku), None)
            saved = [c for c in candidates if c["sku"] == sku and c.get("estado") == "pendiente_revision" and review_file_valid(output / c["archivo"])]
            if not retry and previous and previous.get("fingerprint") == fingerprint and saved:
                print(f"[{number}/{len(chosen)}] {sku}: candidatos existentes; se conservan", flush=True)
                continue
            print(f"[{number}/{len(chosen)}] {sku}: {product['nombre']}", flush=True)
            detail, errors, found = details(product), [], 0
            for source in sources:
                if not health[source]["disponible"]:
                    errors.append({"fuente": source, "estado": "fuente_no_disponible", "motivo": health[source].get("error") or health[source].get("estado")})
                    continue
                queries = []
                if product.get("ean") and product.get("ean_estado") in ("valido", "duplicado") and health[source].get("metodo_ean_verificado"):
                    queries.append(("ean", product["ean"]))
                queries += [("texto", q) for q in detail["consultas"]]
                accepted, seen = 0, set()
                for method, query in queries:
                    client.context = {"etapa": "busqueda", "sku": sku, "producto": product["nombre"], "metodo": method, "consulta": query}
                    try:
                        options, query_log = client.search(source, query, method)
                        if query_log["cantidad_resultados"] and not options:
                            errors.append({"fuente": source, "estado": "resultados_sin_imagen", "consulta": query})
                        if method == "ean":
                            options = [c for c in options if c["ean"] == product["ean"]]
                        else:
                            options = [c for c in options if rank(product, c, detail) > 0 and ((bool(product.get("ean")) and c["ean"] == product["ean"]) or brand_compatible(detail["marca"], c["marca"], c["nombre"]))]
                        options.sort(key=lambda c: rank(product, c, detail), reverse=True)
                        for candidate in options:
                            if candidate["url_producto"] in seen:
                                continue
                            seen.add(candidate["url_producto"])
                            if not candidate["url_imagen"] and source == "la-anonima":
                                response = client.request(source, candidate["url_producto"], kind="html_producto")
                                page = ProductPage()
                                page.feed(response.text)
                                candidate["url_imagen"] = next((u for u in page.images if isinstance(u, str) and u.startswith("https://")), "")
                            if not candidate["url_imagen"]:
                                errors.append({"fuente": source, "estado": "imagen_no_disponible", "motivo": candidate["url_producto"]})
                                continue
                            file, downloaded = save_candidate(client, source, sku, candidate, output)
                            expected, actual = quantity(product["nombre"]), quantity(candidate["nombre"])
                            exact = bool(product.get("ean") and product["ean"] == candidate["ean"])
                            warnings = []
                            if not exact: warnings.append("Coincidencia por texto: verificar producto, marca, variante y presentación")
                            specific = words(detail["nombre_busqueda"]) - words(detail["marca"]) - {"bolsa", "bolsitas", "surtido"}
                            if not exact and detail["marca"] and specific and not specific & words(candidate["nombre"]): warnings.append("Solo coincide la marca; el tipo o variante no están confirmados")
                            if product["ean_estado"] != "valido": warnings.append("EAN original " + product["ean_estado"])
                            if expected and actual and expected != actual: warnings.append("Presentación diferente")
                            if detail["marca"] and not brand_compatible(detail["marca"], candidate["marca"], candidate["nombre"]): warnings.append("Marca no confirmada")
                            record = {"sku": sku, "producto": product["nombre"], "ean_original": product.get("ean_original", ""), "ean_estado": product["ean_estado"], "marca_esperada": detail["marca"], "presentacion_esperada": detail["presentacion"], "fuente": source, "consulta": query, "metodo": "ean-exacto" if exact else "nombre-marca-variante-presentacion", "nombre_candidato": candidate["nombre"], "marca_candidata": candidate["marca"], "ean_candidato": candidate["ean"], "url_producto": candidate["url_producto"], "url_imagen": candidate["url_imagen"], "archivo": file.relative_to(output).as_posix(), "advertencias": "; ".join(warnings) or "Verificar visualmente antes de aprobar", "estado": "pendiente_revision", "nueva_descarga": downloaded}
                            previous_candidate = next((c for c in candidates if c["sku"] == sku and c["url_imagen"] == record["url_imagen"] and c["fuente"] == source), None)
                            if previous_candidate is None:
                                candidates.append(record)
                            else:
                                previous_candidate.update(record)
                            accepted += 1
                            found += 1
                            if accepted >= max_per_source: break
                    except SourceError as error:
                        errors.append({"fuente": source, "metodo": method, "consulta": query, "estado": error.state, "motivo": str(error)})
                        if error.state == "bloqueo":
                            health[source] = {"disponible": False, "estado": error.state, "error": str(error)}
                            break
                    if accepted >= max_per_source: break
                write_reports(output, candidates, products)
            state = "con_candidatos" if found or saved else "sin_candidatos_con_errores" if errors else "sin_coincidencias"
            product_result = {"sku": sku, "producto": product["nombre"], "ean_estado": product["ean_estado"], "fingerprint": fingerprint, "estado": state, "candidatos_encontrados": found, "incidencias": errors}
            products = [p for p in products if p["sku"] != sku] + [product_result]
            write_reports(output, candidates, products)
        summary = {"faltantes_en_catalogo": len(missing), "productos_procesados": len(products), "productos_con_candidatos": len({c["sku"] for c in candidates if c["estado"] == "pendiente_revision"}), "candidatos_guardados": len(candidates), "candidatos_para_revision": sum(c["estado"] == "pendiente_revision" for c in candidates), "estados": dict(Counter(p["estado"] for p in products)), "carpeta": str(output), "publicados": 0}
        (output / "resumen.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        return summary
    except KeyboardInterrupt:
        write_reports(output, candidates, products)
        print("Interrumpido: candidatos e informes conservados; repetir el comando para continuar.")
        return {"interrumpido": True, "publicados": 0}
    finally:
        client.session.close()
