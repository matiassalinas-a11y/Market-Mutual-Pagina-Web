'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/market/cart-store'
import { deliveryMinimum } from '@/lib/checkout'
import { buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/order'
import type { CheckoutData, DeliveryZone } from '@/lib/checkout'
import { formatMoney } from '@/lib/utils'

type OrderReviewProps = {
  orderNumber: string
  data: CheckoutData
  onEdit: () => void
}

export function OrderReview({ orderNumber, data, onEdit }: OrderReviewProps) {
  const { cart, cartItems, subtotal, cartCount } = useCart()
  const [whatsAppFeedback, setWhatsAppFeedback] = useState<'missing' | 'opening' | null>(null)
  const zone = data.zone as DeliveryZone

  if (!zone) return null

  const sendWhatsApp = () => {
    const items = cartItems.map((product) => ({ product, quantity: cart[product.id] }))
    const message = buildWhatsAppMessage({ orderNumber, data, items, subtotal })
    const url = buildWhatsAppUrl(message)
    if (!url) {
      setWhatsAppFeedback('missing')
      return
    }
    setWhatsAppFeedback('opening')
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => setWhatsAppFeedback(null), 6000)
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-[#061a30]/40 backdrop-blur-sm" onClick={onEdit} aria-label="Cerrar revisión" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-2"><p className="text-xs font-bold uppercase tracking-widest text-[#2581d2]">Confirmación</p><h2 className="mt-1 text-xl font-bold text-[#12355f]">Pedido Market Mutual</h2></div>
        <p className="text-sm font-semibold text-[#1456a0]">N° de pedido: {orderNumber}</p>

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Datos del cliente</h3>
        <div className="mt-1 flex flex-col gap-1 text-sm text-[#16385f]"><span>Nombre: <strong>{data.name}</strong></span><span>Teléfono: <strong>{data.phone}</strong></span></div>

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Datos de entrega</h3>
        <div className="mt-1 flex flex-col gap-1 text-sm text-[#16385f]">
          <span>Dirección: {data.address}</span>
          <span>Barrio: {data.barrio}</span>
          <span>Zona: <strong>{zone}</strong></span>
          {data.reference.trim() && <span>Referencia: {data.reference}</span>}
        </div>

        {data.observations.trim() && (
          <>
            <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Observaciones</h3>
            <p className="mt-1 text-sm text-[#16385f]">{data.observations}</p>
          </>
        )}

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Productos ({cartCount})</h3>
        <ul className="mt-1 flex flex-col gap-2 text-sm">
          {cartItems.map((product) => (
            <li key={product.id} className="flex flex-col gap-0.5">
              <span className="text-[#16385f]"><span className="font-semibold text-[#1456a0]">{cart[product.id]} x</span> {product.name}</span>
              <span className="text-xs text-slate-600">{formatMoney(product.price)} c/u — {formatMoney(product.price * cart[product.id])}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
          <span className="font-semibold text-[#12355f]">TOTAL ESTIMADO</span>
          <span className="text-lg font-bold text-[#12355f]">{formatMoney(subtotal)}</span>
        </div>

        <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
          <span>Zona: <strong>{zone}</strong> · Mínimo correspondiente: <strong>{formatMoney(deliveryMinimum(zone))}</strong></span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">Los beneficios correspondientes se verificarán al confirmar el pedido.</p>

        <div className="mt-5 flex flex-col gap-3">
          <Button variant="outline" className="w-full rounded-xl border-slate-300 bg-white px-6 py-3.5 text-[#12355f]" onClick={onEdit}>Editar datos</Button>
          <Button className="w-full rounded-xl bg-[#1456a0] px-6 py-3.5 hover:bg-[#0d4381]" onClick={sendWhatsApp}><span className="flex items-center gap-2"><MessageCircle className="size-4" /> Enviar pedido por WhatsApp</span></Button>
          {whatsAppFeedback === 'missing' && (
            <p className="flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs font-medium text-[#7a5900]"><AlertCircle className="size-4" /> El número de WhatsApp del Market todavía no está configurado.</p>
          )}
          {whatsAppFeedback === 'opening' && (
            <p className="rounded-lg bg-slate-100 p-2.5 text-xs font-medium text-[#12355f]">Abriendo WhatsApp… Si no abrió, verificá que el número esté configurado en lib/market-config.ts.</p>
          )}
          <Link href="/" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#1456a0]">← Volver a la tienda</Link>
        </div>
      </aside>
    </div>
  )
}