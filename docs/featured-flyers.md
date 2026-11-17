# Flyers destacados

Los flyers se configuran en `lib/featured-flyers.ts`, en el orden en que deben aparecer. El primero es el de envíos. El flyer de envíos usa el diseño aprobado en `public/flyers/envios-market-mutual.png`.

Para incorporar los diseños, guardar las imágenes en `public/flyers/` y agregar sus rutas:

```ts
export const featuredFlyers: FeaturedFlyer[] = [
  {
    id: 'envios',
    title: 'Envíos Market Mutual',
    image: '/flyers/envios.webp',
    mobileImage: '/flyers/envios-mobile.webp',
    href: '#entregas',
  },
  {
    id: 'promo-semanal',
    title: 'Descripción de la promoción y sus condiciones principales',
    image: '/flyers/promo-semanal.webp',
    mobileImage: '/flyers/promo-semanal-mobile.webp',
    href: '#productos',
  },
]
```

Usar identificadores únicos. La descripción `title` debe transmitir el contenido del flyer a quienes usan lectores de pantalla. `href` y `mobileImage` son opcionales. Reemplazar o quitar las promociones al vencer; no hay carga desde el panel de administración ni vencimientos automáticos.

Proporciones recomendadas: escritorio y celular 16:9 (por ejemplo 1920 × 1080 px y 960 × 540 px). Se conserva la imagen completa, sin recortar texto; si se entrega solo la imagen horizontal, se adapta dentro del espacio móvil.

Con dos o más flyers se activan las vistas previas laterales en PC, indicadores y avance cada 3 segundos. Se puede deslizar horizontalmente en celular. El avance se pausa al pasar el cursor, enfocar los controles con el teclado, ocultar la pestaña. Con movimiento reducido del sistema se desactiva el avance automático y la transición. Con un solo flyer se ocultan los controles innecesarios.
