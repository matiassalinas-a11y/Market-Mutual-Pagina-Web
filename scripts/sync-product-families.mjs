import path from 'node:path'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { deepStrictEqual } from 'node:assert'
import { readSheet } from 'read-excel-file/node'

const [sourcePath, catalogPath = 'public/data/catalog-posberry.json', reportPath = 'docs/product-family-sync-report.json'] = process.argv.slice(2)
if (!sourcePath) throw new Error('Uso: node scripts/sync-product-families.mjs <familias.xlsx> [catalogo.json] [informe.json]')
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const familyNames = [
  'Bazar', 'Electrodomésticos', 'Golosinas y chocolates', 'Lácteos', 'Carnicería',
  'Harinas y repostería', 'Limpieza del hogar', 'Conservas y enlatados',
  'Caldos, condimentos y especias', 'Arroz, legumbres y pastas',
  'Aceites, aderezos y vinagres', 'Desayuno e infusiones', 'Galletitas dulces y saladas',
  'Snacks', 'Bebidas con alcohol', 'Bebidas sin alcohol', 'Congelados',
  'Frutería y verdulería', 'Fiambrería', 'Higiene y cuidado personal', 'Papeles',
  'Panadería', 'Almacén', 'Tecnología e informática', 'Mascotas', 'Cigarrillos y tabaco', 'Bebés',
]
const families = new Map(familyNames.map(name => [normalize(name), name]))
families.set('aceiteaderezosyvinagres', 'Aceites, aderezos y vinagres')
families.set('snack', 'Snacks')
function familyName(value) {
  const name = families.get(normalize(value))
  if (!name) throw new Error(`Familia no reconocida: ${value}`)
  return name
}

const [sourceBytes, catalogBytes, overrideBytes] = await Promise.all([
  readFile(sourcePath), readFile(catalogPath), readFile(new URL('./product-family-overrides.json', import.meta.url)),
])
const fingerprint = createHash('sha256').update(sourceBytes).update(overrideBytes).digest('hex')
const catalog = JSON.parse(catalogBytes)
const overrides = new Map(JSON.parse(overrideBytes).map(item => [item.sku, item]))
const [headers, ...rows] = await readSheet(sourcePath)
const column = header => {
  const index = headers.findIndex(value => normalize(value) === normalize(header))
  if (index < 0) throw new Error(`Falta la columna ${header}`)
  return index
}
const codeColumn = column('Código'), nameColumn = column('Nombre'), familyColumn = column('Familia')
const byCode = new Map(), byName = new Map()
for (const [index, row] of rows.entries()) {
  const code = String(row[codeColumn] ?? '').trim(), name = String(row[nameColumn] ?? '').trim()
  if (!code || !name) continue
  const record = { code, name, family: familyName(row[familyColumn]), sourceRow: index + 2 }
  if (!byCode.has(code)) byCode.set(code, [])
  byCode.get(code).push(record)
  const key = normalize(name)
  if (!byName.has(key)) byName.set(key, [])
  byName.get(key).push(record)
}

const assignments = [], unresolved = []
const products = catalog.products.map(product => {
  const candidates = byCode.get(product.sku) ?? []
  const exactName = candidates.filter(row => normalize(row.name) === normalize(product.name))
  const matches = exactName.length ? exactName : candidates.length ? candidates : byName.get(normalize(product.name)) ?? []
  const distinct = [...new Set(matches.map(row => row.family))]
  if (distinct.length > 1) throw new Error(`Familias contradictorias para ${product.sku}: ${distinct.join(', ')}`)
  const override = overrides.get(product.sku)
  if (override && normalize(override.name) !== normalize(product.name)) throw new Error(`El código ${product.sku} ahora corresponde a otro producto; revisar la propuesta por tipo.`)
  const family = override ? familyName(override.family) : distinct[0]
  if (!family) { unresolved.push({ sku: product.sku, name: product.name }); return product }
  assignments.push({
    sku: product.sku, name: product.name, previousCategory: product.category, category: family,
    method: override ? 'product-type' : candidates.length ? 'code' : 'exact-name',
    sourceFamily: distinct[0] ?? null, sourceRows: matches.map(row => row.sourceRow),
    ...(override ? { reason: override.reason } : {}),
  })
  return { ...product, category: family, categoryReview: false }
})
if (unresolved.length) throw new Error(`Productos sin clasificar: ${JSON.stringify(unresolved)}`)
// No se lee Stock del Excel. Todo dato comercial y toda asociación de imagen deben permanecer idénticos.
const inventory = items => items.map(product => {
  const commercialData = { ...product }
  delete commercialData.category
  delete commercialData.categoryReview
  return commercialData
})
deepStrictEqual(inventory(products), inventory(catalog.products))
const counts = new Map()
products.forEach(product => counts.set(product.category, (counts.get(product.category) ?? 0) + 1))
const summary = {
  products: products.length, sourceRows: rows.length,
  matchedToSource: assignments.filter(item => item.sourceRows.length > 0).length,
  assignedByType: assignments.filter(item => item.method === 'product-type').length,
  missingFromSource: assignments.filter(item => !item.sourceRows.length).length,
  correctedSourceFamily: assignments.filter(item => item.sourceFamily && item.sourceFamily !== item.category).length,
  changedCategories: assignments.filter(item => item.previousCategory !== item.category).length,
  families: Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b, 'es'))),
  inventoryPreserved: true,
}
if (catalog.categoryMapping?.fingerprint === fingerprint) {
  console.log(JSON.stringify({ alreadyCurrent: true, ...summary }, null, 2))
} else {
  const baseCatalogVersion = catalog.categoryMapping?.baseCatalogVersion ?? catalog.catalogVersion
  catalog.stockAsOf ??= baseCatalogVersion.replace(/^posberry-/, '')
  catalog.catalogVersion = `${baseCatalogVersion}-families-${fingerprint.slice(0, 12)}`
  catalog.categoryMapping = { sourceFile: path.basename(sourcePath), fingerprint, baseCatalogVersion, ...summary }
  catalog.products = products
  catalog.summary.categoryCount = counts.size
  catalog.summary.categoryReview = 0
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(catalogPath, `${JSON.stringify(catalog)}\n`)
  await writeFile(reportPath, `${JSON.stringify({ sourceFile: path.basename(sourcePath), summary, assignments }, null, 2)}\n`)
  console.log(JSON.stringify(summary, null, 2))
}
