"""Cruza inventario y descarga imágenes VTEX. Ejecutar desde la raíz del proyecto.

Instalación: python -m pip install pandas openpyxl requests Pillow
Uso: python scripts/sincronizar_catalogo.py
Sólo cruce: python scripts/sincronizar_catalogo.py --solo-cruce
Columnas manuales (nombres exactos impresos al leer los Excel):
  --clave-maestro "*Codigo" --clave-stock "Código" --ean "EAN"
  --nombre-maestro "*Descripcion" --nombre-stock "Nombre" --stock "Stock"

Las coincidencias por nombre usan el primer producto devuelto por la tienda;
conviene revisar esas imágenes porque pueden corresponder a otra presentación.
"""

from __future__ import annotations

import argparse
from decimal import Decimal, InvalidOperation
from io import BytesIO
from pathlib import Path
import re
import time
import unicodedata

import pandas as pd
import requests
from PIL import Image, ImageOps


TIENDAS = (
    "https://www.carrefour.com.ar/api/catalog_system/pub/products/search",
    "https://diaonline.supermercadosdia.com.ar/api/catalog_system/pub/products/search",
)
ALIAS = {
    "codigo": ("codigo", "codigo interno", "cod producto", "codigo producto", "sku", "id producto", "id"),
    "nombre": ("nombre", "descripcion", "nombre producto", "nombre del producto", "producto", "articulo"),
    "ean": ("ean", "codigo de barras", "codigo barras", "cod barras", "barcode", "gtin", "ean13", "ean 13"),
    "stock": ("stock", "stock actual", "existencia", "existencias", "cantidad", "saldo"),
}


def normalizar(valor: object) -> str:
    if pd.isna(valor):
        return ""
    texto = unicodedata.normalize("NFKD", str(valor))
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return " ".join(texto.upper().split())


def encabezado(valor: object) -> str:
    return re.sub(r"[^A-Z0-9]+", " ", normalizar(valor)).strip()


def columna(df: pd.DataFrame, tipo: str, manual: str | None = None,
            requerida: bool = True) -> str | None:
    if manual is not None:
        if manual not in df.columns:
            raise ValueError(f"No existe la columna {manual!r}. Disponibles: {list(df.columns)}")
        return manual
    for alias in ALIAS[tipo]:
        candidatas = [c for c in df.columns if encabezado(c) == encabezado(alias)]
        if len(candidatas) > 1:
            raise ValueError(f"Columnas ambiguas para {tipo}: {candidatas}. Indicá una manualmente.")
        if candidatas:
            return candidatas[0]
    if requerida:
        raise ValueError(f"No se detectó {tipo}. Indicá su columna manualmente. Disponibles: {list(df.columns)}")
    return None


def identificador(valor: object) -> str:
    texto = normalizar(valor)
    # Quita únicamente la parte decimal nula; conserva ceros iniciales de texto.
    return re.sub(r"\.0+$", "", texto)


def limpiar_ean(valor: object) -> str:
    texto = re.sub(r"\s+", "", identificador(valor))
    if "E" in texto:
        try:
            numero = Decimal(texto)
            if numero.is_finite() and numero == numero.to_integral_value():
                texto = format(numero, "f").split(".")[0]
        except InvalidOperation:
            pass
    return texto if re.fullmatch(r"[0-9]{8,14}", texto) else ""


def cantidad(valor: object) -> float:
    if pd.isna(valor) or not str(valor).strip():
        return 0.0
    texto = re.sub(r"\s+", "", str(valor))
    # Coma decimal argentina (y punto de miles cuando ambos están presentes).
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    try:
        numero = float(texto)
    except ValueError as exc:
        raise ValueError(f"Stock no numérico: {valor!r}. Corregí el Excel antes de continuar.") from exc
    if not (-float("inf") < numero < float("inf")):
        raise ValueError(f"Stock no finito: {valor!r}")
    return numero


