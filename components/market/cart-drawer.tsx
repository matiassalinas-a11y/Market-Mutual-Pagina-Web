'use client'

import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'
import type { Product } from '@/lib/market-data'

type CartDrawerProps = {
  open: boolean
  cart: Record<number, number>
  cartItems: Product[]
  cartCount: number
  total: number
  onUpdate: (id: number, amount: number) => void
  onClose: () => void
}

export function CartDrawer({
  open,
  cart,
  cartItems,
  cartCount,
  total,
  onUpdate,
  onClose,
}: CartDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-[#061a30]/40 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar carrito" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div><p className="text-xs font-bold uppercase tracking-widest text-[#2581d2]">Tu pedido</p><h2 className="mt-1 text-xl font-bold text-[#12355f]">Carrito <span className="text-slate-400">({cartCount})</span></h2></div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar carrito"><X /></Button>
        </div>
        <div className="flex-1 overflow-y-auto py-5">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center"><span className="flex size-16 items-center justify-center rounded-2xl bg-[#e7f2fc] text-[#1456a0]"><ShoppingBag /></span><h3 className="mt-4 font-bold text-[#12355f]">Tu carrito está vacío</h3><p className="mt-1 text-sm text-slate-500">Sumá productos para armar tu pedido.</p></div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((product) => (
                <div key={product.id} className="flex gap-3">
                  <Image src={product.image} alt="" width={64} height={64} className="size-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#16385f]">{product.name}</p>
                    <p className="mt-1 text-sm font-semibold text-[#1456a0]">{formatMoney(product.price)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => onUpdate(product.id, -1)} className="flex size-7 items-center justify-center rounded-md bg-slate-100" aria-label="Disminuir cantidad"><Minus className="size-3" /></button>
                      <span className="w-4 text-center text-sm font-bold">{cart[product.id]}</span>
                      <button onClick={() => onUpdate(product.id, 1)} className="flex size-7 items-center justify-center rounded-md bg-slate-100" aria-label="Aumentar cantidad"><Plus className="size-3" /></button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#12355f]">{formatMoney(product.price * cart[product.id])}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between text-sm text-slate-500"><span>Total estimado</span><span className="text-2xl font-bold text-[#12355f]">{formatMoney(total)}</span></div>
            <p className="mt-2 text-xs leading-5 text-slate-400">El precio final y los beneficios se confirmarán al procesar tu pedido.</p>
            <Button className="mt-5 w-full rounded-xl bg-[#1456a0] py-6 hover:bg-[#0d4381]">Continuar pedido <ArrowRight data-icon="inline-end" /></Button>
          </div>
        )}
      </aside>
    </div>
  )
}