'use client'

import { Grid2X2, Home, ShoppingBag } from 'lucide-react'

type MobileBottomNavProps = {
  cartReady: boolean
  cartCount: number
  onOpenCart: () => void
}

export function MobileBottomNav({ cartReady, cartCount, onOpenCart }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 rounded-[24px] border border-[#dceaf7] bg-white/95 px-2 py-2 shadow-[0_16px_45px_rgba(18,53,95,0.2)] backdrop-blur-xl md:hidden" aria-label="Navegación principal móvil">
      <a href="#inicio" className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-bold text-[#1456a0]"><Home className="size-5" />Inicio</a>
      <a href="#categorias" className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-bold text-[#607b99]"><Grid2X2 className="size-5" />Categorías</a>
      <button type="button" onClick={onOpenCart} className="relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] bg-[#1456a0] text-[10px] font-bold text-white" aria-label={cartReady ? `Abrir carrito desde la navegación inferior, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}` : 'Abrir carrito desde la navegación inferior'}><ShoppingBag className="size-5" />Carrito{cartReady && cartCount > 0 && <span className="absolute right-[calc(50%-22px)] top-1 flex size-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#1456a0]">{cartCount}</span>}</button>
    </nav>
  )
}
