'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgePercent,
  Clock3,
  MessageCircle,
  MapPin,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Truck,
  UsersRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Product = {
  id: number
  name: string
  category: string
  price: number
  image: string
  offer?: string
  oldPrice?: number
  available: boolean
}

const products: Product[] = [
  { id: 1, name: 'Coca Cola 2,25 L', category: 'Bebidas', price: 3500, image: 'https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 2, name: 'Yerba Playadito 1 kg', category: 'Almacén', price: 4200, image: 'https://images.unsplash.com/photo-1605333166272-6d7f5cf6f2cc?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 3, name: 'Pizza lista para hornear', category: 'Congelados', price: 12000, image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=700&q=80', available: true, offer: '-15%', oldPrice: 14100 },
  { id: 4, name: 'Aceite Natura 900 ml', category: 'Almacén', price: 2800, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 5, name: 'Arroz Gallo 1 kg', category: 'Almacén', price: 1900, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 6, name: 'Leche entera 1 L', category: 'Lácteos', price: 1600, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=700&q=80', available: true, offer: '-10%', oldPrice: 1780 },
  { id: 7, name: 'Pan de molde blanco', category: 'Almacén', price: 2400, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80', available: true },
  { id: 8, name: 'Jabón líquido 3 L', category: 'Limpieza', price: 5800, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=700&q=80', available: true },
]

const categories = [
  ['Almacén', 'Despensa para todos los días', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80'],
  ['Bebidas', 'Refrescá tus momentos', 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=500&q=80'],
  ['Lácteos', 'Frescura garantizada', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=80'],
  ['Limpieza', 'Tu casa siempre lista', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=500&q=80'],
  ['Congelados', 'Prácticos y ricos', 'https://images.unsplash.com/photo-1481391032119-d89fee407e44?auto=format&fit=crop&w=500&q=80'],
]

const money = (value: number) => `$${value.toLocaleString('es-AR')}`

export default function Page() {
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [category, setCategory] = useState('Todos')

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'Todos' || product.category === category
    return matchesQuery && matchesCategory
  }), [query, category])

  const cartItems = products.filter((product) => cart[product.id])
  const cartCount = Object.values(cart).reduce((sum, value) => sum + value, 0)
  const total = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0)

  const addToCart = (id: number) => setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }))
  const updateCart = (id: number, amount: number) => setCart((current) => {
    const next = { ...current, [id]: Math.max(0, (current[id] || 0) + amount) }
    if (!next[id]) delete next[id]
    return next
  })

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#12243b]">
      <div className="bg-[#0d2d55] px-4 py-2 text-center text-xs font-medium tracking-wide text-white/90">Beneficios exclusivos para trabajadores y adherentes</div>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-4 lg:px-8">
          <a href="#inicio" className="flex shrink-0 items-center gap-2.5" aria-label="Market Mutual inicio">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#1456a0] text-white shadow-sm"><ShoppingBag /></span>
            <span className="text-lg font-bold tracking-tight text-[#12355f]">Market <span className="text-[#2385d5]">Mutual</span></span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
            <a className="text-[#1456a0]" href="#inicio">Inicio</a><a href="#productos" className="hover:text-[#1456a0]">Productos</a><a href="#categorias" className="hover:text-[#1456a0]">Categorías</a><a href="#ofertas" className="hover:text-[#1456a0]">Ofertas</a><a href="#como-comprar" className="hover:text-[#1456a0]">Cómo comprar</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden h-10 w-56 items-center gap-2 rounded-xl bg-slate-100 px-3 md:flex"><Search className="size-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="¿Qué estás buscando?" aria-label="Buscar productos" /></div>
            <Button variant="ghost" size="icon" className="relative rounded-xl text-[#12355f]" onClick={() => setCartOpen(true)} aria-label="Abrir carrito"><ShoppingBag />{cartCount > 0 && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#ee6b4d] text-[10px] font-bold text-white">{cartCount}</span>}</Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">{menuOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {menuOpen && <nav className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 text-sm font-semibold lg:hidden"><a href="#inicio" onClick={() => setMenuOpen(false)}>Inicio</a><a href="#productos" onClick={() => setMenuOpen(false)}>Productos</a><a href="#categorias" onClick={() => setMenuOpen(false)}>Categorías</a><a href="#ofertas" onClick={() => setMenuOpen(false)}>Ofertas</a><a href="#como-comprar" onClick={() => setMenuOpen(false)}>Cómo comprar</a></nav>}
      </header>

      <section id="inicio" className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-10 md:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pb-24">
        <div><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#e7f2fc] px-3 py-1.5 text-xs font-bold text-[#1456a0]"><span className="size-2 rounded-full bg-[#2e9b69]" /> Tu compra, más simple</div><h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-[#102f53] md:text-6xl">Todo lo que necesitás, <span className="text-[#2581d2]">más cerca tuyo.</span></h1><p className="mt-6 max-w-lg text-base leading-7 text-slate-600 md:text-lg">Encontrá productos para todos los días, armá tu pedido online y coordiná la entrega directamente con Market Mutual.</p><div className="mt-8 flex flex-wrap gap-3"><a href="#productos"><Button size="lg" className="rounded-xl bg-[#1456a0] px-6 shadow-lg shadow-blue-900/15 hover:bg-[#0d4381]">Ver productos <ArrowRight data-icon="inline-end" /></Button></a><a href="#como-comprar"><Button size="lg" variant="outline" className="rounded-xl border-slate-300 bg-white px-6 text-[#12355f]">Cómo comprar</Button></a></div><div className="mt-9 flex items-center gap-3 text-sm text-slate-500"><div className="flex -space-x-2"><span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#dceeff] text-xs font-bold text-[#1456a0]">M</span><span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#ffe4d7] text-xs font-bold text-[#a64e35]">J</span><span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#dff2e8] text-xs font-bold text-[#24734c]">L</span></div><span>Una mutual que está cerca tuyo</span></div></div>
        <div className="relative min-h-[340px] overflow-hidden rounded-[2rem] bg-[#dfeefa] p-5 shadow-sm md:min-h-[460px]"><div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/50" /><div className="absolute bottom-5 left-5 rounded-2xl bg-white px-4 py-3 shadow-lg"><p className="text-xs font-medium text-slate-500">Armá tu pedido</p><p className="mt-1 font-bold text-[#12355f]">Simple, rápido y cerca</p></div><img className="relative z-10 h-full w-full object-cover mix-blend-multiply" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85" alt="Productos frescos de supermercado" /></div>
      </section>

      <section id="categorias" className="mx-auto max-w-7xl px-4 py-14 lg:px-8"><div className="mb-7 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-[#2581d2]">Explorá</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53]">Comprá por categoría</h2></div><a href="#productos" className="hidden items-center gap-1 text-sm font-bold text-[#1456a0] sm:flex">Ver todas <ArrowRight className="size-4" /></a></div><div className="flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">{categories.map(([name, subtitle, image]) => <button key={name} onClick={() => { setCategory(name); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }) }} className="group relative min-w-[190px] snap-start overflow-hidden rounded-2xl bg-slate-200 text-left md:min-w-0"><img src={image} alt={name} className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#0d2d55]/90 via-[#0d2d55]/15 to-transparent" /><div className="absolute inset-x-4 bottom-4"><p className="font-bold text-white">{name}</p><p className="mt-1 text-xs text-white/75">{subtitle}</p></div></button>)}</div></section>

      <section id="productos" className="bg-white py-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-[#2581d2]">Elegidos para vos</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53]">Productos destacados</h2></div><div className="flex items-center gap-2 overflow-x-auto pb-1"><button onClick={() => setCategory('Todos')} className={`rounded-full px-4 py-2 text-sm font-semibold ${category === 'Todos' ? 'bg-[#1456a0] text-white' : 'bg-slate-100 text-slate-600'}`}>Todos</button>{['Almacén', 'Bebidas', 'Lácteos'].map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${category === item ? 'bg-[#1456a0] text-white' : 'bg-slate-100 text-slate-600'}`}>{item}</button>)}</div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{visibleProducts.map((product) => <article key={product.id} className="group rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-3"><div className="relative overflow-hidden rounded-xl bg-[#f3f6f9]"><img src={product.image} alt={product.name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />{product.offer && <span className="absolute left-2 top-2 rounded-md bg-[#ee6b4d] px-2 py-1 text-[10px] font-bold text-white">{product.offer}</span>}</div><div className="px-1 pb-1 pt-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{product.category}</p><h3 className="mt-1 min-h-10 text-sm font-bold leading-5 text-[#16385f]">{product.name}</h3><div className="mt-3 flex items-end justify-between gap-2"><div><p className="text-lg font-bold text-[#12355f]">{money(product.price)}</p>{product.oldPrice && <p className="text-xs text-slate-400 line-through">{money(product.oldPrice)}</p>}</div><Button onClick={() => { addToCart(product.id); setCartOpen(true) }} size="sm" className="size-9 rounded-lg bg-[#e7f2fc] p-0 text-[#1456a0] hover:bg-[#1456a0] hover:text-white" aria-label={`Agregar ${product.name}`}><Plus /></Button></div><p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#2e8b5b]"><span className="size-1.5 rounded-full bg-[#2e9b69]" /> Disponible</p></div></article>)}</div></div></section>

      <section id="ofertas" className="mx-auto max-w-7xl px-4 py-16 lg:px-8"><div className="overflow-hidden rounded-[2rem] bg-[#123b6b] p-7 text-white md:p-12"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#bde0fb]"><BadgePercent className="size-4" /> Ofertas de la semana</div><h2 className="max-w-lg text-3xl font-bold tracking-tight md:text-4xl">Más ahorro para acompañar tu semana.</h2><p className="mt-4 max-w-md leading-7 text-blue-100/75">Encontrá precios especiales en productos seleccionados y aprovechá tus beneficios.</p><a href="#productos" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#123b6b]">Ver ofertas <ArrowRight className="size-4" /></a></div><div className="hidden items-center gap-3 md:flex"><div className="rotate-[-6deg] rounded-2xl bg-[#f8d8c9] p-4 text-[#9c503b] shadow-xl"><p className="text-xs font-bold">-15%</p><p className="mt-2 text-3xl font-black">Pizza</p></div><div className="translate-y-5 rotate-[7deg] rounded-2xl bg-[#d9eddb] p-4 text-[#347047] shadow-xl"><p className="text-xs font-bold">-10%</p><p className="mt-2 text-3xl font-black">Leche</p></div></div></div></div></section>

      <section className="border-y border-slate-200 bg-[#f7f9fc] py-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-[#2581d2]">Cerca tuyo</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53]">Beneficios Market Mutual</h2></div><div className="grid gap-4 md:grid-cols-2"><div className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f2fc] text-[#1456a0]"><UsersRound /></span><div><h3 className="font-bold text-[#12355f]">Beneficios exclusivos para trabajadores</h3><p className="mt-1 text-sm text-slate-500">Hasta un <strong className="text-[#1456a0]">30% de beneficio</strong> en productos seleccionados.</p></div></div><div className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f5ec] text-[#2e8b5b]"><BadgePercent /></span><div><h3 className="font-bold text-[#12355f]">Beneficios para adherentes</h3><p className="mt-1 text-sm text-slate-500">Disfrutá hasta un <strong className="text-[#2e8b5b]">20% de beneficio</strong>.</p></div></div></div><p className="mt-5 text-xs text-slate-400">Las condiciones finales se verifican al confirmar el pedido.</p></div></section>

      <section id="como-comprar" className="mx-auto max-w-7xl px-4 py-16 lg:px-8"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-widest text-[#2581d2]">Así de simple</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53]">Cómo comprar</h2><p className="mt-4 leading-7 text-slate-600">Hacé tu pedido desde donde estés. Nosotros nos ocupamos del resto.</p></div><div className="grid gap-3 sm:grid-cols-4">{['Elegí tus productos', 'Agregalos al carrito', 'Completá tus datos', 'Enviá por WhatsApp'].map((step, index) => <div key={step} className="rounded-2xl border border-slate-200 bg-white p-4"><span className="flex size-9 items-center justify-center rounded-full bg-[#e7f2fc] text-sm font-bold text-[#1456a0]">0{index + 1}</span><p className="mt-5 text-sm font-bold leading-5 text-[#16385f]">{step}</p></div>)}</div></div></section>

      <section className="bg-[#e7f2fc] py-12"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between lg:px-8"><div><h2 className="text-2xl font-bold text-[#12355f]">Recibí tu pedido</h2><p className="mt-2 text-sm text-slate-600">Hacé tu compra online y coordinamos el envío directamente con vos.</p></div><div className="flex flex-wrap gap-5 text-sm font-semibold text-[#12355f]"><span className="flex items-center gap-2"><Truck className="text-[#2581d2]" /> Zona norte: $40.000</span><span className="flex items-center gap-2"><MapPin className="text-[#2581d2]" /> Zona sur: $60.000</span><span className="flex items-center gap-2"><Clock3 className="text-[#2581d2]" /> 09:00 a 16:30</span></div></div></section>

      <footer className="bg-[#102f53] py-12 text-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8"><div><div className="flex items-center gap-2 font-bold"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ShoppingBag /></span> Market Mutual</div><p className="mt-4 max-w-xs text-sm leading-6 text-blue-100/65">Mutual de los Trabajadores de la Construcción de la Patagonia.</p></div><div><h3 className="font-bold">Comprar</h3><div className="mt-4 flex flex-col gap-2 text-sm text-blue-100/65"><a href="#productos">Productos</a><a href="#categorias">Categorías</a><a href="#ofertas">Ofertas</a></div></div><div><h3 className="font-bold">Contacto</h3><div className="mt-4 flex flex-col gap-2 text-sm text-blue-100/65"><span>Av. Ricardo Gutiérrez Km 5 – Oficina 1</span><span>Rawson 1405</span><span>Coordiná por WhatsApp</span></div></div><div><h3 className="font-bold">Seguinos</h3><div className="mt-4 flex gap-2"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><MessageCircle /></span><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><MessageCircle /></span></div></div></div><div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-5 text-xs text-blue-100/45 lg:px-8">© 2026 Market Mutual. Todos los derechos reservados.</div></footer>

      {cartOpen && <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-[#061a30]/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito" /><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white p-5 shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 pb-5"><div><p className="text-xs font-bold uppercase tracking-widest text-[#2581d2]">Tu pedido</p><h2 className="mt-1 text-xl font-bold text-[#12355f]">Carrito <span className="text-slate-400">({cartCount})</span></h2></div><Button variant="ghost" size="icon" onClick={() => setCartOpen(false)} aria-label="Cerrar carrito"><X /></Button></div><div className="flex-1 overflow-y-auto py-5">{cartItems.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><span className="flex size-16 items-center justify-center rounded-2xl bg-[#e7f2fc] text-[#1456a0]"><ShoppingBag /></span><h3 className="mt-4 font-bold text-[#12355f]">Tu carrito está vacío</h3><p className="mt-1 text-sm text-slate-500">Sumá productos para armar tu pedido.</p></div> : <div className="flex flex-col gap-4">{cartItems.map((product) => <div key={product.id} className="flex gap-3"><img src={product.image} alt="" className="size-16 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#16385f]">{product.name}</p><p className="mt-1 text-sm font-semibold text-[#1456a0]">{money(product.price)}</p><div className="mt-2 flex items-center gap-2"><button onClick={() => updateCart(product.id, -1)} className="flex size-7 items-center justify-center rounded-md bg-slate-100" aria-label="Disminuir cantidad"><Minus className="size-3" /></button><span className="w-4 text-center text-sm font-bold">{cart[product.id]}</span><button onClick={() => updateCart(product.id, 1)} className="flex size-7 items-center justify-center rounded-md bg-slate-100" aria-label="Aumentar cantidad"><Plus className="size-3" /></button></div></div><p className="text-sm font-bold text-[#12355f]">{money(product.price * cart[product.id])}</p></div>)}</div>}</div>{cartItems.length > 0 && <div className="border-t border-slate-200 pt-5"><div className="flex items-center justify-between text-sm text-slate-500"><span>Total estimado</span><span className="text-2xl font-bold text-[#12355f]">{money(total)}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">El precio final y los beneficios se confirmarán al procesar tu pedido.</p><Button className="mt-5 w-full rounded-xl bg-[#1456a0] py-6 hover:bg-[#0d4381]">Continuar pedido <ArrowRight data-icon="inline-end" /></Button></div>}</aside></div>}
    </main>
  )
}
