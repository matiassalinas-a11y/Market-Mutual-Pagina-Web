import {
  deliveryZoneForNeighborhood,
  OTHER_NEIGHBORHOOD,
} from '@/lib/delivery-neighborhoods'
import type { DeliveryZone } from '@/lib/delivery-neighborhoods'

export type { DeliveryZone } from '@/lib/delivery-neighborhoods'

export type PaymentMethod = 'mercado_pago' | 'gocuotas'

export type CheckoutData = {
  name: string
  phone: string
  address: string
  barrio: string
  zone: DeliveryZone | ''
  reference: string
  observations: string
  paymentMethod: PaymentMethod | ''
}

export const EMPTY_CHECKOUT: CheckoutData = {
  name: '',
  phone: '',
  address: '',
  barrio: '',
  zone: '',
  reference: '',
  observations: '',
  paymentMethod: '',
}

export const DELIVERY_MINIMUM: Record<DeliveryZone, number> = {
  Norte: 40000,
  Sur: 60000,
}

export type CheckoutField = 'name' | 'phone' | 'address' | 'barrio' | 'zone' | 'paymentMethod'

export type CheckoutErrors = Partial<Record<CheckoutField, string>>

export function validateCheckout(data: CheckoutData): CheckoutErrors {
  const errors: CheckoutErrors = {}

  if (!data.name.trim()) {
    errors.name = 'El nombre y apellido son obligatorios.'
  }

  const phoneDigits = data.phone.replace(/\D/g, '')
  if (!data.phone.trim()) {
    errors.phone = 'El teléfono es obligatorio.'
  } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Ingresá un teléfono válido.'
  }

  if (!data.address.trim()) {
    errors.address = 'La dirección es obligatoria.'
  }

  if (!data.barrio.trim()) {
    errors.barrio = 'El barrio es obligatorio.'
  }

  const derivedZone = deliveryZoneForNeighborhood(data.barrio)
  if (data.barrio === OTHER_NEIGHBORHOOD) {
    errors.zone = 'Consultanos para confirmar la zona y el mínimo de envío.'
  } else if (!derivedZone || data.zone !== derivedZone) {
    errors.zone = 'Seleccioná un barrio disponible para determinar la zona de entrega.'
  }

  if (!data.paymentMethod) {
    errors.paymentMethod = 'Elegí cómo querés continuar con el pago demo.'
  }

  return errors
}

export function isCheckoutValid(data: CheckoutData): boolean {
  return Object.keys(validateCheckout(data)).length === 0
}

export function deliveryMinimum(zone: DeliveryZone): number {
  return DELIVERY_MINIMUM[zone]
}

export function missingToMinimum(zone: DeliveryZone, subtotal: number): number {
  return Math.max(0, DELIVERY_MINIMUM[zone] - subtotal)
}
