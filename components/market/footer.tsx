import { MessageCircle, ShoppingBag } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#102f53] py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div><div className="flex items-center gap-2 font-bold"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ShoppingBag /></span> Market Mutual</div><p className="mt-4 max-w-xs text-sm leading-6 text-blue-100/65">Mutual de los Trabajadores de la Construcción de la Patagonia.</p></div>
        <div><h3 className="font-bold">Comprar</h3><div className="mt-4 flex flex-col gap-2 text-sm text-blue-100/65"><a href="#productos">Productos</a><a href="#categorias">Categorías</a><a href="#ofertas">Ofertas</a></div></div>
        <div><h3 className="font-bold">Contacto</h3><div className="mt-4 flex flex-col gap-2 text-sm text-blue-100/65"><span>Av. Ricardo Gutiérrez Km 5 – Oficina 1</span><span>Rawson 1405</span><span>Coordiná por WhatsApp</span></div></div>
        <div><h3 className="font-bold">Seguinos</h3><div className="mt-4 flex gap-2"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><MessageCircle /></span><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><MessageCircle /></span></div></div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-5 text-xs text-blue-100/45 lg:px-8">© 2026 Market Mutual. Todos los derechos reservados.</div>
    </footer>
  )
}