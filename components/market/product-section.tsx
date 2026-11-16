'use client'

import { Button } from '@/components/ui/button'
import type { CatalogCategory } from '@/components/market/catalog-store'
import { ProductCard } from '@/components/market/product-card'
import type { Product } from '@/lib/market-data'

type ProductSectionProps = {
  products: Product[]
  total: number
  categories: CatalogCategory[]
  category: string
  query: string
  source: 'demo' | 'imported' | 'posberry'
  onQueryChange: (value: string) => void
  onSelectCategory: (name: string) => void
  onLoadMore: () => void
  onAdd: (product: Product) => void
}

export function ProductSection({ products, total, categories, category, source, onSelectCategory, onLoadMore, onAdd }: ProductSectionProps) {
  return (
    <section id="productos" className="scroll-mt-36 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-6">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#2581d2]">{source === 'demo' ? 'Catálogo de demostración' : source === 'posberry' ? 'Catálogo POSBerry' : 'Catálogo local'}</p><h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#102f53] sm:text-3xl">Productos destacados</h2></div><p className="shrink-0 text-xs font-bold text-[#607b99] sm:text-sm">{total.toLocaleString('es-AR')} productos</p></div>
          <div className="hide-scrollbar mt-5 flex max-w-full items-center gap-2 overflow-x-auto pb-2">
            <button aria-pressed={category === 'Todos'} onClick={() => onSelectCategory('Todos')} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === 'Todos' ? 'bg-[#1456a0] text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>
            {categories.map((item) => (
              <button key={item.name} aria-pressed={category === item.name} onClick={() => onSelectCategory(item.name)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category === item.name ? 'bg-[#1456a0] text-white' : 'bg-slate-100 text-slate-600'}`}>{item.name}</button>
            ))}
          </div>
        </div>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center"><p className="font-bold text-[#12355f]">No encontramos productos</p><p className="mt-2 text-sm text-slate-500">Probá con otra búsqueda o categoría.</p></div>
        ) : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} />)}
        </div>}
        {products.length < total && <div className="mt-9 flex justify-center"><Button variant="outline" className="rounded-full border-[#1456a0] bg-white px-6 text-[#1456a0] shadow-sm" onClick={onLoadMore}>Mostrar 48 productos más</Button></div>}
      </div>
    </section>
  )
}