def cruzar(maestro: pd.DataFrame, stock: pd.DataFrame, args: argparse.Namespace) -> pd.DataFrame:
    ean_col = columna(maestro, "ean", args.ean)
    nm = columna(maestro, "nombre", args.nombre_maestro)
    ns = columna(stock, "nombre", args.nombre_stock, requerida=False)
    sc = columna(stock, "stock", args.stock)
    cm = columna(maestro, "codigo", args.clave_maestro, requerida=False)
    cs = columna(stock, "codigo", args.clave_stock, requerida=False)
    if bool(args.clave_maestro) != bool(args.clave_stock):
        raise ValueError("Indicá juntas --clave-maestro y --clave-stock.")
    if not (cm and cs):
        cm, cs = nm, ns
    if not cm or not cs:
        raise ValueError("No se encontró una clave común. Usá --clave-maestro y --clave-stock.")
    print(f"Cruce: maestro[{cm!r}] = stock[{cs!r}]; EAN: {ean_col!r}; stock: {sc!r}")
    claves = pd.DataFrame({
        "_clave": maestro[cm].map(identificador),
        "_nombre_maestro": maestro[nm].fillna("").astype(str).str.strip(),
        "EAN": maestro[ean_col].map(limpiar_ean),
    })
    claves = claves.loc[claves["_clave"].ne("")].copy()
    # Un merge muchos-a-muchos multiplicaría cantidades de inventario.
    ambiguas = set(claves.groupby("_clave")["EAN"].nunique().loc[lambda x: x > 1].index)
    claves = claves.drop_duplicates("_clave")
    claves["estado_cruce"] = claves["_clave"].map(
        lambda k: "clave ambigua en maestro" if k in ambiguas else "coincidencia"
    )
    claves.loc[claves["_clave"].isin(ambiguas), "EAN"] = ""
    activos = stock.copy()
    activos["_stock"] = activos[sc].map(cantidad)
    activos = activos.loc[activos["_stock"] > 0].copy()
    activos["_clave"] = activos[cs].map(identificador)
    activos["_nombre_stock"] = activos[ns].fillna("").astype(str).str.strip() if ns else ""
    unidos = activos[["_clave", "_nombre_stock", "_stock"]].merge(
        claves, how="left", on="_clave", validate="many_to_one", sort=False,
    )
    unidos["EAN"] = unidos["EAN"].fillna("")
    unidos["estado_cruce"] = unidos["estado_cruce"].fillna("sin coincidencia en maestro")
    unidos.loc[(unidos["estado_cruce"] == "coincidencia") & unidos["EAN"].eq(""),
               "estado_cruce"] = "EAN ausente o inválido"
    nombre = unidos["_nombre_stock"].where(unidos["_nombre_stock"].ne(""), unidos["_nombre_maestro"])
    return pd.DataFrame({
        "nombre": nombre.fillna(""), "stock": unidos["_stock"],
        "EAN": unidos["EAN"], "clave_cruce": unidos["_clave"],
        "estado_cruce": unidos["estado_cruce"],
    })


class Cliente:
    def __init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "MarketCatalogSync/1.0"})

    def get(self, url: str, **kwargs: object) -> requests.Response:
        try:
            respuesta = self.session.get(url, timeout=(10, 30), **kwargs)
            respuesta.raise_for_status()
            return respuesta
        finally:
            # Incluye búsquedas, descargas y errores: pausa entre todas las peticiones.
            time.sleep(1.5)


def guardar_imagen(contenido: bytes, destino: Path) -> None:
    temporal = destino.with_suffix(".tmp")
    try:
        with Image.open(BytesIO(contenido)) as original:
            imagen = ImageOps.exif_transpose(original).convert("RGBA")
            imagen.thumbnail((500, 500), Image.Resampling.LANCZOS)
            fondo = Image.new("RGB", imagen.size, "white")
            fondo.paste(imagen, (0, 0), imagen.getchannel("A"))
            fondo.save(temporal, format="WEBP", quality=90)
        temporal.replace(destino)
    finally:
        temporal.unlink(missing_ok=True)


