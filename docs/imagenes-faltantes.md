# Candidatos de imágenes para revisión manual

Este proceso conserva el catálogo, precios, categorías, stock, fotos existentes y manifiestos publicados. **Todas** las descargas son candidatos sin aprobar y se guardan fuera de `public/`. No se integran automáticamente en la web, ni siquiera cuando el EAN coincide.

## Revisión e incorporación posterior

Se revisaron los 760 candidatos descargados y se incorporaron 51 fotos claras, incluyendo siete coincidencias por texto verificadas visualmente. El resultado es de **599 productos con imagen local válida y 154 pendientes**. El detalle por SKU, fuente, enlace y motivo está en `docs/product-image-review-report.json`.

Las fotos aprobadas se guardan como `public/products/reviewed-<SKU>-<hash>.webp` y se agregan al manifiesto local con el método `reviewed-candidate`. Las asociaciones y archivos anteriores se conservan. Los EAN duplicados se vinculan por SKU, sin agregar una asociación general por código de barras.

Se dejaron pendientes las diferencias de peso o tamaño, las variantes no confirmadas, los paquetes frente a unidades y los marcadores «Imagen no disponible», incluso cuando la tienda devolvía el mismo EAN. Para los copos 3 Arroyos Chocolate de 200 g se verificó el envase visible y el EAN: el título de la tienda decía «frutilla» por error y quedó documentado. Descargar nuevos candidatos continúa sin aprobarlos ni publicarlos.

## Ejecutar todos los faltantes desde PowerShell

Desde la raíz del proyecto, con el entorno `.venv` ya preparado:

```powershell
.\.venv\Scripts\python.exe scripts/imagenes_faltantes.py --descargar --salida .\revision_imagenes
```

El comando procesa todos los productos sin foto válida, incluidos los EAN ausentes, inválidos y duplicados. **No hay un límite predeterminado de diez**. No necesita los Excel originales para consultar los nombres y EAN que ya figuran en el catálogo JSON.

Abrir la galería al finalizar o mientras el proceso avanza:

```powershell
Invoke-Item .\revision_imagenes\revision.html
```

Comprobar las cuatro fuentes con un producto conocido, sin descargar fotografías:

```powershell
.\.venv\Scripts\python.exe scripts/imagenes_faltantes.py --diagnosticar --salida .\revision_imagenes
```

Solo auditoría local, sin internet:

```powershell
.\.venv\Scripts\python.exe scripts/imagenes_faltantes.py --auditar
```

## Fuentes y método verificado

Carrefour, Día y Jumbo usan sus rutas públicas VTEX `/api/catalog_system/pub/products/search`, con `fq=alternateIds_Ean:...` para EAN y `ft=...` para texto. Se verificaron con búsquedas reales de Coca-Cola: HTTP 206, JSON de productos y resultados; se reutiliza el EAN recibido para verificar también la consulta exacta (HTTP 200 y un resultado).

Las consultas por texto usan espacios codificados como `%20` (RFC 3986). En las pruebas de esta PC, `ft=coca+cola` devolvió HTTP 400 con `Bad Request! Scripts are not allowed!`; `ft=coca%20cola` devolvió productos. Esto queda cubierto por una prueba de regresión.

Para La Anónima se inspeccionó el JavaScript público del encabezado en `globappviews.laanonimaws.com`. El buscador utiliza `https://www.laanonima.com.ar/catalogo/buscador/<termino>?autocomplete=1&cp=default&ele=&sup=`, con respuesta esperada `{articulos: [...]}`. Los artículos enlazan a `/art_<codAnonima>`; sus imágenes se extraen de datos estructurados Product de esa ficha. **Actualmente la consulta responde HTTP 403 desde esta PC**. Se registra como bloqueo y se continúa con las otras fuentes; no se intenta eludirlo ni se presenta como una búsqueda sin resultados. No se verificó una descarga real de esta fuente mientras está bloqueada.

Cada ejecución vuelve a diagnosticar las fuentes. Los fallos HTTP, bloqueos, errores de red, HTML inesperado y cambios de esquema JSON se distinguen de una lista válida vacía. Si una fuente devuelve un bloqueo durante el lote, se deshabilita para el resto de esa ejecución.

