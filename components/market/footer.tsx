import Link from 'next/link'
import { Clock3 } from 'lucide-react'
import Image from 'next/image'

export function Footer({ hasOffers = false }: { hasOffers?: boolean }) {
  return (
    <footer className="bg-[#102f53] pb-24 pt-12 text-white md:pb-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div><Link href="/#inicio" aria-label="Market Mutual inicio" className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Image src="/images/market-mutual-logo-white.png" alt="Market Mutual" width={1151} height={1127} sizes="115px" className="h-28 w-auto object-contain" /></Link><p className="mt-4 max-w-xs text-sm leading-6 text-blue-100/65">Mutual de los Trabajadores de la Construcción de la Patagonia.</p></div>
        <div><h3 className="font-bold">Comprar</h3><div className="mt-4 flex flex-col gap-2 text-sm text-blue-100/65"><a href="#productos">Productos</a><a href="#categorias">Categorías</a>{hasOffers && <a href="#ofertas">Ofertas</a>}</div></div>
        <div><h3 className="font-bold">Contacto</h3><div className="mt-4 flex flex-col gap-2 text-sm text-blue-100/65"><span>Av. Ricardo Gutiérrez Km 5 – Oficina 1</span><span>Rawson 1405</span><span>Coordiná por WhatsApp</span></div></div>
        <div><h3 className="font-bold">Horario de entrega</h3><div className="mt-4 flex items-center gap-3 text-sm text-blue-100/65"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10"><Clock3 className="size-4" /></span><span>Todos los días<br />de 09:00 a 16:30</span></div></div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-5 text-xs text-blue-100/45 lg:px-8">© 2026 Market Mutual. Todos los derechos reservados.</div>
    </footer>
  )
}
