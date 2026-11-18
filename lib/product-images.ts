import type { Product } from '@/lib/market-data'
import bundledAssociationPayload from '@/public/data/product-image-associations.json'
import candidatePayload from '@/public/data/product-image-candidates.json'
import pilotReportPayload from '@/public/data/product-image-pilot.json'
import localImagePayload from '@/public/data/product-image-local.json'

export type ProductImageCandidate = {
  id: string
  sku: string
  barcode: string
  productName: string
  candidateName: string
  brand: string
  quantity: string
  imageUrl: string
  sourceProductUrl: string
  confidence: number
}

export type ProductImageAssociation = {
  id: string
  productId: string
  sku?: string
  barcode?: string
  imageUrl: string
  sourceImageUrl?: string
  sourceName: 'Open Food Facts'
  sourceProductUrl: string
  license: 'CC BY-SA 3.0'
  confidence: number
  method: 'manual' | 'automatic'
  status: 'approved' | 'rejected'
  reviewedAt: string
}

type BundledProductImageRecord = Omit<ProductImageAssociation, 'sourceName' | 'license'>

type BundledProductImageManifest = {
  schemaVersion: number
  sourceName: ProductImageAssociation['sourceName']
  license: ProductImageAssociation['license']
  licenseUrl: string
  associations: BundledProductImageRecord[]
}

type LocalProductImageManifest = {
  schemaVersion: number
  generatedAt: string
  sourceCatalog: string
  associations: Array<{
    productId: string
    sku?: string
    barcode: string
    imageUrl: string
    method: 'ean-catalog' | 'excel-bridge' | 'reviewed-candidate'
  }>
}

export type ProductImagePilotReport = {
  processed: number
  summary: {
    imageCandidates: number
    productFoundWithoutImage: number
    notFound: number
    requestErrors: number
    automaticAssociations: number
  }
}

export const productImageCandidates = candidatePayload as ProductImageCandidate[]
export const productImagePilotReport = pilotReportPayload as ProductImagePilotReport
const bundledImageManifest = bundledAssociationPayload as BundledProductImageManifest
const localImageManifest = localImagePayload as LocalProductImageManifest
const bundledProductImageAssociations: ProductImageAssociation[] = bundledImageManifest.associations.map((association) => ({
  ...association,
  sourceName: bundledImageManifest.sourceName,
  license: bundledImageManifest.license,
}))

export function isApprovedProductImage(product: Product): boolean {
  return Boolean(
    product.image
    && (
      (product.imageSource === 'local-ean' && (product.image.startsWith('/products/') || product.image.startsWith('/api/catalog/images/')))
      || (
        product.imageSource === 'open-food-facts'
        && product.imageCreditUrl
        && product.imageLicense === 'CC BY-SA 3.0'
      )
    ),
  )
}

function normalizedIdentifier(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase()
  return normalized || undefined
}

export function createImageAssociation(
  candidate: ProductImageCandidate,
  status: ProductImageAssociation['status'],
  imageUrl = candidate.imageUrl,
): ProductImageAssociation {
  if (status === 'approved') {
    let url: URL
    try {
      url = new URL(imageUrl)
    } catch {
      throw new Error('La URL de imagen no es válida.')
    }
    if (url.protocol !== 'https:' || url.hostname !== 'images.openfoodfacts.org') {
      throw new Error('Solo se aceptan imágenes alojadas en images.openfoodfacts.org para esta fuente.')
    }
  }

  return {
    id: candidate.id,
    productId: candidate.id,
    sku: candidate.sku,
    barcode: candidate.barcode,
    imageUrl,
    sourceName: 'Open Food Facts',
    sourceProductUrl: candidate.sourceProductUrl,
    license: 'CC BY-SA 3.0',
    confidence: candidate.confidence,
    method: 'manual',
    status,
    reviewedAt: new Date().toISOString(),
  }
}

