'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { products } from '@/lib/market-data'
import type { Product } from '@/lib/market-data'

const STORAGE_KEY = 'market-mutual-cart-v1'

type Cart = Record<number, number>

type CartContextValue = {
  cart: Cart
  ready: boolean
  cartItems: Product[]
  cartCount: number
  subtotal: number
  addToCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeFromCart: (productId: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

function isCart(value: unknown): value is Cart {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return Object.values(value).every((quantity) => typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0)
}

function loadCart(): Cart {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isCart(parsed)) return parsed
    }
  } catch {
    // Ignorar errores de lectura (ej. almacenamiento corrupto o bloqueado).
  }
  return {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(loadCart)
  // `ready` evita errores de hydration: tanto el servidor como el primer render
  // del cliente parten con ready=false (no se muestra UI dependiente del carrito).
  // Tras el primer efecto (solo client) se marca ready, y el carrito ya fue
  // cargado de forma perezosa por loadCart() al inicializar el estado.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Marcar el carrito como listo únicamente tras el montaje del cliente.
    // Es un caso reconocido de "sincronizar con una fuente externa" (localStorage):
    // tanto servidor como primer render parten con ready=false para no generar
    // desajuste de hydration, y la UI dependiente del carrito se muestra recién acá.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // Ignorar errores de escritura (ej. modo privado con almacenamiento bloqueado).
    }
  }, [cart, ready])

  const addToCart = (productId: number) => {
    setCart((current) => ({ ...current, [productId]: (current[productId] || 0) + 1 }))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    setCart((current) => {
      if (quantity <= 0) {
        const next = { ...current }
        delete next[productId]
        return next
      }
      return { ...current, [productId]: quantity }
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  const clearCart = () => setCart({})

  const cartItems = products.filter((product) => cart[product.id] != null)
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const subtotal = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0)

  const value: CartContextValue = {
    cart,
    ready,
    cartItems,
    cartCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de un CartProvider')
  return context
}