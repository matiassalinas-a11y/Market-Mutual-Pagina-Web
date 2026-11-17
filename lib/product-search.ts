import type { Product } from './market-data'

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const words = (value: string) => normalize(value).match(/[a-z0-9]+/g) ?? []
const singular = (word: string) => word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word
const ignored = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'para', 'y'])

// General product families expand the query; shapes and brands remain specific.
const synonyms = [
  ['fideo', 'fideoeo', 'fid', 'pasta', 'paste', 'tallarines', 'tallarin', 'spaghetti', 'spaguetti', 'espagueti', 'tirabuzon', 'monito', 'mostacho', 'raviol', 'ravioles', 'sorrentino', 'lasagna', 'lasagno', 'lasana', 'codito', 'penne', 'dedalito', 'cabello', 'municion', 'municiones', 'mostachol', 'fusili', 'fusilli', 'giacomo', 'giaccomo'],
  ['galletita', 'galleta', 'cookie'],
  ['gaseosa', 'refresco', 'soda', 'cola', 'sprite', 'fanta', 'pepsi'],
  ['lavandina', 'cloro'],
  ['shampoo', 'champu'],
  ['acondicionador', 'enjuague'],
  ['detergente', 'lavavajilla'],
].map(group => group.map(singular))

function closeSpelling(a: string, b: string): boolean {
  // One insertion, omission or replacement; never approximate codes or short words.
  if (a.length < 5 || b.length < 5 || /\d/.test(a + b) || Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, differences = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++differences > 1) return false
    if (a.length >= b.length) i++
    if (b.length >= a.length) j++
  }
  return differences + (a.length - i) + (b.length - j) <= 1
}

export function matchesProductSearch(product: Product, query: string): boolean {
  const terms = words(query).filter(term => !ignored.has(term)).map(singular)
  if (!terms.length) return true
  const identity = words([product.name, product.brand].filter(Boolean).join(' ')).map(singular)
  const category = words(product.category).map(singular)
  const codes = [product.sku, product.barcode].filter((value): value is string => Boolean(value)).map(normalize)
  return terms.every(term => {
    if (/\d/.test(term)) return codes.some(code => code.includes(term)) || identity.includes(term)
    // Only broad family words expand to all shapes; "moñitos" still finds moñitos.
    const family = synonyms.find(group => group.slice(0, group[0] === 'fideo' ? 5 : 2).includes(term))
    const candidates = family ?? [term]
    const pastaFamily = family === synonyms[0]
    if (pastaFamily && /\b(accesorio|molde|moldes|dental|pastadental|mani|champu|shampoo|capilar)\b/.test(normalize(product.name))) return false
    return identity.some(word => candidates.some(candidate => word === candidate || (!family && candidate.length >= 3 && word.startsWith(candidate)) || closeSpelling(candidate, word)))
      || codes.some(code => code.includes(term))
      || (!pastaFamily && category.some(word => candidates.some(candidate => word === candidate || (candidate.length >= 3 && word.startsWith(candidate)))))
  })
}
