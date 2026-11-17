import { ArrowRight, Clock3, MapPin } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function Hero({ hasOffers }: { hasOffers: boolean }) {
  return (
    <section id="inicio" className="w-full scroll-mt-36 pb-5">
      <div className="relative isolate min-h-[410px] overflow-hidden bg-[#0d3c73] sm:min-h-[470px] lg:min-h-[520px]">
        <Image src="/images/marketmutual.jpg" alt="Interior de Market Mutual" fill preload sizes="100vw" className="-z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,39,80,0.96)_0%,rgba(8,39,80,0.88)_55%,rgba(8,39,80,0.55)_100%)] md:bg-[linear-gradient(90deg,rgba(8,39,80,0.96)_0%,rgba(8,39,80,0.82)_42%,rgba(8,39,80,0.26)_78%,rgba(8,39,80,0.08)_100%)]" />
        <div className="mx-auto flex min-h-[410px] max-w-7xl items-center px-4 py-12 sm:min-h-[470px] lg:min-h-[520px] lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md"><span className="size-2 rounded-full bg-[#73d7a4]" /> Tu compra, más simple</div>
            <h1 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl"><span className="text-[#76c9ff]">Market Mutual</span> - Tu lugar de conveniencia</h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">Elegí entre cientos de productos, armá tu carrito y coordiná la entrega con Market Mutual.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-white/85"><span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur"><MapPin className="size-3.5" /> Zonas norte y sur</span><span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur"><Clock3 className="size-3.5" /> 09:00 a 16:30</span></div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={hasOffers ? '#ofertas' : '#productos'}><Button size="lg" className="rounded-full bg-white px-6 font-bold text-[#1456a0] shadow-xl shadow-[#061b38]/25 hover:bg-[#eaf5ff] focus-visible:ring-2 focus-visible:ring-white">{hasOffers ? 'Ver ofertas' : 'Ver productos'} <ArrowRight data-icon="inline-end" /></Button></a>
              <a href="#como-comprar"><Button size="lg" variant="outline" className="rounded-full border-white/50 bg-white/10 px-6 font-bold text-white backdrop-blur-sm hover:bg-white hover:text-[#12355f] focus-visible:ring-2 focus-visible:ring-white">Cómo comprar</Button></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
