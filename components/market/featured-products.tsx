'use client'
import { ProductCard } from './product-card'
import type { Product } from '@/lib/market-data'
export function FeaturedProducts({
  products,
  onAdd,
}: {
  products: Product[]
  onAdd: (product: Product) => void
}) {
  if (!products.length) return null
  return (
    <section
      aria-labelledby="featured-products-title"
      className="mx-auto max-w-7xl px-4 py-8 lg:px-8"
    >
      <h2
        id="featured-products-title"
        className="mb-5 text-2xl font-extrabold text-[#12355f] sm:text-3xl"
      >
        Productos destacados
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAdd} />
        ))}
      </div>
    </section>
  )
}
