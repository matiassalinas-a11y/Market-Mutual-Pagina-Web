'use client'

import { BadgePercent } from 'lucide-react'
import { ProductCard } from '@/components/market/product-card'
import type { Product } from '@/lib/market-data'

type OffersSectionProps = {
  products: Product[]
  onAdd: (product: Product) => void
}

export function OffersSection({ products, onAdd }: OffersSectionProps) {
  if (products.length === 0) return null

  return (
    <section id="ofertas" className="border-y border-[#d8e9f8] bg-gradient-to-b from-[#eef7ff] to-[#f7f9fc] py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-7 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1456a0] px-3 py-1.5 text-xs font-bold text-white"><BadgePercent className="size-4" /> Precios especiales</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#102f53]">Ofertas de la semana</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Aprovechá estos productos seleccionados por tiempo limitado.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} variant="offer" />)}
        </div>
      </div>
    </section>
  )
}
