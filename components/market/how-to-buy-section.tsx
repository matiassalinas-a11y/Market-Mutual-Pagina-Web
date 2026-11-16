import Image from 'next/image'

const steps = [
  {
    title: 'Elegí tus productos',
    image: '/images/how-to-buy/products.png',
    alt: 'Productos de almacén, frutas y verduras',
  },
  {
    title: 'Agregalos al carrito',
    image: '/images/how-to-buy/cart.png',
    alt: 'Carrito con productos',
  },
  {
    title: 'Completá tus datos',
    image: '/images/how-to-buy/customer-data.png',
    alt: 'Formulario con datos personales y de entrega',
  },
  {
    title: 'Enviá por WhatsApp',
    image: '/images/how-to-buy/whatsapp-order.png',
    alt: 'Pedido enviado por WhatsApp',
  },
]

export function HowToBuySection() {
  return (
    <section id="como-comprar" className="border-y border-[#e1ebf4] bg-[linear-gradient(135deg,#f8fbff_0%,#eef6fd_100%)] py-14">
      <div className="mx-auto grid w-[calc(100%_-_2rem)] max-w-[1550px] gap-9 md:w-[calc(100%_-_5rem)] lg:grid-cols-[minmax(360px,32fr)_minmax(0,68fr)] lg:items-start lg:gap-3">
        <div className="max-w-[500px] lg:pt-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2581d2] lg:text-lg">Así de simple</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#102f53] sm:text-5xl lg:text-5xl lg:leading-[1.05]">Cómo comprar</h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 sm:text-xl lg:text-[21px] lg:leading-8">Hacé tu pedido desde donde estés. Nosotros nos ocupamos del resto.</p>
        </div>

        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex h-[320px] flex-col overflow-hidden rounded-[22px] border border-[#dce7f1] bg-white p-4 shadow-[0_8px_24px_rgba(16,47,83,0.045)]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e7f2fc] text-lg font-bold text-[#0876ce]">{String(index + 1).padStart(2, '0')}</span>
              <div className="relative mx-auto mt-1 h-[180px] w-full max-w-[220px] shrink-0 overflow-hidden">
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(max-width: 640px) 80vw, (max-width: 1279px) 28vw, 14vw"
                  className="scale-[1.30] object-contain"
                />
              </div>
              <h3 className="mt-auto min-h-14 pt-2 text-[19px] font-bold leading-6 text-[#10345e] xl:text-xl">{step.title}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
