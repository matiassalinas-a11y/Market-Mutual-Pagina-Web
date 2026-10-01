'use client'

import { ProductCard } from '@/components/market/product-card'
import type { Product } from '@/lib/market-data'

type ProductSectionProps = {
  products: Product[]
  category: string
  onSelectCategory: (name: string) => void
  onAdd: (product: Product) => void
}

export function ProductSection({ products, category, onSelectCategory, onAdd }: ProductSectionProps) {
  return (
    <section id="productos" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-bold uppercase tracking-widest text-[#2581d2]">Elegidos para vos</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53]">Productos destacados</h2></div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button onClick={() => onSelectCategory('Todos')} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === 'Todos' ? 'bg-[#1456a0] text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
            {['Almacén', 'Bebidas', 'Lácteos'].map((item) => (
              <button key={item} onClick={() => onSelectCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category === item ? 'bg-[#1456a0] text-white' : 'bg-slate-100 text-slate-600'}`}>{item}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} />)}
        </div>
      </div>
    </section>
  )
}