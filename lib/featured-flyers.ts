export type FeaturedFlyer = {
  id: string
  title: string
  alt?: string
  image?: string
  mobileImage?: string
  href?: string
}

// El primer flyer siempre es el de envíos. Agregar las promociones después.
// Sin imagen se muestra el banner de envíos provisional.
export const featuredFlyers: FeaturedFlyer[] = [
  { id: 'envios', title: 'Recibí tu pedido — Market Mutual. Envíos con compra mínima a zonas norte y sur, de 09:00 a 16:30', image: '/flyers/envios-market-mutual.png', href: '#entregas' },
  { id: 'pava-smart-life', title: 'Pava eléctrica Smart Life — precio general $143.450, descuento especial para afiliados. Avenida Ricardo Gutiérrez N°1', image: '/flyers/pava-smart-life.png', href: '#productos' },
  { id: 'termo-peabody', title: 'E-termo Peabody — precio general $170.000, descuento especial para afiliados. Avenida Ricardo Gutiérrez N°1', image: '/flyers/termo-peabody.png', href: '#productos' },
]
