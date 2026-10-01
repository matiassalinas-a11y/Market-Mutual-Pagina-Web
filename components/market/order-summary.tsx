'use client'

import Link from 'next/link'
import { useCart } from '@/components/market/cart-store'
import { formatMoney } from '@/lib/utils'

export function OrderSummary() {
  const { cart, cartItems, cartCount, subtotal } = useCart()

  if (cartItems.length === 0) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-widest text-[#2581d2]">Tu pedido</p><h2 className="mt-1 text-xl font-bold text-[#12355f]">Resumen ({cartCount})</h2></div>
      <ul className="flex flex-col gap-2 text-sm">
        {cartItems.map((product) => (
          <li key={product.id} className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 flex-1 truncate text-[#16385f]">
              <span className="font-semibold text-[#1456a0]">{cart[product.id]} x</span> {product.name}
            </span>
            <span className="text-slate-600">{formatMoney(product.price * cart[product.id])}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
        <span className="font-semibold text-[#12355f]">Subtotal</span>
        <span className="text-lg font-bold text-[#12355f]">{formatMoney(subtotal)}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">Los beneficios correspondientes se verificarán al confirmar el pedido.</p>
      <Link href="/#productos" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#1456a0] hover:underline">← Seguir comprando</Link>
    </section>
  )
}