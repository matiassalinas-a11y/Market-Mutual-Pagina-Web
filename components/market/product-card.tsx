'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'
import type { Product } from '@/lib/market-data'

type ProductCardProps = {
  product: Product
  onAdd: (product: Product) => void
  variant?: 'default' | 'offer'
}

export function ProductCard({ product, onAdd, variant = 'default' }: ProductCardProps) {
  const isOffer = variant === 'offer'

  return (
    <article className={`group rounded-2xl border bg-white p-2.5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-3 ${isOffer ? 'border-[#2581d2]/30 ring-1 ring-[#2581d2]/10' : 'border-slate-200'}`}>
      <div className="relative overflow-hidden rounded-xl bg-[#f3f6f9]">
        <Image src={product.image} alt={product.name} width={700} height={700} sizes="(max-width: 640px) 50vw, 25vw" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
        {product.discount && <span className="absolute left-2 top-2 rounded-md bg-[#ee6b4d] px-2 py-1 text-[10px] font-bold text-white">{product.discount}</span>}
      </div>
      <div className="px-1 pb-1 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{product.category}</p>
        <h3 className="mt-1 min-h-10 text-sm font-bold leading-5 text-[#16385f]">{product.name}</h3>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div><p className="text-lg font-bold text-[#12355f]">{formatMoney(product.price)}</p>{product.oldPrice && <p className="text-xs text-slate-400 line-through">{formatMoney(product.oldPrice)}</p>}</div>
          <Button onClick={() => onAdd(product)} disabled={!product.available} size="sm" className="size-9 rounded-lg bg-[#e7f2fc] p-0 text-[#1456a0] hover:bg-[#1456a0] hover:text-white" aria-label={`Agregar ${product.name}`}><Plus /></Button>
        </div>
        <p className={`mt-3 flex items-center gap-1.5 text-[11px] font-medium ${product.available ? 'text-[#2e8b5b]' : 'text-slate-400'}`}><span className={`size-1.5 rounded-full ${product.available ? 'bg-[#2e9b69]' : 'bg-slate-300'}`} /> {product.available ? 'Disponible' : 'Sin stock'}</p>
      </div>
    </article>
  )
}
