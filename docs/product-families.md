# Categorías por familias de productos

La navegación conserva el título «Comprá por categoría». Las categorías corresponden a las familias del archivo aportado por el usuario, unificando mayúsculas, acentos y variantes equivalentes.

El catálogo conserva sus 753 artículos y todos sus datos comerciales. El Excel de familias tiene existencias en cero: esa columna se ignora por completo. Se cruza por código interno, comprobando el nombre exacto cuando hay códigos repetidos. Si falta el código, se permite un nombre normalizado exacto con una sola familia posible. No se hacen cruces aproximados.

El archivo permite verificar 719 artículos. Los 34 restantes se clasificaron por tipo de producto, según la indicación del usuario. La misma revisión por tipo corrige 170 familias del Excel que no correspondían al artículo: por ejemplo, licuadoras en alimentos, golosinas en bebidas alcohólicas y bolsas de residuos en bazar. Estas decisiones están registradas por SKU y nombre en `scripts/product-family-overrides.json`; no se presentan como datos originales del Excel.

El resultado tiene 22 familias con productos disponibles. El informe `docs/product-family-sync-report.json` registra la categoría anterior, la familia de origen, las filas del Excel y la clasificación final de cada artículo.

Para repetir el cruce:

```powershell
pnpm sync:product-families "D:\Descargas\stock_familias_actualizadas_stock_cero.xlsx"
```

El comando valida los nombres de las propuestas por tipo para no aplicarlas a un código reutilizado, rechaza familias contradictorias y productos sin clasificación, y comprueba que ningún campo comercial haya cambiado antes de guardar. Una segunda ejecución con los mismos datos no modifica archivos. Cuando se agreguen nuevos artículos, revisar las propuestas y las excepciones antes de regenerar.

El cambio de versión del catálogo actualiza automáticamente la copia incluida guardada en IndexedDB. La fecha del stock original se conserva por separado. Los catálogos importados manualmente sin versión mantienen el comportamiento existente: no se sustituyen automáticamente por el catálogo incluido.
