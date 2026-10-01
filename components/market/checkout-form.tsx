'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/market/cart-store'
import {
  deliveryMinimum,
  EMPTY_CHECKOUT,
  isCheckoutValid,
  missingToMinimum,
  validateCheckout,
} from '@/lib/checkout'
import type { CheckoutData, CheckoutErrors, CheckoutField, DeliveryZone } from '@/lib/checkout'
import { formatMoney } from '@/lib/utils'

type CheckoutFormProps = {
  onReview: (data: CheckoutData) => void
}

const inputClass =
  'h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#16385f] outline-none transition focus:border-[#1456a0] focus:ring-2 focus:ring-[#1456a0]/25'

const labelClass = 'text-sm font-semibold text-[#12355f]'

const ERROR_FIELDS: readonly CheckoutField[] = ['name', 'phone', 'address', 'barrio', 'zone']

function isErrorField(field: string): field is CheckoutField {
  return ERROR_FIELDS.some((errorField) => errorField === field)
}

export function CheckoutForm({ onReview }: CheckoutFormProps) {
  const { subtotal } = useCart()
  const [data, setData] = useState<CheckoutData>(EMPTY_CHECKOUT)
  const [errors, setErrors] = useState<CheckoutErrors>({})

  const zone = data.zone as DeliveryZone | ''
  const belowMinimum = zone !== '' && subtotal < deliveryMinimum(zone)
  const amountMissing = zone !== '' ? missingToMinimum(zone, subtotal) : 0
  const canReview = subtotal > 0 && !belowMinimum && isCheckoutValid(data)

  const setField = <K extends keyof CheckoutData>(field: K, value: CheckoutData[K]) => {
    setData((current) => ({ ...current, [field]: value }))
    const errorField = isErrorField(field) ? field : null
    if (errorField && errors[errorField]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[errorField]
        return next
      })
    }
  }

  const handleReview = () => {
    const nextErrors = validateCheckout(data)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0 && !belowMinimum) {
      onReview(data)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-[#2581d2]">Checkout</p><h2 className="mt-1 text-xl font-bold text-[#12355f]">Completá tus datos</h2></div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="checkout-name" className={labelClass}>Nombre y apellido <span className="text-red-600">*</span></label>
          <input id="checkout-name" value={data.name} onChange={(event) => setField('name', event.target.value)} className={inputClass} placeholder="Juan Pérez" autoComplete="name" />
          {errors.name && <p className="text-xs font-medium text-red-600">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="checkout-phone" className={labelClass}>Teléfono <span className="text-red-600">*</span></label>
          <input id="checkout-phone" value={data.phone} onChange={(event) => setField('phone', event.target.value)} className={inputClass} placeholder="11 2345 6789" type="tel" inputMode="tel" autoComplete="tel" />
          {errors.phone && <p className="text-xs font-medium text-red-600">{errors.phone}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="checkout-address" className={labelClass}>Dirección <span className="text-red-600">*</span></label>
          <input id="checkout-address" value={data.address} onChange={(event) => setField('address', event.target.value)} className={inputClass} placeholder="Calle y número" autoComplete="street-address" />
          {errors.address && <p className="text-xs font-medium text-red-600">{errors.address}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="checkout-barrio" className={labelClass}>Barrio <span className="text-red-600">*</span></label>
          <input id="checkout-barrio" value={data.barrio} onChange={(event) => setField('barrio', event.target.value)} className={inputClass} placeholder="Ej. Bella Vista" />
          {errors.barrio && <p className="text-xs font-medium text-red-600">{errors.barrio}</p>}
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className={labelClass}>Zona de entrega <span className="text-red-600">*</span></legend>
          <div className="flex gap-2">
            {(['Norte', 'Sur'] as DeliveryZone[]).map((option) => (
              <label key={option} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition">
                <input type="radio" name="zone" value={option} checked={data.zone === option} onChange={() => setField('zone', option)} className="accent-[#1456a0]" />
                {option}
              </label>
            ))}
          </div>
          {errors.zone && <p className="text-xs font-medium text-red-600">{errors.zone}</p>}
        </fieldset>

        {zone !== '' && (
          <div className={`rounded-xl border px-3 py-3 text-sm ${belowMinimum ? 'border-red-200 bg-red-50 text-[#c02929]' : 'border-green-200 bg-green-50 text-[#2e8b5b]'}`}>
            <p>Compra mínima para envío: <strong>{formatMoney(deliveryMinimum(zone))}</strong></p>
            {belowMinimum ? (
              <p className="mt-1 text-xs">Te faltan <strong>{formatMoney(amountMissing)}</strong> para alcanzar el mínimo de envío.</p>
            ) : (
              <p className="mt-1 text-xs">✓ Cumplís el mínimo para tu zona.</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="checkout-reference" className={labelClass}>Referencia del domicilio <span className="text-xs text-slate-400">(opcional)</span></label>
          <input id="checkout-reference" value={data.reference} onChange={(event) => setField('reference', event.target.value)} className={inputClass} placeholder="Ej. casa verde, frente a la plaza" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="checkout-observations" className={labelClass}>Observaciones <span className="text-xs text-slate-400">(opcional)</span></label>
          <textarea id="checkout-observations" value={data.observations} onChange={(event) => setField('observations', event.target.value)} className="min-h-20 w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#16385f] outline-none transition focus:border-[#1456a0] focus:ring-2 focus:ring-[#1456a0]/25" placeholder="Algún detalle para la entrega..." rows={3} />
        </div>

        <p className="text-xs text-slate-400">Los beneficios correspondientes se verificarán al confirmar el pedido.</p>

        <Button className="w-full rounded-xl bg-[#1456a0] px-6 py-3.5 hover:bg-[#0d4381]" disabled={!canReview} onClick={handleReview}>
          Revisar pedido
        </Button>
      </div>
    </section>
  )
}