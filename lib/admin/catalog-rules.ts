import type { Product } from '../market-data'
import type { FeaturedFlyer } from '../featured-flyers'

export type CatalogSnapshot = {
  revision: number
  products: Product[]
  families: string[]
  flyers?: FeaturedFlyer[]
}
export type ProductDraft = Pick<
  Product,
  'name' | 'category' | 'price' | 'available'
> & {
  id?: string
  sku: string
  barcode?: string
  description?: string
  stock: number
  image?: string
  featured?: boolean
}
export type CatalogCommand =
  | { type: 'save'; product: ProductDraft }
  | { type: 'prices'; changes: { id: string; price: number }[] }
  | { type: 'flags'; id: string; available?: boolean; featured?: boolean }
  | { type: 'featured-order'; ids: string[] }
  | { type: 'flyers'; flyers: FeaturedFlyer[] }

export class CatalogError extends Error {
  constructor(
    message: string,
    public status = 400,
    public fields: Record<string, string> = {},
  ) {
    super(message)
  }
}

export const roundPrice = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100
export function parsePriceInput(value: string): number {
  let text = value.trim().replace(/^\$\s*/, '')
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(text))
    text = text.replace(/\./g, '')
  else if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) return NaN
  return Number(text.replace(',', '.'))
}
export function validPrice(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= 1e9 &&
    Math.abs(roundPrice(value) - value) < 0.000001
  )
}
export function pricePreview(
  products: Product[],
  ids: string[],
  percent: number,
) {
  if (!Number.isFinite(percent) || percent <= -100 || percent > 1000)
    throw new CatalogError(
      'Ingresá un porcentaje mayor a -100 y de hasta 1000.',
    )
  const selected = new Set(ids)
  return products
    .filter((p) => selected.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      before: p.price,
      price: roundPrice(p.price * (1 + percent / 100)),
    }))
}