export function applyProductImageAssociations(
  products: Product[],
  associations: ProductImageAssociation[],
): Product[] {
  const localByIdentifier = new Map<string, LocalProductImageManifest['associations'][number]>()
  localImageManifest.associations.forEach((association) => {
    localByIdentifier.set(`id:${association.productId}`, association)
    const sku = normalizedIdentifier(association.sku)
    const barcode = normalizedIdentifier(association.barcode)
    if (sku) localByIdentifier.set(`sku:${sku}`, association)
    if (barcode) localByIdentifier.set(`barcode:${barcode}`, association)
  })

  const approvedByIdentifier = new Map<string, ProductImageAssociation>()
  associations
    .filter((association) => association.status === 'approved')
    .forEach((association) => {
      approvedByIdentifier.set(`id:${association.productId}`, association)
      const sku = normalizedIdentifier(association.sku)
      const barcode = normalizedIdentifier(association.barcode)
      if (sku) approvedByIdentifier.set(`sku:${sku}`, association)
      if (barcode) approvedByIdentifier.set(`barcode:${barcode}`, association)
    })

  const bundledByIdentifier = new Map<string, ProductImageAssociation>()
  bundledProductImageAssociations
    .filter((association) => association.status === 'approved')
    .forEach((association) => {
      bundledByIdentifier.set(`id:${association.productId}`, association)
      const sku = normalizedIdentifier(association.sku)
      const barcode = normalizedIdentifier(association.barcode)
      if (sku) bundledByIdentifier.set(`sku:${sku}`, association)
      if (barcode) bundledByIdentifier.set(`barcode:${barcode}`, association)
    })

  const barcodeCounts = new Map<string, number>()
  products.forEach((product) => {
    const barcode = normalizedIdentifier(product.barcode)
    if (barcode) barcodeCounts.set(barcode, (barcodeCounts.get(barcode) ?? 0) + 1)
  })

  return products.map((product) => {
    const localAssociation = [
      localByIdentifier.get(`id:${product.id}`),
      normalizedIdentifier(product.sku)
        ? localByIdentifier.get(`sku:${normalizedIdentifier(product.sku)}`)
        : undefined,
      normalizedIdentifier(product.barcode)
        ? localByIdentifier.get(`barcode:${normalizedIdentifier(product.barcode)}`)
        : undefined,
    ].find(Boolean)

    if (localAssociation) {
      return {
        ...product,
        image: localAssociation.imageUrl,
        imageSource: 'local-ean',
        imageCreditUrl: undefined,
        imageLicense: undefined,
      }
    }

    const storedAssociation = [
      approvedByIdentifier.get(`id:${product.id}`),
      normalizedIdentifier(product.sku)
        ? approvedByIdentifier.get(`sku:${normalizedIdentifier(product.sku)}`)
        : undefined,
      normalizedIdentifier(product.barcode)
        ? approvedByIdentifier.get(`barcode:${normalizedIdentifier(product.barcode)}`)
        : undefined,
    ].find(Boolean)

    if (storedAssociation) {
      return {
        ...product,
        image: storedAssociation.imageUrl,
        imageSource: 'open-food-facts',
        imageCreditUrl: storedAssociation.sourceProductUrl,
        imageLicense: storedAssociation.license,
      }
    }

    if (isApprovedProductImage(product)) return product

    const sku = normalizedIdentifier(product.sku)
    const barcode = normalizedIdentifier(product.barcode)
    const bundledAssociation = [
      bundledByIdentifier.get(`id:${product.id}`),
      sku ? bundledByIdentifier.get(`sku:${sku}`) : undefined,
      barcode && barcodeCounts.get(barcode) === 1
        ? bundledByIdentifier.get(`barcode:${barcode}`)
        : undefined,
    ].find(Boolean)

    if (!bundledAssociation) return product
    return {
      ...product,
      image: bundledAssociation.imageUrl,
      imageSource: 'open-food-facts',
      imageCreditUrl: bundledAssociation.sourceProductUrl,
      imageLicense: bundledAssociation.license,
    }
  })
}
