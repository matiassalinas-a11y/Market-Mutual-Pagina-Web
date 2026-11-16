'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock3, CreditCard, ShieldAlert, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/market/cart-store'
import { formatMoney } from '@/lib/utils'

type DemoStatus = 'approved' | 'pending' | 'rejected' | null

const statusCopy: Record<Exclude<DemoStatus, null>, { title: string; text: string; className: string }> = {
  approved: { title: 'Pago aprobado (simulado)', text: 'La presentación continúa como si Mercado Pago hubiera aprobado la operación.', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  pending: { title: 'Pago pendiente (simulado)', text: 'La presentación continúa como si la confirmación estuviera pendiente.', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  rejected: { title: 'Pago rechazado (simulado)', text: 'La presentación muestra el caso de rechazo y permite volver a intentar.', className: 'border-red-200 bg-red-50 text-red-800' },
}

export default function MercadoPagoDemoPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const params = use(searchParams)
  const { cart, cartItems, subtotal, ready } = useCart()
  const [status, setStatus] = useState<DemoStatus>(null)
  const orderNumber = params.order ?? 'MM-DEMO'

  return (
    <main className="min-h-screen bg-[#f2f6fb] px-4 py-8 text-[#12243b]">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#2581d2]">Mercado Pago · DEMO</p><h1 className="mt-2 text-2xl font-black text-[#12355f]">Simulador de pago</h1><p className="mt-1 text-sm text-slate-500">Referencia local {orderNumber}</p></div>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f4fd] text-[#1456a0]"><CreditCard /></span>
          </div>

          <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="note">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" /><p><strong>Entorno de presentación.</strong> No ingreses datos bancarios: esta pantalla no está conectada con Mercado Pago y no mueve dinero.</p>
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Resumen del pedido</h2>
            {!ready ? <p className="mt-3 text-sm text-slate-500">Cargando…</p> : cartItems.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No hay productos en el carrito. Podés usar los estados demo igualmente.</p> : <ul className="mt-3 flex max-h-48 flex-col gap-3 overflow-auto">{cartItems.map((product) => <li key={product.id} className="flex justify-between gap-4 text-sm"><span><strong>{cart[product.id]}×</strong> {product.name}</span><span className="shrink-0 font-semibold">{formatMoney(product.price * cart[product.id])}</span></li>)}</ul>}
            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-black"><span>Total estimado</span><span>{formatMoney(subtotal)}</span></div>
          </section>

          <section className="mt-7">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Elegí un resultado para la demo</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className="h-auto rounded-xl border-emerald-300 py-3 text-emerald-700" onClick={() => setStatus('approved')}><CheckCircle2 /> Aprobado</Button>
              <Button variant="outline" className="h-auto rounded-xl border-amber-300 py-3 text-amber-700" onClick={() => setStatus('pending')}><Clock3 /> Pendiente</Button>
              <Button variant="outline" className="h-auto rounded-xl border-red-300 py-3 text-red-700" onClick={() => setStatus('rejected')}><XCircle /> Rechazado</Button>
            </div>
          </section>

          {status && <div className={`mt-5 rounded-2xl border p-4 ${statusCopy[status].className}`} role="status"><p className="font-bold">{statusCopy[status].title}</p><p className="mt-1 text-sm">{statusCopy[status].text}</p></div>}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/checkout" className="flex-1"><Button variant="outline" className="w-full rounded-xl">← Volver al checkout</Button></Link>
            <Link href="/" className="flex-1"><Button className="w-full rounded-xl bg-[#1456a0] hover:bg-[#0d4381]">Volver a la tienda</Button></Link>
          </div>
        </div>
      </div>
    </main>
  )
}
