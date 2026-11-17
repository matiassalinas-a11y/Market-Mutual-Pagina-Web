# Market Mutual

Prototipo funcional local de la tienda online de la Mutual de los Trabajadores de la Construcción de la Patagonia.

## Ejecutar localmente

Requiere Node.js 20 o posterior y pnpm.

```bash
pnpm install
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Recorrido de la demo

- `/`: catálogo, categorías, búsqueda, carrito y acceso al checkout.
- `/admin`: panel de demostración para importar `.xlsx` o `.csv`, revisar filas y reemplazar el catálogo guardado en este navegador.
- `/checkout`: datos de contacto, modalidad de entrega y envío del pedido por WhatsApp.
- `/checkout/demo/mercado-pago`: simulador local de estados aprobado, pendiente y rechazado.

El importador detecta automáticamente las columnas habituales del archivo de productos. Antes de confirmar permite cambiar la correspondencia de columnas, ver una muestra, consultar filas válidas/duplicadas/inválidas y descargar un informe CSV. El catálogo se guarda en IndexedDB; el carrito se guarda en localStorage.

## Catálogo POSBerry incluido

La tienda incluye un catálogo preparado a partir del archivo general de productos y del último archivo de existencias. Solo se publican productos activos con stock positivo y precio de venta válido. Las cantidades reales se conservan para controlar el carrito, pero no se muestran al cliente.

Para preparar una futura actualización de stock sin depender del navegador:

```bash
node scripts/build-posberry-catalog.mjs "ruta/productos.xlsx" "ruta/stock.xlsx" "public/data/catalog-posberry.json"
```

El archivo generado se carga en IndexedDB la primera vez que se abre la tienda. Una importación manual que ya contenga stock utilizable se conserva hasta que se restaure el catálogo POSBerry desde `/admin`.

## Fotografías de productos

El catálogo contiene 753 productos activos. El piloto inicial consultó 20 códigos: 9 devolvieron imágenes candidatas, ninguna se aprobó entonces y las 8 referencias preexistentes apuntan a miniaturas de Google sin procedencia/licencia trazable. Estas referencias siguen ocultas; el placeholder se mantiene para productos sin imagen verificada.

El segundo lote analizó otros 30 códigos con el índice masivo oficial de imágenes AWS. Encontró 26 con JPEG de 400 px; 20 coincidieron visualmente, 4 requieren revisar la presentación, 2 se rechazaron por discrepancias y 4 no tenían imagen. El filtro agrupado de metadatos agotó el tiempo de espera, por lo que no se hicieron búsquedas API individuales ni se descargó el conjunto completo. El detalle histórico está en [la auditoría del segundo lote](public/data/product-image-pilot-stage2.json).

### Carga efectiva: primer lote

Se incorporaron **20 fotografías** de coincidencia visual alta del conjunto oficial de Open Food Facts. Las tarjetas muestran WebP locales de 400 px y enlazan tanto a la ficha fuente como a la licencia CC BY-SA 3.0. El manifiesto [product-image-associations.json](public/data/product-image-associations.json) las aplica por SKU y, si el SKU cambia, por código de barras único; la asociación funciona antes del primer render y después de recargar o reimportar. Los archivos ocupan 328 KB en total. El catálogo conserva sus 753 productos y sus datos comerciales: ahora **20 muestran fotografías y 733 siguen con placeholder**.

Las 4 coincidencias dudosas y 2 discrepancias se dejaron fuera. Open Food Facts publica las fotos bajo CC BY-SA 3.0, con atribución y enlace visibles en cada tarjeta; la fuente advierte que algunos gráficos del envase pueden tener derechos adicionales. No se descargaron imágenes de Google ni de supermercados. Se probó Google Imágenes con un código exacto, pero la sesión no entregó resultados utilizables con procedencia verificable. Los siguientes lotes pueden continuar con el conjunto autorizado y feeds de proveedores con permiso explícito.

## Límites deliberados del prototipo

- No hay backend, Supabase, autenticación ni permisos reales.
- El panel `/admin` es público y está marcado como DEMO.
- No se procesan pagos ni se solicitan credenciales bancarias.
- El checkout genera un ticket completo para WhatsApp y conserva el carrito al abrirlo.
- Los números de pedido son referencias locales sin validez transaccional.
- Las imágenes faltantes o inválidas usan un reemplazo visual local. No se realizan búsquedas ni descargas masivas automáticas.
- Las asociaciones de fotografías aprobadas son específicas del navegador; no se sincronizan entre equipos ni se copian al proyecto.

Para volver al catálogo ilustrativo inicial, usá **Borrar catálogo local** en `/admin`.

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
```

La separación prevista para una futura implementación real está documentada en [`docs/prototype-architecture.md`](docs/prototype-architecture.md).
# Sincronización de imágenes de productos

Las imágenes se vinculan únicamente por EAN exacto. Si el catálogo web no trae EAN, el comando usa `catalogo_final.xlsx` como puente entre `codigo_interno` y `ean`; nunca compara nombres.

```powershell
pnpm sync:product-images -- --images .\imagenes --catalog .\catalogo_final.xlsx
```

Si los archivos siguen en la carpeta donde terminó la descarga actual:

```powershell
pnpm sync:product-images -- --images "C:\Users\Redes Mutual\Documents\Codex\2026-11-16\necesito-un-script-en-python-usando\imagenes" --catalog "C:\Users\Redes Mutual\Documents\Codex\2026-11-16\necesito-un-script-en-python-usando\catalogo_final.xlsx"
```

El comando copia sólo las coincidencias válidas a `public/products/{ean}.webp`, conserva los originales, evita volver a copiar archivos idénticos y actualiza el manifiesto consumido por la web. Los cruces ambiguos o sin correspondencia quedan detallados en `public/data/product-image-sync-report.json`.

