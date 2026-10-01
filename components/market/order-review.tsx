'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/market/cart-store'
import { deliveryMinimum } from '@/lib/checkout'
import type { CheckoutData, DeliveryZone } from '@/lib/checkout'
import { formatMoney } from '@/lib/utils'

type OrderReviewProps = {
  data: CheckoutData
  onEdit: () => void
}

export function OrderReview({ data, onEdit }: OrderReviewProps) {
  const { cart, cartItems, subtotal, cartCount } = useCart()
  const [pendingWhatsApp, setPendingWhatsApp] = useState(false)
  const zone = data.zone as DeliveryZone

  if (!zone) return null

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-[#061a30]/40 backdrop-blur-sm" onClick={onEdit} aria-label="Cerrar revisión" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-4"><p className="text-xs font-bold uppercase tracking-widest text-[#2581d2]">Confirmación</p><h2 className="mt-1 text-xl font-bold text-[#12355f]">Pedido Market Mutual</h2></div>

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Datos del cliente</h3>
        <div className="mt-1 flex flex-col gap-1 text-sm text-[#16385f]"><span>Nombre: <strong>{data.name}</strong></span><span>Teléfono: <strong>{data.phone}</strong></span></div>

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Datos de entrega</h3>
        <div className="mt-1 flex flex-col gap-1 text-sm text-[#16385f]"><span>{data.address} — {data.barrio}</span><span>Zona: <strong>{zone}</strong></span>{data.reference && <span>Referencia: {data.reference}</span>}</div>

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Productos ({cartCount})</h3>
        <ul className="mt-1 flex flex-col gap-1.5 text-sm">
          {cartItems.map((product) => (
            <li key={product.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 text-[#16385f]"><span className="font-semibold text-[#1456a0]">{cart[product.id]} x</span> {product.name}</span>
              <span className="text-slate-600">{formatMoney(product.price * cart[product.id])}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
          <span className="font-semibold text-[#12355f]">Subtotal</span>
          <span className="text-lg font-bold text-[#12355f]">{formatMoney(subtotal)}</span>
        </div>

        <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
          <span>Zona: <strong>{zone}</strong></span>
          <span>Mínimo correspondiente: <strong>{formatMoney(deliveryMinimum(zone))}</strong></span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Los beneficios correspondientes se verificarán al confirmar el pedido.</p>

        <div className="mt-5 flex flex-col gap-3">
          <Button variant="outline" className="w-full rounded-xl border-slate-300 bg-white px-6 py-3.5 text-[#12355f]" onClick={onEdit}>Editar datos</Button>
          <Button className="w-full rounded-xl bg-[#1456a0] px-6 py-3.5 hover:bg-[#0d4381]" onClick={() => setPendingWhatsApp(true)}><span className="flex items-center gap-2"><MessageCircle className="size-4" /> Enviar pedido por WhatsApp</span></Button>
          {pendingWhatsApp && <p className="rounded-lg bg-slate-100 p-2.5 text-xs font-medium text-[#12355f]">Integración de WhatsApp pendiente para Stage 2. En este stage el envío real aún no está conectado.</p>}
        </div>
      </aside>
    </div>
  )
}