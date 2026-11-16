import type { Product } from '@/lib/market-data'

export type ImportCell = string | number | boolean | Date | null
export type ImportField = 'sku' | 'barcode' | 'name' | 'category' | 'brand' | 'price' | 'stock' | 'description' | 'image'
export type ColumnMapping = Partial<Record<ImportField, number | null>>

export type ParsedCatalogFile = {
  fileName: string
  headers: string[]
  rows: ImportCell[][]
}

export type ImportRowResult = {
  sourceRow: number
  status: 'valid' | 'duplicate' | 'invalid'
  issues: string[]
  product: Product | null
  rawName: string
  rawSku: string
  rawBarcode: string
  rawPrice: string
}

export type CatalogImportResult = {
  products: Product[]
  rows: ImportRowResult[]
  validCount: number
  duplicateCount: number
  invalidCount: number
  warningCount: number
}

export const IMPORT_FIELD_OPTIONS: Array<{ field: ImportField; label: string; required?: boolean }> = [
  { field: 'sku', label: 'SKU o código' },
  { field: 'barcode', label: 'Código de barras' },
  { field: 'name', label: 'Nombre del producto', required: true },
  { field: 'category', label: 'Categoría o familia' },
  { field: 'brand', label: 'Marca' },
  { field: 'price', label: 'Precio', required: true },
  { field: 'stock', label: 'Stock' },
  { field: 'description', label: 'Descripción adicional' },
  { field: 'image', label: 'URL de imagen' },
]

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\*+/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function cellText(value: ImportCell | undefined): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value).trim()
}

function uniqueHeaders(row: ImportCell[]): string[] {
  const used = new Map<string, number>()
  return row.map((cell, index) => {
    const base = cellText(cell) || `Columna ${index + 1}`
    const count = (used.get(base) ?? 0) + 1
    used.set(base, count)
    return count === 1 ? base : `${base} (${count})`
  })
}

function delimiterScore(line: string, delimiter: string): number {
  let count = 0
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') index += 1
      else quoted = !quoted
    } else if (!quoted && character === delimiter) {
      count += 1
    }
  }
  return count
}

function parseCsv(text: string): string[][] {
  const firstLines = text.split(/\r?\n/).filter(Boolean).slice(0, 5)
  const delimiters = [';', ',', '\t']
  const delimiter = delimiters
    .map((candidate) => ({ candidate, score: firstLines.reduce((sum, line) => sum + delimiterScore(line, candidate), 0) }))
    .sort((a, b) => b.score - a.score)[0]?.candidate ?? ';'

  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (!quoted && character === delimiter) {
      row.push(value.trim())
      value = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(value.trim())
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
      value = ''
    } else {
      value += character
    }
  }
  row.push(value.trim())
  if (row.some((cell) => cell !== '')) rows.push(row)
  return rows
}

function decodeCsv(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  if (!utf8.includes('\uFFFD')) return utf8.replace(/^\uFEFF/, '')
  return new TextDecoder('windows-1252').decode(buffer).replace(/^\uFEFF/, '')
}

export async function parseCatalogFile(file: File): Promise<ParsedCatalogFile> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  let data: ImportCell[][]

  if (extension === 'xlsx') {
    const { readSheet } = await import('read-excel-file/browser')
    data = (await readSheet(file)) as ImportCell[][]
  } else if (extension === 'csv') {
    data = parseCsv(decodeCsv(await file.arrayBuffer()))
  } else {
    throw new Error('Formato no compatible. Seleccioná un archivo .xlsx o .csv.')
  }

  const headerIndex = data.findIndex((row) => row.some((cell) => cellText(cell) !== ''))
  if (headerIndex < 0) throw new Error('El archivo no contiene filas para importar.')
  const headers = uniqueHeaders(data[headerIndex])
  const rows = data.slice(headerIndex + 1).filter((row) => row.some((cell) => cellText(cell) !== ''))
  if (rows.length === 0) throw new Error('El archivo contiene encabezados, pero no productos.')
  return { fileName: file.name, headers, rows }
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader)
  const exact = (...aliases: string[]) => {
    const wanted = aliases.map(normalizeHeader)
    const index = normalized.findIndex((header) => wanted.includes(header))
    return index >= 0 ? index : null
  }

  return {
    sku: exact('codigo', 'codigo de producto', 'sku'),
    barcode: exact('codigo de barras', 'ean', 'gtin'),
    name: exact('descripcion', 'nombre', 'nombre del producto', 'producto'),
    category: exact('familia', 'categoria', 'rubro'),
    brand: exact('marca'),
    price: exact('precio de venta', 'precio', 'precio venta'),
    stock: exact('stock', 'existencia', 'existencias', 'stock actual'),
    description: exact('descripcion web', 'detalle', 'descripcion adicional'),
    image: exact('url de la imagen', 'url imagen', 'imagen', 'foto'),
  }
}

