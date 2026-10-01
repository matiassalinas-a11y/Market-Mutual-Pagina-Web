'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, MapPin } from 'lucide-react'
import {
  NEIGHBORHOODS,
  OTHER_NEIGHBORHOOD,
} from '@/lib/delivery-neighborhoods'
import type { Neighborhood } from '@/lib/delivery-neighborhoods'

type NeighborhoodComboboxProps = {
  value: string
  onChange: (value: string) => void
  hasError?: boolean
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .trim()
}

export function NeighborhoodCombobox({
  value,
  onChange,
  hasError = false,
}: NeighborhoodComboboxProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const filteredNeighborhoods = useMemo(() => {
    const normalizedQuery = normalizeSearch(query)
    if (!normalizedQuery) return NEIGHBORHOODS
    return NEIGHBORHOODS.filter((neighborhood) =>
      normalizeSearch(neighborhood.name).includes(normalizedQuery),
    )
  }, [query])

  const optionsCount = filteredNeighborhoods.length + 1

  const selectOption = (name: string) => {
    setQuery(name)
    setActiveIndex(0)
    onChange(name)
    setOpen(false)
  }

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery)
    setActiveIndex(0)
    setOpen(true)
    onChange('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current + 1) % optionsCount)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current - 1 + optionsCount) % optionsCount)
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      const neighborhood = filteredNeighborhoods[activeIndex]
      selectOption(neighborhood?.name ?? OTHER_NEIGHBORHOOD)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const renderNeighborhood = (neighborhood: Neighborhood, index: number) => (
    <button
      id={`neighborhood-option-${index}`}
      key={neighborhood.name}
      type="button"
      role="option"
      aria-selected={value === neighborhood.name}
      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
        activeIndex === index ? 'bg-[#e7f2fc]' : 'hover:bg-slate-50'
      }`}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => selectOption(neighborhood.name)}
    >
      <MapPin className="size-4 shrink-0 text-[#2581d2]" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-[#16385f]">{neighborhood.name}</span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
        Zona {neighborhood.zone}
      </span>
      {value === neighborhood.name && <Check className="size-4 shrink-0 text-[#1456a0]" aria-hidden="true" />}
    </button>
  )

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <div className="relative">
        <input
          id="checkout-barrio"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={(event) => {
            setOpen(true)
            event.currentTarget.select()
          }}
          onKeyDown={handleKeyDown}
          className={`h-11 w-full rounded-xl border bg-white px-3 pr-10 text-sm text-[#16385f] outline-none transition focus:border-[#1456a0] focus:ring-2 focus:ring-[#1456a0]/25 ${
            hasError ? 'border-red-300' : 'border-slate-200'
          }`}
          placeholder="Escribí para buscar tu barrio"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="neighborhood-options"
          aria-activedescendant={open ? `neighborhood-option-${activeIndex}` : undefined}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      </div>

      {open && (
        <div
          id="neighborhood-options"
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {filteredNeighborhoods.length > 0 ? (
            filteredNeighborhoods.map(renderNeighborhood)
          ) : (
            <p className="px-3 py-2 text-xs text-slate-500">No encontramos coincidencias en la lista.</p>
          )}
          <div className="border-t border-slate-100 pt-1">
            <button
              id={`neighborhood-option-${filteredNeighborhoods.length}`}
              type="button"
              role="option"
              aria-selected={value === OTHER_NEIGHBORHOOD}
              className={`w-full px-3 py-2.5 text-left text-sm font-medium text-[#7a5900] transition ${
                activeIndex === filteredNeighborhoods.length ? 'bg-amber-50' : 'hover:bg-amber-50'
              }`}
              onMouseEnter={() => setActiveIndex(filteredNeighborhoods.length)}
              onClick={() => selectOption(OTHER_NEIGHBORHOOD)}
            >
              {OTHER_NEIGHBORHOOD}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
