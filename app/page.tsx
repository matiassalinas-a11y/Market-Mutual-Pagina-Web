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
import { PaymentMethodsSection } from '@/components/market/payment-methods-section'
import { MobileBottomNav } from '@/components/market/mobile-bottom-nav'
import { ProductSection } from '@/components/market/product-section'
import { useCart } from '@/components/market/cart-store'
import { useCatalog } from '@/components/market/catalog-store'
import type { Product } from '@/lib/market-data'

export default function Page() {
  const { cartCount, ready, addToCart } = useCart()
  const { products, categories, source, meta } = useCatalog()
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [category, setCategory] = useState('Todos')
  const [visibleCount, setVisibleCount] = useState(48)

  const availableProducts = useMemo(
    () => products.filter((product) => product.available && product.stock != null && product.stock > 0),
    [products],
  )

  const visibleProducts = useMemo(() => availableProducts.filter((product) => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchesQuery = !normalizedQuery || [product.name, product.sku, product.barcode, product.category]
      .some((value) => value?.toLowerCase().includes(normalizedQuery))
    const matchesCategory = category === 'Todos' || product.category === category
    return matchesQuery && matchesCategory
  }), [query, category, availableProducts])

  const offerProducts = useMemo(() => availableProducts.filter((product) => product.offer === true), [availableProducts])

  const changeQuery = (value: string) => {
    setQuery(value)
    setVisibleCount(48)
  }

  const changeCategory = (value: string) => {
    setCategory(value)
    setVisibleCount(48)
  }

  const addToCartAndOpen = (product: Product) => {
    addToCart(product.id)
    setCartOpen(true)
  }

  const selectCategoryFromBrowse = (name: string) => {
    changeCategory(name)
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4f9fe_0%,#f8fbfe_44%,#f4f8fc_100%)] pb-24 text-[#12243b] md:pb-0">
      <Header
        query={query}
        onQueryChange={changeQuery}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen(!menuOpen)}
        cartCount={cartCount}
        cartReady={ready}
        hasOffers={offerProducts.length > 0}
        onOpenCart={() => setCartOpen(true)}
      />
      <div className="mx-auto max-w-7xl px-4 pt-4 lg:px-8">
        <div className={`rounded-full px-4 py-2 text-center text-[11px] font-bold sm:text-xs ${source === 'demo' ? 'bg-amber-50 text-amber-800' : 'bg-[#e5f4ee] text-[#247351]'}`}>
          {source === 'demo'
            ? 'CATÁLOGO DEMO · Los productos y precios son ilustrativos.'
            : source === 'posberry'
              ? `CATÁLOGO POSBERRY · ${availableProducts.length.toLocaleString('es-AR')} productos disponibles.`
              : `CATÁLOGO LOCAL · ${availableProducts.length.toLocaleString('es-AR')} productos disponibles desde ${meta?.fileName ?? 'archivo local'}.`}
        </div>
      </div>
      <Hero hasOffers={offerProducts.length > 0} />
      <CategorySection categories={categories} onSelect={selectCategoryFromBrowse} />
      <OffersSection products={offerProducts} onAdd={addToCartAndOpen} />
      <ProductSection
        products={visibleProducts.slice(0, visibleCount)}
        total={visibleProducts.length}
        categories={categories}
        category={category}
        query={query}
        source={source}
        onQueryChange={changeQuery}
        onSelectCategory={changeCategory}
        onLoadMore={() => setVisibleCount((current) => current + 48)}
        onAdd={addToCartAndOpen}
      />
      <BenefitsSection />
      <HowToBuySection />
      <PaymentMethodsSection />
      <DeliverySection />
      <Footer hasOffers={offerProducts.length > 0} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileBottomNav cartReady={ready} cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />
    </main>
  )
}
