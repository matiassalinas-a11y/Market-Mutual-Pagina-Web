export const MARKET_CONFIG = {
  // Número de WhatsApp del Market en formato internacional, solo dígitos
  // (ej. "5492964000000"). Si queda vacío, el botón de WhatsApp muestra un
  // aviso claro en lugar de intentar abrir un enlace.
  whatsappNumber: '5492974431131',
  deliveryMinimums: {
    north: 40000,
    south: 60000,
  },
  // Dejar en null mientras el comercio no defina un costo de envío.
  deliveryCosts: {
    north: null,
    south: null,
  },
}
