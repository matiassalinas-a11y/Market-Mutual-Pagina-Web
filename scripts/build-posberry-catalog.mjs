import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { readSheet } from 'read-excel-file/node'

const [catalogPath, stockPath, requestedOutput] = process.argv.slice(2)

if (!catalogPath || !stockPath) {
  throw new Error('Uso: node scripts/build-posberry-catalog.mjs <productos.xlsx> <stock.xlsx> [salida.json]')
}

const outputPath = requestedOutput || path.resolve('public/data/catalog-posberry.json')
const catalogRows = await readSheet(catalogPath)
const stockRows = await readSheet(stockPath)

const [catalogHeaders, ...catalogData] = catalogRows
const [stockHeaders, ...stockData] = stockRows

const catalogColumns = Object.fromEntries(catalogHeaders.map((header, index) => [String(header ?? '').trim(), index]))
const stockColumns = Object.fromEntries(stockHeaders.map((header, index) => [String(header ?? '').trim(), index]))

const requiredCatalogHeaders = ['*Codigo', '*Descripcion', 'Familia', '*Precio de Venta', 'Activo', 'URL de la imagen']
const requiredStockHeaders = ['Código', 'Nombre', 'Stock']

for (const header of requiredCatalogHeaders) {
  if (catalogColumns[header] == null) throw new Error(`Falta la columna ${header} en el catálogo.`)
}
for (const header of requiredStockHeaders) {
  if (stockColumns[header] == null) throw new Error(`Falta la columna ${header} en el archivo de stock.`)
}

const asCode = (value) => String(value ?? '').trim()
const asText = (value) => String(value ?? '').trim()
const asNumber = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null
const normalizeCategory = (value) => {
  const category = asText(value) || 'Sin categoría'
  const known = new Map([
    ['arroz, legumbres y pastas', 'Arroz, legumbres y pastas'],
    ['Panaderia', 'Panadería'],
    ['Harinas y reposteria', 'Harinas y repostería'],
  ])
  return known.get(category) ?? category
}
const safeImage = (value) => {
  const image = asText(value)
  if (!image) return undefined
  try {
    const url = new URL(image)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

const groupByCode = (rows, codeIndex) => {
  const groups = new Map()
  rows.forEach((row, index) => {
    const code = asCode(row[codeIndex])
    if (!groups.has(code)) groups.set(code, [])
    groups.get(code).push({ row, sourceRow: index + 2 })
  })
  return groups
}

const catalogByCode = groupByCode(catalogData, catalogColumns['*Codigo'])
const stockByCode = groupByCode(stockData, stockColumns['Código'])
const products = []
const exclusions = {
  zeroStock: 0,
  negativeStock: 0,
  unknownStock: 0,
  missingCatalogMatch: 0,
  duplicateCode: 0,
  invalidPrice: 0,
  inactive: 0,
}

for (const [code, stockMatches] of stockByCode) {
  const stockValues = stockMatches.map(({ row }) => asNumber(row[stockColumns.Stock]))
  if (!code || stockValues.some((stock) => stock == null)) {
    exclusions.unknownStock += 1
    continue
  }
  if (stockMatches.length !== 1 || (catalogByCode.get(code)?.length ?? 0) > 1) {
    exclusions.duplicateCode += 1
    continue
  }
  const stock = stockValues[0]
  if (stock === 0) {
    exclusions.zeroStock += 1
    continue
  }
  if (stock < 0) {
    exclusions.negativeStock += 1
    continue
  }

  const catalogMatch = catalogByCode.get(code)?.[0]
  if (!catalogMatch) {
    exclusions.missingCatalogMatch += 1
    continue
  }
  const row = catalogMatch.row
  if (asText(row[catalogColumns.Activo]).toUpperCase() !== 'S') {
    exclusions.inactive += 1
    continue
  }
  const price = asNumber(row[catalogColumns['*Precio de Venta']])
  if (price == null || price <= 0) {
    exclusions.invalidPrice += 1
    continue
  }

  const name = asText(row[catalogColumns['*Descripcion']])
  const category = normalizeCategory(row[catalogColumns.Familia])
  const barcode = asText(row[catalogColumns['Codigo de Barras']]) || undefined
  const image = safeImage(row[catalogColumns['URL de la imagen']])
  const categoryReview = ['Sin categoría', 'Otros / revisar', 'REVISAR PRECIOS'].includes(category)

  products.push({
    id: `sku:${code.toLowerCase()}`,
    sku: code,
    barcode,
    name,
    category,
    price,
    stock,
    image,
    available: true,
    demo: false,
    sourceRow: catalogMatch.sourceRow,
    categoryReview,
    imageSource: image ? 'posberry' : undefined,
  })
}

products.sort((left, right) => left.category.localeCompare(right.category, 'es') || left.name.localeCompare(right.name, 'es'))

const categories = new Map()
for (const product of products) categories.set(product.category, (categories.get(product.category) ?? 0) + 1)

const stockTimestamp = path.basename(stockPath).match(/stock_(\d{2})_(\d{2})_(\d{4})_(\d{2})_(\d{2})_(\d{2})/)?.slice(1)
const catalogVersion = stockTimestamp
  ? `posberry-${stockTimestamp[2]}-${stockTimestamp[0]}-${stockTimestamp[1]}T${stockTimestamp[3]}:${stockTimestamp[4]}:${stockTimestamp[5]}`
  : `posberry-${path.basename(stockPath)}`

const payload = {
  schemaVersion: 1,
  catalogVersion,
  generatedAt: new Date().toISOString(),
  sourceFiles: [path.basename(catalogPath), path.basename(stockPath)],
  summary: {
    catalogRows: catalogData.length,
    stockRows: stockData.length,
    positiveStockCodes: products.length + exclusions.invalidPrice + exclusions.inactive + exclusions.missingCatalogMatch,
    incorporated: products.length,
    excluded: Object.values(exclusions).reduce((sum, count) => sum + count, 0),
    exclusions,
    categoryCount: categories.size,
    withSourceImage: products.filter((product) => product.image).length,
    withoutImage: products.filter((product) => !product.image).length,
    categoryReview: products.filter((product) => product.categoryReview).length,
  },
  products,
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, 'utf8')
console.log(JSON.stringify({ outputPath, ...payload.summary }, null, 2))
