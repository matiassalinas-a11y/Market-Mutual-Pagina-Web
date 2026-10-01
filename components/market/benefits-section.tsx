import { BadgePercent, UsersRound } from 'lucide-react'

export function BenefitsSection() {
  return (
    <section className="border-y border-slate-200 bg-[#f7f9fc] py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-[#2581d2]">Cerca tuyo</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53]">Beneficios Market Mutual</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f2fc] text-[#1456a0]"><UsersRound /></span><div><h3 className="font-bold text-[#12355f]">Beneficios exclusivos para trabajadores</h3><p className="mt-1 text-sm text-slate-500">Hasta un <strong className="text-[#1456a0]">30% de beneficio</strong> en productos seleccionados.</p></div></div>
          <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f5ec] text-[#2e8b5b]"><BadgePercent /></span><div><h3 className="font-bold text-[#12355f]">Beneficios para adherentes</h3><p className="mt-1 text-sm text-slate-500">Disfrutá hasta un <strong className="text-[#2e8b5b]">20% de beneficio</strong>.</p></div></div>
        </div>
        <p className="mt-5 text-xs text-slate-400">Las condiciones finales se verifican al confirmar el pedido.</p>
      </div>
    </section>
  )
}