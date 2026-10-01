import { formatMoney } from '@/lib/utils'
import { MARKET_CONFIG } from '@/lib/market-config'
import type { CheckoutData, DeliveryZone } from '@/lib/checkout'
import type { Product } from '@/lib/market-data'

export type OrderLine = {
  product: Product
  quantity: number
}

/**
 * Genera un número de pedido visual local con formato mock:
 * MM-AAAAmmdd-XXXX (ej. "MM-20261001-1234").
 * No requiere backend: combina la fecha y una secuencia aleatoria de 4 dígitos.
 */
export function generateOrderNumber(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const sequence = String(Math.floor(1000 + Math.random() * 9000))
  return `MM-${year}${month}${day}-${sequence}`
}

function buildProductosSection(items: OrderLine[]): string {
  if (items.length === 0) return ''
  const lines = items.map((line) => {
    const unitPrice = formatMoney(line.product.price)
    const lineTotal = formatMoney(line.product.price * line.quantity)
    return `${line.quantity} x ${line.product.name}\n${unitPrice} c/u — ${lineTotal}`
  })
  return `\n\nPRODUCTOS\n\n${lines.join('\n\n')}`
}

export function buildWhatsAppMessage(options: {
  orderNumber: string
  data: CheckoutData
  items: OrderLine[]
  subtotal: number
}): string {
  const { orderNumber, data, items, subtotal } = options
  const zone = data.zone as DeliveryZone

  const numero = `\n\nN° de pedido: ${orderNumber}`
  const cliente = `\n\nCliente: ${data.name}\nTeléfono: ${data.phone}`
  const entrega = [
    '\n\nEntrega:',
    `Dirección: ${data.address}`,
    `Barrio: ${data.barrio}`,
    `Zona: ${zone}`,
    data.reference.trim() ? `Referencia: ${data.reference}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n')
  const total = `\n\nTOTAL ESTIMADO: ${formatMoney(subtotal)}`
  const observaciones = data.observations.trim() ? `\n\nObservaciones:\n${data.observations}` : ''
  const aviso = '\n\nLos beneficios correspondientes se verificarán al confirmar el pedido.'

  return (
    'Hola, quiero realizar un pedido en Market Mutual.\n\nPEDIDO MARKET MUTUAL'
    + numero + cliente + entrega + buildProductosSection(items) + total + observaciones + aviso
  )
}

/**
 * Construye el enlace `https://wa.me/`. Devuelve `null` si el número de
 * WhatsApp no está configurado en MARKET_CONFIG.
 */
export function buildWhatsAppUrl(message: string): string | null {
  const number = MARKET_CONFIG.whatsappNumber
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}