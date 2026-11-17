import { FeaturedCarousel } from '@/components/market/featured-carousel'

const paymentMethods = [
  {
    title: 'Efectivo, débito y QR',
    image: '/images/payment-methods/cash-debit-qr.png',
    alt: 'Market Mutual: pago en efectivo, con tarjeta de débito o mediante QR al confirmar el pedido.',
  },
  {
    title: 'Go Cuotas',
    image: '/images/payment-methods/go-cuotas.png',
    alt: 'Go Cuotas en Market Mutual: tres cuotas con tarjeta de débito.',
  },
  {
    title: 'Patagonia 365',
    image: '/images/payment-methods/patagonia-365.png',
    alt: 'Patagonia 365 en Market Mutual: hasta tres cuotas sin interés.',
  },
  {
    title: 'Tarjeta Naranja X',
    image: '/images/payment-methods/naranja-x.png',
    alt: 'Tarjeta Naranja X en Market Mutual: planes de una, cuatro y siete cuotas sin interés.',
  },
]

export function PaymentMethodsSection() {
  return (
    <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f2f8fd_100%)] py-10 sm:py-14">
      <FeaturedCarousel
        id="medios-de-pago"
        title="Medios de pago"
        description="Elegí la opción que más te convenga para realizar tu compra"
        flyers={paymentMethods.map((method) => ({ ...method, id: method.image }))}
        aspectRatio="3 / 2"
      />
    </div>
  )
}
