'use client'

import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type HeaderProps = {
  query: string
  onQueryChange: (value: string) => void
  menuOpen: boolean
  onToggleMenu: () => void
  cartCount: number
  onOpenCart: () => void
}

export function Header({
  query,
  onQueryChange,
  menuOpen,
  onToggleMenu,
  cartCount,
  onOpenCart,
}: HeaderProps) {
  return (
    <>
      <div className="bg-[#0d2d55] px-4 py-2 text-center text-xs font-medium tracking-wide text-white/90">Beneficios exclusivos para trabajadores y adherentes</div>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-4 lg:px-8">
          <a href="#inicio" className="flex shrink-0 items-center gap-2.5" aria-label="Market Mutual inicio">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#1456a0] text-white shadow-sm"><ShoppingBag /></span>
            <span className="text-lg font-bold tracking-tight text-[#12355f]">Market <span className="text-[#2385d5]">Mutual</span></span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
            <a className="text-[#1456a0]" href="#inicio">Inicio</a><a href="#productos" className="hover:text-[#1456a0]">Productos</a><a href="#categorias" className="hover:text-[#1456a0]">Categorías</a><a href="#ofertas" className="hover:text-[#1456a0]">Ofertas</a><a href="#como-comprar" className="hover:text-[#1456a0]">Cómo comprar</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden h-10 w-56 items-center gap-2 rounded-xl bg-slate-100 px-3 md:flex"><Search className="size-4 text-slate-400" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="¿Qué estás buscando?" aria-label="Buscar productos" /></div>
            <Button variant="ghost" size="icon" className="relative rounded-xl text-[#12355f]" onClick={onOpenCart} aria-label="Abrir carrito"><ShoppingBag />{cartCount > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#ee6b4d] text-[10px] font-bold text-white">{cartCount}</span>}</Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleMenu} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menuOpen && <nav className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 text-sm font-semibold lg:hidden"><a href="#inicio" onClick={onToggleMenu}>Inicio</a><a href="#productos" onClick={onToggleMenu}>Productos</a><a href="#categorias" onClick={onToggleMenu}>Categorías</a><a href="#ofertas" onClick={onToggleMenu}>Ofertas</a><a href="#como-comprar" onClick={onToggleMenu}>Cómo comprar</a></nav>}
      </header>
    </>
  )
}