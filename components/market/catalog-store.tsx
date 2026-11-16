'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { products as demoProducts } from '@/lib/market-data'
import type { Product } from '@/lib/market-data'
import bundledCatalogPayload from '@/public/data/catalog-posberry.json'
import {
  clearStoredCatalog,
  loadStoredCatalog,
  loadStoredImageAssociations,
  saveStoredCatalog,
  saveStoredImageAssociation,
} from '@/lib/catalog-storage'
import type { CatalogMeta } from '@/lib/catalog-storage'
import {
  applyProductImageAssociations,
  createImageAssociation,
  productImageCandidates,
  productImagePilotReport,
} from '@/lib/product-images'
import type { ProductImageAssociation, ProductImageCandidate, ProductImagePilotReport } from '@/lib/product-images'

export type CatalogCategory = { name: string; count: number }

type CatalogContextValue = {
  products: Product[]
  categories: CatalogCategory[]
  ready: boolean
  source: 'demo' | 'imported' | 'posberry'
  meta: CatalogMeta | null
  imageAssociations: ProductImageAssociation[]
  imageCandidates: ProductImageCandidate[]
  imagePilotReport: ProductImagePilotReport
  storageError: string | null
  replaceCatalog: (products: Product[], meta: CatalogMeta) => Promise<void>
  reviewImageCandidate: (candidate: ProductImageCandidate, status: 'approved' | 'rejected', imageUrl?: string) => Promise<void>
  clearCatalog: () => Promise<void>
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined)

type BundledCatalog = {
  catalogVersion: string
  generatedAt: string
  sourceFiles: string[]
  summary: {
    incorporated: number
    withSourceImage: number
    categoryReview: number
  }
  products: Product[]
}

function loadBundledCatalog(): { products: Product[]; meta: CatalogMeta } {
  const payload = bundledCatalogPayload as BundledCatalog
  return {
    products: payload.products,
    meta: {
      fileName: payload.sourceFiles[0] ?? 'Catálogo POSBerry',
      stockFileName: payload.sourceFiles[1],
      importedAt: payload.generatedAt,
      validCount: payload.summary.incorporated,
      duplicateCount: 0,
      invalidCount: 0,
      catalogVersion: payload.catalogVersion,
      stockAsOf: payload.catalogVersion.replace('posberry-', ''),
      withImageCount: payload.summary.withSourceImage,
      categoryReviewCount: payload.summary.categoryReview,
    },
  }
}

const initialBundledCatalog = loadBundledCatalog()

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => applyProductImageAssociations(initialBundledCatalog.products, []))
  const [source, setSource] = useState<'demo' | 'imported' | 'posberry'>('posberry')
  const [meta, setMeta] = useState<CatalogMeta | null>(initialBundledCatalog.meta)
  const [imageAssociations, setImageAssociations] = useState<ProductImageAssociation[]>([])
  const [storageError, setStorageError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const bundledCatalogRef = useRef<{ products: Product[]; meta: CatalogMeta } | null>(initialBundledCatalog)

  useEffect(() => {
    let active = true
    const hydrateCatalog = async () => {
      const bundled = initialBundledCatalog

      const [stored, storedImageAssociations] = await Promise.all([
        Promise.race([
        loadStoredCatalog().catch(() => null),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 2000)),
        ]),
        loadStoredImageAssociations(),
      ])
      if (!active) return
      const storedHasUsableStock = stored?.products.some((product) => product.stock != null && product.stock > 0) ?? false
      const storedIsCurrent = Boolean(stored && bundled && stored.meta.catalogVersion === bundled.meta.catalogVersion)
      const selected = storedIsCurrent || (stored && storedHasUsableStock && !stored.meta.catalogVersion)
        ? stored
        : bundled ?? stored
      if (!selected) return
      if (bundled && selected === bundled) {
        void saveStoredCatalog(bundled.products, bundled.meta).catch(() => {
          // El catálogo incluido debe seguir visible aunque IndexedDB esté bloqueado.
        })
      }
      setProducts(applyProductImageAssociations(selected.products, storedImageAssociations))
      setImageAssociations(storedImageAssociations)
      setMeta(selected.meta)
      setSource(selected.meta.catalogVersion ? 'posberry' : 'imported')
      setReady(true)
    }

    void hydrateCatalog()
      .catch((error: unknown) => {
        setStorageError(error instanceof Error ? error.message : 'No se pudieron leer las asociaciones de imágenes locales.')
        // IndexedDB puede estar bloqueado en navegación privada. El catálogo demo sigue disponible.
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    products
      .filter((product) => product.available && product.stock != null && product.stock > 0)
      .forEach((product) => counts.set(product.category, (counts.get(product.category) ?? 0) + 1))
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es'))
  }, [products])

  const replaceCatalog = async (nextProducts: Product[], nextMeta: CatalogMeta) => {
    await saveStoredCatalog(nextProducts, nextMeta)
    setProducts(applyProductImageAssociations(nextProducts, imageAssociations))
    setMeta(nextMeta)
    setSource('imported')
  }

  const reviewImageCandidate = async (
    candidate: ProductImageCandidate,
    status: 'approved' | 'rejected',
    imageUrl?: string,
  ) => {
    const association = createImageAssociation(candidate, status, imageUrl)
    await saveStoredImageAssociation(association)
    setImageAssociations((current) => [
      ...current.filter((item) => item.id !== association.id),
      association,
    ])
    if (status === 'approved') {
      setProducts((current) => applyProductImageAssociations(current, [association]))
    }
  }

  const clearCatalog = async () => {
    await clearStoredCatalog()
    const bundled = bundledCatalogRef.current ?? initialBundledCatalog
    if (bundled) {
      await saveStoredCatalog(bundled.products, bundled.meta)
      bundledCatalogRef.current = bundled
      setProducts(applyProductImageAssociations(bundled.products, imageAssociations))
      setMeta(bundled.meta)
      setSource('posberry')
    } else {
      setProducts(demoProducts)
      setMeta(null)
      setSource('demo')
    }
  }

  return (
    <CatalogContext.Provider value={{
      products,
      categories,
      ready,
      source,
      meta,
      imageAssociations,
      imageCandidates: productImageCandidates,
      imagePilotReport: productImagePilotReport,
      storageError,
      replaceCatalog,
      reviewImageCandidate,
      clearCatalog,
    }}>
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext)
  if (!context) throw new Error('useCatalog debe usarse dentro de CatalogProvider')
  return context
}
