const steps = ['Elegí tus productos', 'Agregalos al carrito', 'Completá tus datos', 'Enviá por WhatsApp']

export function HowToBuySection() {
  return (
    <section id="como-comprar" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div><p className="text-sm font-bold uppercase tracking-widest text-[#2581d2]">Así de simple</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53]">Cómo comprar</h2><p className="mt-4 leading-7 text-slate-600">Hacé tu pedido desde donde estés. Nosotros nos ocupamos del resto.</p></div>
        <div className="grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-white p-4"><span className="flex size-9 items-center justify-center rounded-full bg-[#e7f2fc] text-sm font-bold text-[#1456a0]">0{index + 1}</span><p className="mt-5 text-sm font-bold leading-5 text-[#16385f]">{step}</p></div>
          ))}
        </div>
      </div>
    </section>
  )
}