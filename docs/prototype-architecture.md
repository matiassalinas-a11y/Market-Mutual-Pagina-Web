# Arquitectura del prototipo y evolución futura

## Estado actual: presentación local

El navegador contiene toda la funcionalidad. `CatalogProvider` expone el catálogo activo, `catalog-storage.ts` lo persiste en IndexedDB y `cart-store.tsx` conserva el carrito en localStorage. El importador transforma Excel/CSV a un modelo `Product` común antes de guardarlo.

El checkout genera una referencia visual local. Mercado Pago y GOcuotas son adaptadores de demostración: el primero muestra estados simulados; el segundo construye una vista previa de mensaje sin abrir servicios externos.

## Límites entre módulos

| Área | Prototipo | Implementación futura |
| --- | --- | --- |
| Catálogo | IndexedDB mediante `catalog-storage.ts` | API de catálogo y repositorio PostgreSQL/Supabase |
| Importación | Parseo y validación en el navegador | Trabajo de importación en servidor, auditoría y permisos |
| Administración | Ruta pública `/admin`, marcada DEMO | Autenticación, roles, trazabilidad y sesiones |
| Carrito | localStorage | Sesión anónima/usuario sincronizada con servidor |
| Pedido | Referencia local no transaccional | API idempotente de órdenes con estados persistidos |
| Mercado Pago | Resultado elegido por el presentador | Orders/Checkout API, credenciales seguras en servidor y webhooks verificados |
| GOcuotas | Mensaje copiable | Adaptador comercial autorizado y apertura de canal solo con consentimiento explícito |
| POSBerry | Sin integración | Sincronización desacoplada de productos, precios, stock y pedidos |
| Imágenes | 20 WebP locales con manifiesto por SKU/barcode; placeholder para las demás | Almacenamiento administrado, optimización y moderación |

## Secuencia recomendada para producción

1. Definir el contrato de catálogo y pedidos sin cambiar los componentes visuales.
2. Sustituir `catalog-storage.ts` por un repositorio HTTP manteniendo la interfaz del proveedor.
3. Incorporar autenticación y autorización antes de habilitar acciones administrativas.
4. Crear órdenes en servidor con claves de idempotencia y auditoría.
5. Implementar Mercado Pago en servidor y validar webhooks antes de cambiar el estado de una orden.
6. Integrar POSBerry mediante tareas reintentables, métricas y resolución explícita de conflictos.
7. Ejecutar pruebas de seguridad, accesibilidad, carga y recuperación antes de publicar.

Ninguno de estos servicios futuros está conectado en el prototipo actual.

## Revisión de fotografías

El piloto inicial de Open Food Facts consultó 20 productos distintos por código de barras. Devolvió 9 URLs con miniaturas accesibles. Otras 8 referencias del catálogo apuntan a miniaturas de Google sin fuente/licencia trazable: se conservan en los datos, pero no se muestran. Los registros POSBerry no tienen marca separada y los Excel originales no están disponibles en el repositorio.

El panel conserva la revisión manual de esas candidatas mediante IndexedDB. Las aprobaciones quedan vinculadas por SKU y código de barras, sin almacenar imágenes en base64. Para las imágenes comerciales incorporadas en el primer lote, el manifiesto local es la fuente persistente y compartida entre navegadores; no depende de la base IndexedDB de un equipo.

Open Food Facts publica sus fotos bajo CC BY-SA 3.0 y requiere atribución. La fuente también advierte que los gráficos de los envases pueden tener derechos separados. El lote efectivo se limitó a fotos con correspondencia visual alta y muestra enlace a la ficha fuente y a la licencia en cada tarjeta. El primer piloto usó API v2 con una cadencia superior al límite publicado; no se continuó con llamadas individuales.

### Segundo lote: índice masivo de imágenes

Se analizaron 30 productos con códigos de barras válidos, usando el índice `data_keys.gz` del conjunto de imágenes AWS recomendado por Open Food Facts para descargas masivas. El índice contiene rutas de imágenes por código, pero no nombres, marcas ni presentaciones. Un filtro agrupado de la exportación Parquet oficial devolvió HTTP 504 para 30 códigos y excedió 120 segundos con 10; no se hicieron consultas individuales ni se descargó el conjunto completo.

El índice contenía JPEG de 400 px para 26 códigos. Se descargaron e inspeccionaron 46 vistas: 20 coincidían visualmente con nombre/marca/presentación, 4 necesitan revisión de presentación, 2 se rechazaron por discrepancias visibles y 4 no tenían imagen. Las 20 coincidencias visuales siguen pendientes de autorización: Open Food Facts declara CC BY-SA 3.0 para las fotografías, pero advierte que los gráficos de los envases pueden tener derechos separados. No se aprobó ni asoció ninguna imagen; el catálogo, sus SKU, precios, categorías y existencias no se modificaron. Continúan 0 imágenes verificadas y 753 productos sin foto verificada. El detalle reproducible por SKU, estado y URL candidata está en [la auditoría del segundo lote](../public/data/product-image-pilot-stage2.json).

Para ampliar la cobertura, se pueden incorporar feeds de packshots de POSBerry, fabricantes o distribuidores que autoricen explícitamente el uso comercial y especifiquen atribución. También se puede continuar con fotografías licenciadas de Open Food Facts, manteniendo su atribución y la revisión de coincidencia.

### Primer lote efectivo de imágenes

Se incorporaron 20 fotografías CC BY-SA 3.0 del índice masivo oficial de Open Food Facts. Se descargaron las vistas de 400 px, se optimizaron a WebP y se guardaron en `public/products/`; los 20 archivos suman 328 KB. `public/data/product-image-associations.json` registra SKU, código de barras, procedencia, licencia y referencia estable. `applyProductImageAssociations` aplica estas referencias antes del primer render y después de importar el catálogo, sin sustituir una imagen ya verificada.

La cobertura efectiva es 20 de 753 productos; los otros 733 conservan el placeholder. Cuatro resultados del piloto quedaron pendientes de revisar y dos se rechazaron por diferencias de variedad/presentación. No se cambiaron productos, precios, stock, categorías, diseño ni carrito. Google Imágenes se intentó como herramienta de búsqueda, pero no devolvió resultados utilizables con procedencia verificable en esta sesión; no se descargaron imágenes de buscadores ni de comercios minoristas.