export function applyCatalogCommand(
  snapshot: CatalogSnapshot,
  command: CatalogCommand,
  newId: string,
): CatalogSnapshot {
  if (!command || typeof command !== 'object')
    throw new CatalogError('La solicitud no es válida.')
  let products = snapshot.products.map((p) => ({ ...p }))
  if (command.type === 'flyers') {
    if (!Array.isArray(command.flyers) || command.flyers.length > 5)
      throw new CatalogError(
        'Podés cargar un máximo de 5 flyers destacados.',
        422,
      )
    const ids = new Set<string>()
    const allowedImages = new Set(
      (snapshot.flyers ?? [])
        .flatMap((f) => [f.image, f.mobileImage])
        .filter(Boolean),
    )
    const validImage = (image: unknown) =>
      typeof image === 'string' &&
      (allowedImages.has(image) ||
        /^\/api\/catalog\/images\/[a-f0-9-]{36}\.webp$/.test(image))
    const flyers = command.flyers.map((flyer) => {
      if (
        !flyer ||
        typeof flyer.id !== 'string' ||
        !flyer.id ||
        flyer.id.length > 80 ||
        ids.has(flyer.id)
      )
        throw new CatalogError(
          'Hay flyers repetidos o inválidos. Actualizá el listado.',
          422,
        )
      ids.add(flyer.id)
      if (
        typeof flyer.title !== 'string' ||
        !flyer.title.trim() ||
        flyer.title.length > 240 ||
        !validImage(flyer.image) ||
        (flyer.mobileImage && !validImage(flyer.mobileImage))
      )
        throw new CatalogError(
          'Cada flyer debe tener un nombre y una imagen válida.',
          422,
        )
      if (flyer.href && !['#productos', '#entregas'].includes(flyer.href))
        throw new CatalogError('Elegí un destino válido para el flyer.', 422)
      return {
        id: flyer.id,
        title: flyer.title.trim(),
        alt: flyer.title.trim(),
        image: flyer.image,
        ...(flyer.mobileImage ? { mobileImage: flyer.mobileImage } : {}),
        href: flyer.href || '#productos',
      }
    })
    return { ...snapshot, flyers, revision: snapshot.revision + 1 }
  } else if (command.type === 'save') {
    const draft = command.product
    if (!draft || typeof draft !== 'object')
      throw new CatalogError('Completá los datos del producto.')
    const existing = draft.id
      ? products.find((p) => p.id === draft.id)
      : undefined
    if (draft.id && !existing)
      throw new CatalogError(
        'El producto ya no existe. Actualizá el listado.',
        404,
      )
    const name = String(draft.name ?? '').trim()
    const sku = String(draft.sku ?? '').trim()
    const barcode = String(draft.barcode ?? '').trim()
    const description = String(draft.description ?? '').trim()
    const fields: Record<string, string> = {}
    if (name.length < 2 || name.length > 180)
      fields.name = 'Escribí un nombre de entre 2 y 180 caracteres.'
    if (!sku || sku.length > 60)
      fields.sku = 'Ingresá un código interno de hasta 60 caracteres.'
    else if (
      products.some(
        (p) =>
          p.id !== existing?.id &&
          p.sku?.toLocaleLowerCase() === sku.toLocaleLowerCase(),
      )
    )
      fields.sku = 'Ese código interno ya pertenece a otro producto.'
    if (barcode !== (existing?.barcode ?? '')) {
      if (barcode && !/^(?:\d{8}|\d{12,14})$/.test(barcode))
        fields.barcode =
          'El EAN debe tener 8, 12, 13 o 14 dígitos, o quedar vacío.'
      else if (
        barcode &&
        products.some((p) => p.id !== existing?.id && p.barcode === barcode)
      )
        fields.barcode = 'Ese EAN ya pertenece a otro producto.'
    }
    if (!snapshot.families.includes(draft.category))
      fields.category = 'Elegí una de las familias existentes.'
    if (!validPrice(draft.price))
      fields.price = 'Ingresá un precio mayor a cero, con hasta dos decimales.'
    if (!Number.isSafeInteger(draft.stock) || draft.stock < 0)
      fields.stock = 'Ingresá una cantidad entera, igual o mayor a cero.'
    if (description.length > 3000)
      fields.description = 'La descripción puede tener hasta 3000 caracteres.'
    if (
      typeof draft.available !== 'boolean' ||
      typeof draft.featured !== 'boolean'
    )
      fields.available = 'Revisá el estado del producto.'
    const image = draft.image || undefined
    if (
      image !== existing?.image &&
      image &&
      !/^\/api\/catalog\/images\/[a-f0-9-]{36}\.webp$/.test(image)
    )
      fields.image = 'Subí una imagen desde el selector de archivos.'
    if (Object.keys(fields).length)
      throw new CatalogError(
        'Revisá los campos marcados antes de guardar.',
        422,
        fields,
      )
    const product: Product = {
      ...existing,
      id: existing?.id ?? newId,
      name,
      sku,
      barcode,
      description,
      category: draft.category,
      price: draft.price,
      stock: draft.stock,
      available: draft.available,
      featured: draft.featured,
      image,
      featuredOrder:
        draft.featured && !existing?.featured
          ? Math.max(
              -1,
              ...products
                .filter((p) => p.featured)
                .map((p) => p.featuredOrder ?? 0),
            ) + 1
          : (existing?.featuredOrder ?? 0),
      ...(image !== existing?.image
        ? {
            imageSource: 'local-ean' as const,
            imageCreditUrl: undefined,
            imageLicense: undefined,
          }
        : {}),
    }
    products = existing
      ? products.map((p) => (p.id === existing.id ? product : p))
      : [...products, product]
  } else if (command.type === 'prices') {
    if (
      !Array.isArray(command.changes) ||
      !command.changes.length ||
      command.changes.length > products.length
    )
      throw new CatalogError('Seleccioná productos para actualizar.')
    const changes = new Map<string, number>()
    for (const change of command.changes) {
      if (
        !products.some((p) => p.id === change.id) ||
        changes.has(change.id) ||
        !validPrice(change.price)
      )
        throw new CatalogError(
          'Hay un producto o precio inválido en la selección.',
        )
      changes.set(change.id, change.price)
    }
    products = products.map((p) =>
      changes.has(p.id) ? { ...p, price: changes.get(p.id)! } : p,
    )
  } else if (command.type === 'flags') {
    if (!products.some((p) => p.id === command.id))
      throw new CatalogError('No se encontró el producto.', 404)
    if (
      (command.available !== undefined &&
        typeof command.available !== 'boolean') ||
      (command.featured !== undefined && typeof command.featured !== 'boolean')
    )
      throw new CatalogError('El estado enviado no es válido.')
    products = products.map((p) =>
      p.id === command.id
        ? {
            ...p,
            ...(command.available !== undefined
              ? { available: command.available }
              : {}),
            ...(command.featured !== undefined
              ? {
                  featured: command.featured,
                  featuredOrder:
                    command.featured && !p.featured
                      ? Math.max(
                          -1,
                          ...products
                            .filter((item) => item.featured)
                            .map((item) => item.featuredOrder ?? 0),
                        ) + 1
                      : p.featuredOrder,
                }
              : {}),
          }
        : p,
    )
  } else if (command.type === 'featured-order') {
    const featured = products.filter((p) => p.featured)
    if (
      !Array.isArray(command.ids) ||
      command.ids.length !== featured.length ||
      new Set(command.ids).size !== featured.length ||
      command.ids.some((id) => !featured.some((p) => p.id === id))
    )
      throw new CatalogError(
        'La lista de destacados cambió. Actualizá antes de ordenar.',
        409,
      )
    products = products.map((p) =>
      p.featured ? { ...p, featuredOrder: command.ids.indexOf(p.id) } : p,
    )
  } else throw new CatalogError('La operación solicitada no existe.')
  return { ...snapshot, products, revision: snapshot.revision + 1 }
}
