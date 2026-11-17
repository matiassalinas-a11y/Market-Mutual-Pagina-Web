'use client'

import type { CatalogCategory } from '@/components/market/catalog-store'

type CategorySectionProps = {
  categories: CatalogCategory[]
  selected: string
  onSelect: (name: string) => void
}

const visuals: [RegExp, string, string][] = [
  [/todos/i, '🛒', 'bg-[#f8ece3]'],
  [/desayuno|infus/i, '☕', 'bg-[#f6eadc]'],
  [/golosina|chocolate/i, '🍬', 'bg-[#fce8ef]'],
  [/sin alcohol/i, '🥤', 'bg-[#e6f2fc]'],
  [/alcohol/i, '🍷', 'bg-[#f5e6ed]'],
  [/fruta|verdura/i, '🥦', 'bg-[#e7f4e5]'],
  [/lácteo/i, '🥛', 'bg-[#e8f2fa]'],
  [/galletita/i, '🍪', 'bg-[#f8eddf]'],
  [/snack/i, '🍿', 'bg-[#fff5da]'],
  [/arroz|pasta/i, '🍝', 'bg-[#fff0dc]'],
  [/limpieza/i, '🧽', 'bg-[#e4f3ee]'],
  [/higiene|cuidado/i, '🧴', 'bg-[#f4eafa]'],
  [/panadería|harina/i, '🥖', 'bg-[#fbefdd]'],
  [/carnicería/i, '🥩', 'bg-[#fbe8e5]'],
  [/fiambrería/i, '🧀', 'bg-[#fff4db]'],
  [/congelado/i, '🧊', 'bg-[#e6f3fa]'],
  [/aceite|aderezo/i, '🫒', 'bg-[#eef3de]'],
  [/condimento|caldo/i, '🧂', 'bg-[#f5eee5]'],
  [/electro/i, '🔌', 'bg-[#eaeafa]'],
  [/bazar/i, '🍽️', 'bg-[#e9f0f4]'],
  [/conserva/i, '🥫', 'bg-[#f8eae0]'],
  [/almacén/i, '🛍️', 'bg-[#f4eddf]'],
]

const labels: Record<string, string> = {
  'Desayuno e infusiones': 'Desayuno', 'Golosinas y chocolates': 'Golosinas',
  'Bebidas sin alcohol': 'Bebidas', 'Higiene y cuidado personal': 'Cuidado personal',
  'Limpieza del hogar': 'Limpieza', 'Galletitas dulces y saladas': 'Galletitas',
  'Arroz, legumbres y pastas': 'Arroz y pastas', 'Aceite, aderezos y vinagres': 'Aceites y aderezos',
}

export function CategorySection({ categories, selected, onSelect }: CategorySectionProps) {
  return (
    <div id="categorias" className="scroll-mt-36">
      <div className="category-scroll flex gap-3 overflow-x-auto px-1 pb-4 pt-1 sm:gap-5" role="group" aria-label="Filtrar por categoría">
        {[{ name: 'Todos', count: 0 }, ...categories].map(category => {
          const [, illustration, background] = visuals.find(([pattern]) => pattern.test(category.name)) ?? [null, '🛍️', 'bg-[#edf1f6]']
          const active = selected === category.name
          return (
            <button key={category.name} type="button" aria-pressed={active} onClick={() => onSelect(category.name)} className="group flex w-20 shrink-0 flex-col items-center gap-2 rounded-xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#1456a0] sm:w-24">
              <span className={`flex size-[68px] items-center justify-center rounded-[20px] text-[34px] transition-colors sm:size-20 sm:text-[40px] ${background} ${active ? 'ring-2 ring-[#1456a0] ring-offset-2' : 'ring-1 ring-black/5 group-hover:ring-[#1456a0]/50'}`} aria-hidden="true">{illustration}</span>
              <span className={`text-center text-xs leading-4 ${active ? 'font-extrabold text-[#1456a0]' : 'font-semibold text-[#334b65]'}`}>{labels[category.name] ?? category.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