export function parseLocalizedNumber(value: ImportCell | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const original = cellText(value)
  if (!original) return null
  let cleaned = original.replace(/[$\s\u00A0]/g, '').replace(/[^0-9,.-]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') return null

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    else cleaned = cleaned.replace(/,/g, '')
  } else if (lastComma >= 0) {
    const decimals = cleaned.length - lastComma - 1
    cleaned = decimals > 0 && decimals <= 2 ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '')
  } else if (lastDot >= 0) {
    const dotCount = (cleaned.match(/\./g) ?? []).length
    const decimals = cleaned.length - lastDot - 1
    if (dotCount > 1 || decimals === 3) cleaned = cleaned.replace(/\./g, '')
  }

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function safeImageUrl(value: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function stableProductId(sku: string, barcode: string, rowNumber: number, name: string): string {
  if (sku) return `sku:${sku.toLowerCase()}`
  if (barcode) return `barcode:${barcode.toLowerCase()}`
  const slug = normalizeHeader(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  return `row:${rowNumber}:${slug || 'producto'}`
}

export function validateCatalogRows(rows: ImportCell[][], mapping: ColumnMapping): CatalogImportResult {
  const seenIdentifiers = new Set<string>()
  const products: Product[] = []
  const rowResults: ImportRowResult[] = []

  rows.forEach((row, rowIndex) => {
    const sourceRow = rowIndex + 2
    const read = (field: ImportField) => {
      const index = mapping[field]
      return index == null ? undefined : row[index]
    }
    const name = cellText(read('name'))
    const sku = cellText(read('sku'))
    const barcode = cellText(read('barcode'))
    const rawPrice = cellText(read('price'))
    const price = parseLocalizedNumber(read('price'))
    const category = cellText(read('category')) || 'Sin categoría'
    const brand = cellText(read('brand')) || undefined
    const description = cellText(read('description')) || undefined
    const rawStock = read('stock')
    const parsedStock = rawStock == null || cellText(rawStock) === '' ? null : parseLocalizedNumber(rawStock)
    const stock = parsedStock == null ? null : Math.max(0, Math.floor(parsedStock))
    const rawImage = cellText(read('image'))
    const image = safeImageUrl(rawImage)
    const issues: string[] = []

    if (!name) issues.push('Falta el nombre del producto.')
    if (price == null || price <= 0) issues.push('El precio no es válido o es igual a cero.')
    if (rawStock != null && cellText(rawStock) !== '' && parsedStock == null) issues.push('Stock no interpretable; se importará como no informado.')
    if (rawImage && !image) issues.push('La URL de imagen no es válida; se usará el reemplazo visual.')

    const identifiers = [sku && `sku:${sku.toLowerCase()}`, barcode && `barcode:${barcode.toLowerCase()}`].filter(Boolean) as string[]
    const duplicate = identifiers.some((identifier) => seenIdentifiers.has(identifier))
    identifiers.forEach((identifier) => seenIdentifiers.add(identifier))

    let status: ImportRowResult['status'] = 'valid'
    let product: Product | null = null
    if (!name || price == null || price <= 0) status = 'invalid'
    else if (duplicate) {
      status = 'duplicate'
      issues.push('Código o código de barras duplicado dentro del archivo.')
    } else {
      product = {
        id: stableProductId(sku, barcode, sourceRow, name),
        sku: sku || undefined,
        barcode: barcode || undefined,
        name,
        category,
        brand,
        price,
        stock,
        description,
        image,
        available: stock != null && stock > 0,
        demo: false,
        sourceRow,
      }
      products.push(product)
    }

    rowResults.push({ sourceRow, status, issues, product, rawName: name, rawSku: sku, rawBarcode: barcode, rawPrice })
  })

  return {
    products,
    rows: rowResults,
    validCount: rowResults.filter((row) => row.status === 'valid').length,
    duplicateCount: rowResults.filter((row) => row.status === 'duplicate').length,
    invalidCount: rowResults.filter((row) => row.status === 'invalid').length,
    warningCount: rowResults.filter((row) => row.status === 'valid' && row.issues.length > 0).length,
  }
}

function csvCell(value: string | number): string {
  const text = String(value).replace(/"/g, '""')
  return `"${text}"`
}

export function buildImportReportCsv(result: CatalogImportResult): string {
  const header = ['Fila', 'Estado', 'Problemas', 'SKU', 'Código de barras', 'Nombre', 'Precio']
  const rows = result.rows.map((row) => [
    row.sourceRow,
    row.status,
    row.issues.join(' | '),
    row.rawSku,
    row.rawBarcode,
    row.rawName,
    row.rawPrice,
  ])
  return `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')}`
}
