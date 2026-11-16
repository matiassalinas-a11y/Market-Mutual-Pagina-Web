'use client'

import { Apple, Candy, Coffee, Cookie, CupSoda, GlassWater, Home, Milk, Package, Sparkles, Wine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CatalogCategory } from '@/components/market/catalog-store'

type CategorySectionProps = {
  categories: CatalogCategory[]
  onSelect: (name: string) => void
}

export function CategorySection({ categories, onSelect }: CategorySectionProps) {
  const featured = categories.slice(0, 12)
  const iconFor = (name: string): LucideIcon => {
    const normalized = name.toLowerCase()
    if (normalized.includes('desayuno') || normalized.includes('infus')) return Coffee
    if (normalized.includes('golosina') || normalized.includes('chocolate')) return Candy
    if (normalized.includes('alcohol')) return Wine
    if (normalized.includes('bebida')) return CupSoda
    if (normalized.includes('limpieza')) return Home
    if (normalized.includes('higiene') || normalized.includes('cuidado')) return Sparkles
    if (normalized.includes('fruta') || normalized.includes('verdura')) return Apple
    if (normalized.includes('lácteo')) return Milk
    if (normalized.includes('galletita')) return Cookie
    if (normalized.includes('almacén')) return Package
    return GlassWater
  }
  const shortName = (name: string) => new Map([
    ['Desayuno e infusiones', 'Desayuno'],
    ['Golosinas y chocolates', 'Golosinas'],
    ['Bebidas sin alcohol', 'Bebidas'],
    ['Higiene y cuidado personal', 'Cuidado personal'],
    ['Limpieza del hogar', 'Limpieza'],
    ['Galletitas dulces y saladas', 'Galletitas'],
  ]).get(name) ?? name
  return (
    <section id="categorias" className="mx-auto max-w-7xl px-4 py-8 sm:py-10 lg:px-8">
      <div className="mb-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#2581d2]">Explorá</p>
        <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-[#102f53] sm:text-3xl">Comprá por categoría</h2>
      </div>
      <div className="hide-scrollbar flex snap-x gap-3 overflow-x-auto pb-3">
        {featured.map((category) => {
          const Icon = iconFor(category.name)
          return <button key={category.name} onClick={() => onSelect(category.name)} className="group min-w-[104px] snap-start rounded-[22px] border border-[#dceaf7] bg-white px-3 py-4 text-center shadow-[0_10px_25px_rgba(18,53,95,0.06)] transition hover:-translate-y-1 hover:border-[#9ecbed] hover:shadow-[0_14px_30px_rgba(18,53,95,0.12)] sm:min-w-[120px]">
            <span className="mx-auto flex size-14 items-center justify-center rounded-[18px] bg-[linear-gradient(145deg,#eaf5ff,#d8edfd)] text-[#1456a0] transition group-hover:bg-[#1456a0] group-hover:text-white"><Icon className="size-6" /></span>
            <span className="mt-3 block min-h-9 text-xs font-bold leading-4 text-[#173b64]">{shortName(category.name)}</span>
          </button>
        })}
      </div>
    </section>
  )
}
