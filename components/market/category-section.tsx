'use client'

import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { categories } from '@/lib/market-data'

type CategorySectionProps = {
  onSelect: (name: string) => void
}

export function CategorySection({ onSelect }: CategorySectionProps) {
  return (
    <section id="categorias" className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
      <div className="mb-7 flex items-end justify-between">
        <div><p className="text-sm font-bold uppercase tracking-widest text-[#2581d2]">Explorá</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-[#102f53]">Comprá por categoría</h2></div>
        <a href="#productos" className="hidden items-center gap-1 text-sm font-bold text-[#1456a0] sm:flex">Ver todas <ArrowRight className="size-4" /></a>
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible">
        {categories.map((category) => (
          <button key={category.name} onClick={() => onSelect(category.name)} className="group relative min-w-[190px] snap-start overflow-hidden rounded-2xl bg-slate-200 text-left md:min-w-0">
            <Image src={category.image} alt={category.name} width={800} height={176} className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d2d55]/90 via-[#0d2d55]/15 to-transparent" />
            <div className="absolute inset-x-4 bottom-4"><p className="font-bold text-white">{category.name}</p><p className="mt-1 text-xs text-white/75">{category.description}</p></div>
          </button>
        ))}
      </div>
    </section>
  )
}