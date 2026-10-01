'use client'

import { useMemo, useState } from 'react'
import { BenefitsSection } from '@/components/market/benefits-section'
import { CartDrawer } from '@/components/market/cart-drawer'
import { CategorySection } from '@/components/market/category-section'
import { DeliverySection } from '@/components/market/delivery-section'
import { Footer } from '@/components/market/footer'
import { Header } from '@/components/market/header'
import { Hero } from '@/components/market/hero'
import { HowToBuySection } from '@/components/market/how-to-buy-section'
import { OffersSection } from '@/components/market/offers-section'
import { ProductSection } from '@/components/market/product-section'
import { useCart } from '@/components/market/cart-store'
import { products } from '@/lib/market-data'
import type { Product } from '@/lib/market-data'

export default function Page() {
  const { cartCount, ready, addToCart } = useCart()
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [category, setCategory] = useState('Todos')

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'Todos' || product.category === category
    return matchesQuery && matchesCategory
  }), [query, category])

  const addToCartAndOpen = (product: Product) => {
    addToCart(product.id)
    setCartOpen(true)
  }

  const selectCategoryFromBrowse = (name: string) => {
    setCategory(name)
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#12243b]">
      <Header
        query={query}
        onQueryChange={setQuery}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        cartCount={cartCount}
        cartReady={ready}
        onOpenCart={() => setCartOpen(true)}
      />
      <Hero />
      <CategorySection onSelect={selectCategoryFromBrowse} />
      <ProductSection products={visibleProducts} category={category} onSelectCategory={setCategory} onAdd={addToCartAndOpen} />
      <OffersSection />
      <BenefitsSection />
      <HowToBuySection />
      <DeliverySection />
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  )
}