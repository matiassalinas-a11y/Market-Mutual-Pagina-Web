import { ArrowRight, BadgePercent } from 'lucide-react'

export function OffersSection() {
  return (
    <section id="ofertas" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] bg-[#123b6b] p-7 text-white md:p-12">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#bde0fb]"><BadgePercent className="size-4" /> Ofertas de la semana</div>
            <h2 className="max-w-lg text-3xl font-bold tracking-tight md:text-4xl">Más ahorro para acompañar tu semana.</h2>
            <p className="mt-4 max-w-md leading-7 text-blue-100/75">Encontrá precios especiales en productos seleccionados y aprovechá tus beneficios.</p>
            <a href="#productos" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#123b6b]">Ver ofertas <ArrowRight className="size-4" /></a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="rotate-[-6deg] rounded-2xl bg-[#f8d8c9] p-4 text-[#9c503b] shadow-xl"><p className="text-xs font-bold">-15%</p><p className="mt-2 text-3xl font-black">Pizza</p></div>
            <div className="translate-y-5 rotate-[7deg] rounded-2xl bg-[#d9eddb] p-4 text-[#347047] shadow-xl"><p className="text-xs font-bold">-10%</p><p className="mt-2 text-3xl font-black">Leche</p></div>
          </div>
        </div>
      </div>
    </section>
  )
}