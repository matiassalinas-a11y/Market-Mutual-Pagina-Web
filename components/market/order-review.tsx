'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, CreditCard, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/market/cart-store'
import { deliveryMinimum } from '@/lib/checkout'
import { deliveryZoneForNeighborhood } from '@/lib/delivery-neighborhoods'
import { buildGocuotasDemoMessage } from '@/lib/order'
import type { CheckoutData } from '@/lib/checkout'
import { formatMoney } from '@/lib/utils'

type OrderReviewProps = {
  orderNumber: string
  data: CheckoutData
  onEdit: () => void
}

export function OrderReview({ orderNumber, data, onEdit }: OrderReviewProps) {
  const { cart, cartItems, subtotal, cartCount } = useCart()
  const [copied, setCopied] = useState(false)
  const zone = deliveryZoneForNeighborhood(data.barrio)
  const items = useMemo(
    () => cartItems.map((product) => ({ product, quantity: cart[product.id] })),
    [cart, cartItems],
  )
  const gocuotasMessage = useMemo(
    () => data.paymentMethod === 'gocuotas' && zone
      ? buildGocuotasDemoMessage({ orderNumber, data, items, subtotal })
      : '',
    [data, items, orderNumber, subtotal, zone],
  )

  if (!zone) return null

  const copyMessage = async () => {
    await navigator.clipboard.writeText(gocuotasMessage)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-[#061a30]/40 backdrop-blur-sm" onClick={onEdit} aria-label="Cerrar revisión" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white p-5 shadow-2xl" aria-label="Revisión del pedido demo">
        <div className="mb-2"><p className="text-xs font-bold uppercase tracking-widest text-[#2581d2]">Confirmación · DEMO</p><h2 className="mt-1 text-xl font-bold text-[#12355f]">Pedido Market Mutual</h2></div>
        <p className="text-sm font-semibold text-[#1456a0]">N° de referencia local: {orderNumber}</p>

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Datos del cliente</h3>
        <div className="mt-1 flex flex-col gap-1 text-sm text-[#16385f]"><span>Nombre: <strong>{data.name}</strong></span><span>Teléfono: <strong>{data.phone}</strong></span></div>

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Datos de entrega</h3>
        <div className="mt-1 flex flex-col gap-1 text-sm text-[#16385f]">
          <span>Dirección: {data.address}</span><span>Barrio: {data.barrio}</span><span>Zona: <strong>{zone}</strong></span>
          {data.reference.trim() && <span>Referencia: {data.reference}</span>}
        </div>

        {data.observations.trim() && <><h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Observaciones</h3><p className="mt-1 text-sm text-[#16385f]">{data.observations}</p></>}

        <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Productos ({cartCount})</h3>
        <ul className="mt-1 flex flex-col gap-2 text-sm">
          {cartItems.map((product) => <li key={product.id} className="flex flex-col gap-0.5"><span className="text-[#16385f]"><span className="font-semibold text-[#1456a0]">{cart[product.id]} x</span> {product.name}</span><span className="text-xs text-slate-600">{formatMoney(product.price)} c/u — {formatMoney(product.price * cart[product.id])}</span></li>)}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm"><span className="font-semibold text-[#12355f]">TOTAL ESTIMADO</span><span className="text-lg font-bold text-[#12355f]">{formatMoney(subtotal)}</span></div>
        <p className="mt-2 text-sm text-slate-600">Zona: <strong>{zone}</strong> · Mínimo: <strong>{formatMoney(deliveryMinimum(zone))}</strong></p>

        {data.paymentMethod === 'gocuotas' ? (
          <section className="mt-5 rounded-2xl border border-[#b8d8f3] bg-[#f1f8fe] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#12355f]"><MessageCircle className="size-5" /> GOcuotas · DEMO</div>
            <p className="mt-2 text-xs leading-5 text-slate-600">Vista previa del mensaje para coordinar financiación. No se abre WhatsApp ni se inicia una operación real.</p>
            <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-5 text-slate-600">{gocuotasMessage}</pre>
            <Button className="mt-3 w-full rounded-xl bg-[#1456a0] hover:bg-[#0d4381]" onClick={copyMessage}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Mensaje copiado' : 'Copiar mensaje demo'}</Button>
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-[#b8d8f3] bg-[#f1f8fe] p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#12355f]"><CreditCard className="size-5" /> Mercado Pago · DEMO</div>
            <p className="mt-2 text-xs leading-5 text-slate-600">Continuarás a una pantalla simulada. No se solicitan datos bancarios ni se procesa dinero.</p>
            <Link href={`/checkout/demo/mercado-pago?order=${encodeURIComponent(orderNumber)}`} className="mt-3 block"><Button className="w-full rounded-xl bg-[#1456a0] hover:bg-[#0d4381]">Continuar a Mercado Pago demo</Button></Link>
          </section>
        )}

        <div className="mt-5 flex flex-col gap-3">
          <Button variant="outline" className="w-full rounded-xl border-slate-300 bg-white px-6 py-3.5 text-[#12355f]" onClick={onEdit}>Editar datos</Button>
          <Link href="/" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#1456a0]">← Volver a la tienda</Link>
        </div>
      </aside>
    </div>
  )
}
