"""Audita el catálogo y descarga candidatos aislados para revisión manual.

Sin --descargar o --diagnosticar no consulta internet. Nunca publica candidatos.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys

import pandas as pd
from PIL import Image

from sincronizar_catalogo import columna, identificador, limpiar_ean

ROOT = Path(__file__).resolve().parents[1]


def ean_valido(ean: str) -> bool:
    if len(ean) not in (8, 12, 13, 14) or not ean.isascii() or not ean.isdigit() or not int(ean):
        return False
    total = sum(int(char) * (3 if i % 2 == 0 else 1) for i, char in enumerate(reversed(ean[:-1])))
    return (10 - total % 10) % 10 == int(ean[-1])


def leer_json(path: Path, default=None):
    if not path.exists() and default is not None:
        return default
    return json.loads(path.read_text(encoding="utf-8-sig"))


def imagen_valida(path: Path) -> bool:
    try:
        with Image.open(path) as image:
            image.verify()
        return True
    except (OSError, ValueError, Image.DecompressionBombError):
        return False


def imagen_publica(root: Path, url: str) -> bool:
    if not url.startswith("/") or url.startswith("//"):
        return False
    public = (root / "public").resolve()
    path = (public / url.lstrip("/")).resolve()
    return path.is_relative_to(public) and imagen_valida(path)


def indice(asociaciones: list[dict]) -> dict:
    result = {}
    for item in asociaciones:
        for key, field in (("id", "productId"), ("sku", "sku"), ("ean", "barcode")):
            value = str(item.get(field) or "").strip().lower()
            if value:
                result[(key, value)] = item
    return result


def asociacion(product: dict, index: dict, ean_counts: Counter, unique_ean=False):
    keys = [("id", product["id"]), ("sku", str(product.get("sku") or ""))]
    ean = str(product.get("barcode") or "")
    if not unique_ean or ean_counts[ean] == 1:
        keys.append(("ean", ean))
    return next((index[(key, value.lower())] for key, value in keys if value and (key, value.lower()) in index), None)


def leer_maestro(path: Path | None) -> dict[str, set[str]]:
    if path is None:
        return {}
    if not path.is_file():
        raise FileNotFoundError(f"Falta el maestro de EAN: {path}")
    df = pd.read_excel(path, dtype=str, keep_default_na=False, engine="openpyxl")
    code, ean = columna(df, "codigo"), columna(df, "ean")
    result = {}
    for _, row in df.iterrows():
        key = identificador(row[code])
        value = limpiar_ean(row[ean])
        if key and value:
            result.setdefault(key, set()).add(value)
    return result


def auditar(root: Path, catalog_path: Path, maestro: dict | None = None) -> list[dict]:
    products = leer_json(catalog_path)["products"]
    local = indice(leer_json(root / "public/data/product-image-local.json", {"associations": []})["associations"])
    approved = indice([a for a in leer_json(root / "public/data/product-image-associations.json", {"associations": []})["associations"] if a.get("status") == "approved"])
    counts = Counter(str(p.get("barcode") or "") for p in products)
    # Un maestro opcional solo completa EAN ausentes; nunca cambia códigos existentes.
    effective_eans = []
    for product in products:
        value = limpiar_ean(product.get("barcode"))
        bridge = (maestro or {}).get(identificador(product.get("sku")), set())
        if not str(product.get("barcode") or "").strip() and len(bridge) == 1:
            value = next(iter(bridge))
        effective_eans.append(value)
    effective_counts = Counter(effective_eans)
    result = []
    for product, ean in zip(products, effective_eans):
        record = asociacion(product, local, counts)
        origin = "manifiesto-local"
        if record is None:
            record = asociacion(product, approved, counts, unique_ean=True)
            origin = "open-food-facts-aprobada"
        url = str(record.get("imageUrl") or "") if record else ""
        if record is None and product.get("imageSource") == "local-ean":
            url = str(product.get("image") or "")
            origin = "catalogo-local"
        present = bool(url and imagen_publica(root, url))
        # Una URL aprobada remota no se cuenta como foto verificada sin comprobarla.
        state = "valido"
        if not ean:
            state = "invalido" if str(product.get("barcode") or "").strip() else "ausente"
        elif not ean_valido(ean):
            state = "invalido"
        elif effective_counts[ean] > 1:
            state = "duplicado"
        local_file = root / "public/products" / f"{ean}.webp" if ean else None
        result.append({
            "productId": product["id"], "sku": str(product.get("sku") or ""),
            "nombre": product["name"], "marca": str(product.get("brand") or ""), "ean": ean, "ean_original": str(product.get("barcode") or ""), "ean_estado": state,
            "tiene_imagen": present, "imagen_actual": url,
            "origen": origin if url else "sin-asociacion",
            "archivo_local_reutilizable": bool(state == "valido" and local_file and imagen_valida(local_file)),
            "descargable": not present and state == "valido",
            "motivo": "" if present else "archivo ausente o ilegible" if url else "sin imagen aprobada asociada",
        })
    return result


def guardar_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    try:
        temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def resumen(rows: list[dict]) -> dict:
    missing = [row for row in rows if not row["tiene_imagen"]]
    return {
        "productos": len(rows), "con_imagen_local_verificada": len(rows) - len(missing),
        "sin_imagen": len(missing), "faltantes_con_ean_valido_unico": sum(row["descargable"] for row in missing),
        "ean_ausente_o_invalido": sum(row["ean_estado"] in ("ausente", "invalido") for row in missing),
        "ean_duplicado": sum(row["ean_estado"] == "duplicado" for row in missing),
    }


def informar(output: Path, rows: list[dict], results: list[dict]) -> None:
    output.mkdir(parents=True, exist_ok=True)
    guardar_json(output / "auditoria.json", {"resumen": resumen(rows), "productos": rows, "resultados": results})
    df = pd.DataFrame(rows)
    df.loc[~df["tiene_imagen"]].to_csv(output / "faltantes_imagenes.csv", index=False, encoding="utf-8-sig")
    df.loc[~df["tiene_imagen"] & df["ean_estado"].ne("valido")].to_csv(output / "revisar_ean.csv", index=False, encoding="utf-8-sig")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raiz", type=Path, default=ROOT)
    parser.add_argument("--catalogo", type=Path, default=Path("public/data/catalog-posberry.json"))
    parser.add_argument("--maestro", type=Path, help="Excel opcional con código interno y EAN para completar códigos ausentes")
    parser.add_argument("--salida", type=Path, default=Path("revision_imagenes"))
    parser.add_argument("--limite", type=int, default=0, help="Máximo de productos faltantes a procesar; 0 = todos, incluidos los EAN problemáticos")
    parser.add_argument("--fuentes", nargs="+", choices=["carrefour", "dia", "jumbo", "la-anonima"], default=["carrefour", "dia", "jumbo", "la-anonima"])
    parser.add_argument("--max-por-fuente", type=int, default=2, help="Candidatos por producto y fuente")
    parser.add_argument("--reintentar", action="store_true", help="Reconsulta productos que ya tienen candidatos, sin sobrescribir archivos")
    parser.add_argument("--sku", nargs="+", help="Opcional: probar solo estos SKU; omitir para procesar todos los faltantes")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--auditar", action="store_true", help="Solo revisa archivos locales; es el modo predeterminado")
    mode.add_argument("--descargar", action="store_true", help="Busca por EAN y texto; guarda candidatos fuera de public/, sin integrarlos")
    mode.add_argument("--diagnosticar", action="store_true", help="Prueba cada fuente con un producto conocido y registra HTTP/JSON/resultados")
    args = parser.parse_args(argv)
    if args.max_por_fuente < 1:
        parser.error("--max-por-fuente debe ser mayor a cero")
    if args.limite < 0:
        parser.error("--limite no puede ser negativo")
    root = args.raiz.resolve()
    catalog_path, output = root / args.catalogo, root / args.salida
    if not catalog_path.is_file():
        raise FileNotFoundError(f"Falta el catálogo: {catalog_path}")
    before = hashlib.sha256(catalog_path.read_bytes()).hexdigest()
    manifests = [root / "public/data/product-image-local.json", root / "public/data/product-image-associations.json"]
    original_manifests = {path: path.read_bytes() if path.exists() else None for path in manifests}
    rows = auditar(root, catalog_path, leer_maestro(args.maestro))
    if output.resolve().is_relative_to((root / "public").resolve()):
        parser.error("La carpeta de revisión no puede estar dentro de public/")
    informar(output, rows, [])
    print(json.dumps(resumen(rows), ensure_ascii=False, indent=2))
    print(f"Informes: {output}")
    if args.descargar or args.diagnosticar:
        from candidatos_imagenes import run_review
        selected = rows if not args.sku else [row for row in rows if row["sku"] in args.sku]
        if args.sku and set(args.sku) - {row["sku"] for row in selected}:
            parser.error("Hay SKU solicitados que no existen en el catálogo")
        summary = run_review(root, selected, output, args.fuentes, args.limite, args.max_por_fuente, args.diagnosticar, args.reintentar)
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    if hashlib.sha256(catalog_path.read_bytes()).hexdigest() != before:
        raise RuntimeError("El catálogo cambió durante el proceso; revisar antes de continuar")
    if any((path.read_bytes() if path.exists() else None) != content for path, content in original_manifests.items()):
        raise RuntimeError("Un manifiesto publicado cambió durante el proceso; revisar antes de continuar")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, RuntimeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1)