def buscar_imagen(cliente: Cliente, ean: str, nombre: str, destino: Path) -> tuple[str, str, str]:
    errores = []
    # Prioriza EAN en ambas tiendas antes de recurrir a resultados por nombre.
    consultas = [("EAN", {"fq": f"alternateIds_Ean:{ean}"})]
    if nombre.strip():
        consultas.append(("nombre", {"ft": nombre}))
    for metodo, parametros in consultas:
        for tienda in TIENDAS:
            try:
                datos = cliente.get(tienda, params=parametros).json()
                if not isinstance(datos, list):
                    raise ValueError("La API no devolvió una lista de productos")
                if not datos:
                    continue
                url = datos[0]["items"][0]["images"][0]["imageUrl"]
                guardar_imagen(cliente.get(url).content, destino)
                return metodo, url, ""
            except (requests.RequestException, ValueError, KeyError, IndexError, TypeError, OSError) as exc:
                mensaje = f"{tienda}: {type(exc).__name__}: {exc}"
                errores.append(mensaje)
                print(f"  Aviso: {mensaje}")
    return "", "", " | ".join(errores) or "Sin resultados con imagen"


def argumentos(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--raiz", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--maestro", default="productos(1).xlsx")
    parser.add_argument("--inventario", default="stock_11_13_2026_11_16_41 AM.xlsx")
    for opcion in ("clave-maestro", "clave-stock", "ean", "nombre-maestro", "nombre-stock", "stock"):
        parser.add_argument(f"--{opcion}")
    parser.add_argument("--solo-cruce", action="store_true", help="Exporta catálogo sin consultar internet")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = argumentos(argv)
    raiz = args.raiz.resolve()
    tablas = []
    for archivo in (args.maestro, args.inventario):
        ruta = raiz / archivo
        if not ruta.is_file():
            raise FileNotFoundError(f"No se encontró el archivo: {ruta}")
        tabla = pd.read_excel(ruta, engine="openpyxl", dtype=str, keep_default_na=False)
        print(f"{ruta.name}: {list(tabla.columns)} ({len(tabla)} filas)")
        tablas.append(tabla)
    catalogo = cruzar(*tablas, args)
    salida = raiz / "catalogo_final.xlsx"
    catalogo.to_excel(salida, engine="openpyxl", index=False)
    print(f"Catálogo: {len(catalogo)} productos con stock positivo -> {salida}")
    if args.solo_cruce:
        return 0
    imagenes = raiz / "imagenes"
    imagenes.mkdir(exist_ok=True)
    cliente = Cliente()
    catalogo["estado_imagen"] = "pendiente"
    catalogo["url_imagen"] = ""
    catalogo["motivo"] = ""
    resultados = {}
    interrumpido = False
    try:
        for i, fila in catalogo.iterrows():
            ean, nombre = fila["EAN"], fila["nombre"]
            print(f"[{i + 1}/{len(catalogo)}] {ean or 'SIN EAN'}: {nombre}")
            if not ean:
                metodo, url, motivo = "faltante", "", fila["estado_cruce"]
            elif (imagenes / f"{ean}.webp").is_file():
                metodo, url, motivo = "existente", "", ""
            else:
                if ean not in resultados:
                    resultados[ean] = buscar_imagen(cliente, ean, nombre, imagenes / f"{ean}.webp")
                metodo, url, motivo = resultados[ean]
                metodo = metodo or "faltante"
            catalogo.loc[i, ["estado_imagen", "url_imagen", "motivo"]] = [metodo, url, motivo]
    except KeyboardInterrupt:
        interrumpido = True
        print("Interrumpido: se conserva el progreso. Podés volver a ejecutar para continuar.")
    finally:
        cliente.session.close()
        catalogo.to_excel(salida, engine="openpyxl", index=False)
        faltantes = catalogo.loc[catalogo["estado_imagen"].isin(["faltante", "pendiente"])].copy()
        faltantes.loc[faltantes["estado_imagen"] == "pendiente", "motivo"] = "Pendiente de procesar"
        faltantes.to_excel(raiz / "faltantes.xlsx", engine="openpyxl", index=False)
        print(f"Estados: {catalogo['estado_imagen'].value_counts().to_dict()}")
        print(f"Faltantes o pendientes: {len(faltantes)} -> {raiz / 'faltantes.xlsx'}")
    return 130 if interrumpido else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError) as error:
        raise SystemExit(f"Error: {error}") from error
