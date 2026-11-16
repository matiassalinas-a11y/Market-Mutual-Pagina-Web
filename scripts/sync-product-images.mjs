import path from 'node:path'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { readSheet } from 'read-excel-file/node'

const cliArgs = process.argv.slice(2)
const option = (name, fallback) => {
  const index = cliArgs.indexOf(name)
  return index >= 0 && cliArgs[index + 1] ? path.resolve(cliArgs[index + 1]) : path.resolve(fallback)
}

const imagesDir = option('--images', 'imagenes')
const excelPath = option('--catalog', 'catalogo_final.xlsx')
const webCatalogPath = option('--web-catalog', 'public/data/catalog-posberry.json')
const outputDir = option('--output-dir', 'public/products')
const manifestPath = option('--manifest', 'public/data/product-image-local.json')
const reportPath = option('--report', 'public/data/product-image-sync-report.json')

const normalizeIdentifier = (value) => {
  if (value == null) return ''
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) return ''
    return String(value)
  }
  return String(value).trim()
}

const normalizeHeader = (value) => String(value ?? '').trim().toLowerCase()
const addToMap = (map, key, value) => {
  if (!key) return
  const values = map.get(key) ?? []
  values.push(value)
  map.set(key, values)
}

const sha256 = async (filePath) => createHash('sha256').update(await readFile(filePath)).digest('hex')

const copyIfChanged = async (source, destination) => {
  try {
    if ((await sha256(source)) === (await sha256(destination))) return 'unchanged'
  } catch {
    // El destino todavía no existe o no se puede leer; se copiará debajo.
  }
  await copyFile(source, destination)
  return 'copied'
}

const sourceStats = await stat(imagesDir)
if (!sourceStats.isDirectory()) throw new Error(`La ruta de imágenes no es una carpeta: ${imagesDir}`)

const excelRows = await readSheet(excelPath)
const [excelHeaders, ...excelData] = excelRows
const excelColumns = Object.fromEntries(excelHeaders.map((header, index) => [normalizeHeader(header), index]))
const codeColumn = excelColumns.codigo_interno
const eanColumn = excelColumns.ean
if (codeColumn == null || eanColumn == null) {
  throw new Error('El Excel debe contener las columnas codigo_interno y ean.')
}

const webCatalog = JSON.parse(await readFile(webCatalogPath, 'utf8'))
if (!Array.isArray(webCatalog.products)) throw new Error('El catálogo web no contiene un arreglo products.')

const excelByEan = new Map()
for (let index = 0; index < excelData.length; index += 1) {
  const row = excelData[index]
  const ean = normalizeIdentifier(row[eanColumn])
  const internalCode = normalizeIdentifier(row[codeColumn])
  if (!ean) continue
  if (!/^\d+$/.test(ean)) continue
  addToMap(excelByEan, ean, { internalCode, sourceRow: index + 2 })
}

const webByBarcode = new Map()
const webBySku = new Map()
for (const product of webCatalog.products) {
  addToMap(webByBarcode, normalizeIdentifier(product.barcode), product)
  addToMap(webBySku, normalizeIdentifier(product.sku), product)
}

const imageFiles = (await readdir(imagesDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.webp'))
  .sort((left, right) => left.name.localeCompare(right.name, 'en'))

await mkdir(outputDir, { recursive: true })
await mkdir(path.dirname(manifestPath), { recursive: true })
await mkdir(path.dirname(reportPath), { recursive: true })

const associations = []
const ambiguous = []
const unmatched = []
const linkedProductIds = new Set()
let copied = 0
let unchanged = 0

for (const entry of imageFiles) {
  const ean = path.basename(entry.name, path.extname(entry.name))
  if (!/^\d+$/.test(ean)) {
    unmatched.push({ ean, file: entry.name, reason: 'El nombre del archivo no es un EAN numérico.' })
    continue
  }

  let matches = webByBarcode.get(ean) ?? []
  let method = 'ean-catalog'

  if (matches.length === 0) {
    const bridgeRows = excelByEan.get(ean) ?? []
    const internalCodes = [...new Set(bridgeRows.map((row) => row.internalCode).filter(Boolean))]
    if (internalCodes.length > 1) {
      ambiguous.push({ ean, file: entry.name, reason: 'El EAN corresponde a más de un código interno en el Excel.', internalCodes })
      continue
    }
    if (internalCodes.length === 0) {
      unmatched.push({ ean, file: entry.name, reason: 'El EAN no aparece en el Excel ni en el catálogo web.' })
      continue
    }
    matches = webBySku.get(internalCodes[0]) ?? []
    method = 'excel-bridge'
  }

  if (matches.length !== 1) {
    const reason = matches.length > 1
      ? 'El cruce exacto devuelve más de un producto web.'
      : 'El código interno del Excel no existe en el catálogo web.'
    const record = { ean, file: entry.name, reason, productIds: matches.map((product) => product.id) }
    if (matches.length > 1) ambiguous.push(record)
    else unmatched.push(record)
    continue
  }

  const product = matches[0]
  if (linkedProductIds.has(product.id)) {
    ambiguous.push({ ean, file: entry.name, reason: 'Otro EAN ya fue vinculado al mismo producto web.', productId: product.id })
    continue
  }

  const source = path.join(imagesDir, entry.name)
  const destination = path.join(outputDir, `${ean}.webp`)
  const copyResult = await copyIfChanged(source, destination)
  if (copyResult === 'copied') copied += 1
  else unchanged += 1

  linkedProductIds.add(product.id)
  associations.push({
    productId: product.id,
    sku: normalizeIdentifier(product.sku) || undefined,
    barcode: ean,
    imageUrl: `/products/${ean}.webp`,
    method,
  })
}

associations.sort((left, right) => left.productId.localeCompare(right.productId, 'en'))
const generatedAt = new Date().toISOString()
const manifest = {
  schemaVersion: 1,
  generatedAt,
  sourceCatalog: path.basename(excelPath),
  associations,
}
const report = {
  generatedAt,
  sourceImages: imageFiles.length,
  totalWebProducts: webCatalog.products.length,
  linkedProducts: associations.length,
  productsWithoutLocalImage: webCatalog.products.length - associations.length,
  copied,
  unchanged,
  ambiguousCount: ambiguous.length,
  unmatchedCount: unmatched.length,
  ambiguous,
  unmatched,
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log(JSON.stringify({ manifestPath, reportPath, ...report }, null, 2))