## Coincidencias y presentación

1. Se conserva la búsqueda por EAN cuando existe y el método está verificado en esa fuente. Para EAN duplicados, el resultado solo se guarda como candidato separado para cada SKU.
2. Sin coincidencia suficiente se consulta por nombre completo, marca, variante y presentación; después se simplifica la consulta de forma explícita, dejando el texto utilizado en el informe.
3. Los productos sin EAN o con código inválido también se buscan por nombre. No se inventan ni se reemplazan códigos.
4. Se filtran marcas claramente distintas (por ejemplo, una pelota Donic con modelo Elite no corresponde a la marca de pañuelos Elite).
5. Una coincidencia solo de marca o una diferencia de tamaño, sabor, formato o presentación queda marcada para revisión. No implica que la imagen sea correcta.

## Carpeta de revisión e informes

- `candidatos/<SKU>/<fuente>-<hash>.webp`: archivos identificados por producto y fuente, sin sobrescribir candidatos existentes.
- `revision.html`: galería local con imagen, nombre original, nombre candidato, fuente, método, advertencias y enlaces.
- `candidatos.csv` y `candidatos.json`: mismo detalle para filtrar o revisar en una planilla. Los resultados descartados por marca diferente se conservan en el informe, pero se ocultan de la galería de pendientes.
- `productos.csv` y `productos.json`: estado por SKU e incidencias de las fuentes.
- `consultas.jsonl`: registro por petición con HTTP, tipo de respuesta, consulta, cantidad de productos devueltos y cantidad de candidatos con foto. En errores donde no se pudo leer una lista, las cantidades quedan sin valor, no en cero.
- `diagnostico_fuentes.json`: control de cada fuente y verificación de sus métodos.
- `auditoria.json`, `faltantes_imagenes.csv` y `revisar_ean.csv`: auditoría del catálogo publicado.
- `resumen.json`: conteos de candidatos; `publicados` siempre es cero.

La carpeta `revision_imagenes/` está ignorada por Git. Las imágenes se validan con Pillow y se guardan en WebP, sin recortarlas, con hasta 1200 px para facilitar su revisión.

## Reanudar y opciones

Repetir el comando conserva los archivos y omite los productos que ya tienen candidatos válidos registrados. Los productos sin candidatos se vuelven a consultar. Para buscar más alternativas de productos ya procesados:

```powershell
.\.venv\Scripts\python.exe scripts/imagenes_faltantes.py --descargar --salida .\revision_imagenes --reintentar
```

Opciones adicionales:

```powershell
# Prueba acotada por SKU; omitir --sku para procesar todos.
.\.venv\Scripts\python.exe scripts/imagenes_faltantes.py --descargar --sku 6645 6092 6127

# Elegir fuentes o cantidad máxima de candidatos por fuente y producto.
.\.venv\Scripts\python.exe scripts/imagenes_faltantes.py --descargar --fuentes carrefour dia jumbo --max-por-fuente 3
```

`--limite N` sigue disponible solo para pruebas voluntariamente acotadas. La pausa entre peticiones es de 1,5 segundos. Si una fuente no dispone de cierta presentación, el proceso registra el motivo y continúa. No hay garantía de encontrar una imagen útil para cada artículo.

## Datos originales y dependencias

Se mantienen los 753 artículos, con 548 imágenes válidas publicadas y 205 faltantes al preparar este flujo. Descargar candidatos no cambia esos conteos en la web hasta una aprobación e integración posterior.

El script antiguo `scripts/sincronizar_catalogo.py` requiere `productos(1).xlsx` y `stock_11_13_2026_11_16_41 AM.xlsx`, ausentes en esta PC. El sincronizador Node antiguo esperaba `catalogo_final.xlsx`. No se necesitan para este modo. El archivo de familias con stock cero no se usa como inventario.

Python 3.12 y las dependencias están instalados en `.venv`. Para preparar otra PC:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r scripts/requirements-catalogo.txt
```

Pruebas sin consultar tiendas:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s scripts -p test_imagenes_faltantes.py -v
```
