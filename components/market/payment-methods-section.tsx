import Image from 'next/image'

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
    <section id="medios-de-pago" className="scroll-mt-28 bg-[linear-gradient(180deg,#ffffff_0%,#f2f8fd_100%)] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2581d2]">Pagá como prefieras</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53] sm:text-4xl">Medios de pago</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">Elegí la opción que más te convenga para realizar tu compra.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:gap-7">
          {paymentMethods.map((method) => (
            <figure
              key={method.title}
              className="group relative aspect-[3/2] overflow-hidden rounded-[22px] border border-[#d9e7f3] bg-white shadow-[0_16px_40px_rgba(16,47,83,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(16,47,83,0.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:rounded-[28px]"
            >
              <Image
                src={method.image}
                alt={method.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-contain"
              />
              <figcaption className="sr-only">{method.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
