import type { Product } from '@/lib/market-data'
import type { ProductImageAssociation } from '@/lib/product-images'

const DB_NAME = 'market-mutual-demo'
const DB_VERSION = 2
const PRODUCT_STORE = 'products'
const META_STORE = 'meta'
const IMAGE_ASSOCIATION_STORE = 'image-associations'

export type CatalogMeta = {
  fileName: string
  importedAt: string
  validCount: number
  duplicateCount: number
  invalidCount: number
  catalogVersion?: string
  stockFileName?: string
  stockAsOf?: string
  withImageCount?: number
  categoryReviewCount?: number
}

function openCatalogDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
        db.createObjectStore(PRODUCT_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(IMAGE_ASSOCIATION_STORE)) {
        db.createObjectStore(IMAGE_ASSOCIATION_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function loadStoredCatalog(): Promise<{ products: Product[]; meta: CatalogMeta } | null> {
  const db = await openCatalogDb()
  try {
    const transaction = db.transaction([PRODUCT_STORE, META_STORE], 'readonly')
    const productsRequest = transaction.objectStore(PRODUCT_STORE).getAll() as IDBRequest<Product[]>
    const metaRequest = transaction.objectStore(META_STORE).get('catalog') as IDBRequest<{ key: string; value: CatalogMeta } | undefined>
    const [products, storedMeta] = await Promise.all([requestResult(productsRequest), requestResult(metaRequest)])
    if (!storedMeta || products.length === 0) return null
    return { products, meta: storedMeta.value }
  } finally {
    db.close()
  }
}

export async function saveStoredCatalog(products: Product[], meta: CatalogMeta): Promise<void> {
  const db = await openCatalogDb()
  try {
    const transaction = db.transaction([PRODUCT_STORE, META_STORE], 'readwrite')
    const productStore = transaction.objectStore(PRODUCT_STORE)
    productStore.clear()
    products.forEach((product) => productStore.put(product))
    transaction.objectStore(META_STORE).put({ key: 'catalog', value: meta })
    await transactionDone(transaction)
  } finally {
    db.close()
  }
}

export async function clearStoredCatalog(): Promise<void> {
  const db = await openCatalogDb()
  try {
    const transaction = db.transaction([PRODUCT_STORE, META_STORE], 'readwrite')
    transaction.objectStore(PRODUCT_STORE).clear()
    transaction.objectStore(META_STORE).clear()
    await transactionDone(transaction)
  } finally {
    db.close()
  }
}

export async function loadStoredImageAssociations(): Promise<ProductImageAssociation[]> {
  const db = await openCatalogDb()
  try {
    const transaction = db.transaction(IMAGE_ASSOCIATION_STORE, 'readonly')
    const request = transaction.objectStore(IMAGE_ASSOCIATION_STORE).getAll() as IDBRequest<ProductImageAssociation[]>
    return await requestResult(request)
  } finally {
    db.close()
  }
}

export async function saveStoredImageAssociation(association: ProductImageAssociation): Promise<void> {
  const db = await openCatalogDb()
  try {
    const transaction = db.transaction(IMAGE_ASSOCIATION_STORE, 'readwrite')
    transaction.objectStore(IMAGE_ASSOCIATION_STORE).put(association)
    await transactionDone(transaction)
  } finally {
    db.close()
  }
}
