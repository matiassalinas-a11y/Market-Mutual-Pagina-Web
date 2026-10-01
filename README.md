# Market Mutual

Tienda online (MVP) de la Mutual de los Trabajadores de la Construcción de la Patagonia.
Armá tu pedido online y coordiná la entrega por WhatsApp.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19 · TypeScript · Tailwind CSS v4 (shadcn/ui)
- pnpm

## Ejecutar localmente

```bash
pnpm install
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000).

Otros comandos:

```bash
pnpm lint      # ESLint (Next + React + TypeScript)
pnpm typecheck # tsc --noEmit
pnpm build     # build de producción
```

## Configurar el número de WhatsApp

El enlace del pedido se arma con `https://wa.me/` a partir de un número centralizado:

- Editar **`lib/market-config.ts`** → `MARKET_CONFIG.whatsappNumber` (formato internacional, solo dígitos, ej. `"5492964000000"`).

Si el número queda vacío, el botón "Enviar pedido por WhatsApp" no se rompe: muestra un aviso
claro de que el número todavía no está configurado.

## Estado del proyecto (MVP)

- ✅ Carrito persistente (localStorage) con agregar / modificar cantidad / eliminar.
- ✅ Checkout en `/checkout` con formulario, zonas y mínimo de compra (Norte $40.000 / Sur $60.000).
- ✅ Revisión de pedido con número mock `MM-AAAAmmdd-XXXX` y enlace de WhatsApp.
- ⚠️ **Productos, stock y precios todavía son datos mock** (`lib/market-data.ts`).
- ⚠️ **No hay backend real todavía**: no hay base de datos, Supabase, POSBerry, pagos ni autenticación.
- ⚠️ El número de pedido es un identificador visual local (sin persistencia).

## Estructura

```
app/
  layout.tsx  page.tsx  checkout/page.tsx
components/market/   # header, hero, secciones, cart-store, checkout, order-review...
lib/                 # market-data (mock), checkout, order, market-config, utils
```