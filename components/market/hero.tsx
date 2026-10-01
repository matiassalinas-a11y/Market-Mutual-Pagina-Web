import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section id="inicio" className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-10 md:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pb-24">
      <div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#e7f2fc] px-3 py-1.5 text-xs font-bold text-[#1456a0]"><span className="size-2 rounded-full bg-[#2e9b69]" /> Tu compra, más simple</div>
        <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-[#102f53] md:text-6xl">Todo lo que necesitás, <span className="text-[#2581d2]">más cerca tuyo.</span></h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 md:text-lg">Encontrá productos para todos los días, armá tu pedido online y coordiná la entrega directamente con Market Mutual.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#productos"><Button size="lg" className="rounded-xl bg-[#1456a0] px-6 shadow-lg shadow-blue-900/15 hover:bg-[#0d4381]">Ver productos <ArrowRight data-icon="inline-end" /></Button></a>
          <a href="#como-comprar"><Button size="lg" variant="outline" className="rounded-xl border-slate-300 bg-white px-6 text-[#12355f]">Cómo comprar</Button></a>
        </div>
        <div className="mt-9 flex items-center gap-3 text-sm text-slate-500">
          <div className="flex -space-x-2">
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#dceeff] text-xs font-bold text-[#1456a0]">M</span>
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#ffe4d7] text-xs font-bold text-[#a64e35]">J</span>
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#dff2e8] text-xs font-bold text-[#24734c]">L</span>
          </div>
          <span>Una mutual que está cerca tuyo</span>
        </div>
      </div>
      <div className="relative min-h-[340px] overflow-hidden rounded-[2rem] bg-[#dfeefa] p-5 shadow-sm md:min-h-[460px]">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/50" />
        <div className="absolute bottom-5 left-5 rounded-2xl bg-white px-4 py-3 shadow-lg"><p className="text-xs font-medium text-slate-500">Armá tu pedido</p><p className="mt-1 font-bold text-[#12355f]">Simple, rápido y cerca</p></div>
        <Image className="relative z-10 h-full w-full object-cover mix-blend-multiply" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85" alt="Productos frescos de supermercado" width={1000} height={750} />
      </div>
    </section>
  )
}