'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import { ImagePlus, LoaderCircle, Save } from 'lucide-react'
import type { Product } from '@/lib/market-data'
import type { ProductDraft } from '@/lib/admin/catalog-rules'
import { CatalogError, parsePriceInput } from '@/lib/admin/catalog-rules'
import { AdminDialog } from './admin-dialog'
import styles from './admin.module.css'

export function ProductEditor({
  product,
  families,
  onSave,
  onClose,
  onDirty,
}: {
  product: Product | null
  families: string[]
  onSave: (draft: ProductDraft, image?: Blob) => Promise<void>
  onClose: () => void
  onDirty: (dirty: boolean) => void
}) {
  const [initial] = useState(() => ({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    description: product?.description ?? '',
    category: product?.category ?? families[0] ?? '',
    price: String(product?.price ?? ''),
    stock: String(product?.stock ?? 0),
    available: product?.available ?? true,
    featured: product?.featured ?? false,
  }))
  const [form, setForm] = useState(initial)
  const [image, setImage] = useState<Blob>()
  const [preview, setPreview] = useState(
    product?.image || '/placeholder-product.svg',
  )
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)
  const dirty =
    JSON.stringify(form) !== JSON.stringify(initial) || Boolean(image)
  useEffect(() => {
    onDirty(dirty)
  }, [dirty, onDirty])
  useEffect(
    () => () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    },
    [preview],
  )
  const field = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }))
  const selectImage = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setProcessing(true)
    try {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
        throw new Error('Elegí una foto JPG, PNG o WebP de hasta 5 MB.')
      const bitmap = await createImageBitmap(file)
      if (
        !bitmap.width ||
        !bitmap.height ||
        bitmap.width * bitmap.height > 40000000
      ) {
        bitmap.close()
        throw new Error(
          'La imagen es demasiado grande. Usá una foto de hasta 40 megapíxeles.',
        )
      }
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas
        .getContext('2d')!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error('No se pudo preparar la imagen.')),
          'image/webp',
          0.9,
        ),
      )
      setImage(blob)
      setPreview(URL.createObjectURL(blob))
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No pudimos abrir la imagen. Elegí otra foto.',
      )
    } finally {
      setProcessing(false)
    }
  }
  return (
    <AdminDialog
      title={product ? 'Editar producto' : 'Nuevo producto'}
      onClose={() => {
        if (!saving) onClose()
      }}
    >
      <form
        noValidate
        onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          setFields({})
          setSaving(true)
          try {
            const price = parsePriceInput(form.price)
            const stock = form.stock.trim() ? Number(form.stock) : NaN
            await onSave(
              { ...form, id: product?.id, price, stock, image: product?.image },
              image,
            )
          } catch (caught) {
            if (caught instanceof CatalogError) setFields(caught.fields)
            setError(
              caught instanceof Error
                ? caught.message
                : 'No se pudo guardar el producto.',
            )
          } finally {
            setSaving(false)
          }
        }}
      >
        <div className={styles.modalBody}>
          {error && (
            <div role="alert" className={`${styles.notice} ${styles.error}`}>
              {error}
            </div>
          )}
          <div className={styles.imageUpload}>
            <img src={preview} alt="Vista previa del producto" />
            <div>
              <label className={styles.button} htmlFor="product-photo">
                <ImagePlus size={18} />
                {processing
                  ? 'Preparando foto…'
                  : product?.image
                    ? 'Reemplazar foto'
                    : 'Subir foto'}
              </label>
              <input
                id="product-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={saving || processing}
                className="sr-only"
                onChange={(event) => {
                  void selectImage(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <p>
                JPG, PNG o WebP. Hasta 5 MB.
                <br />
                La foto actual se conserva hasta guardar.
              </p>
              {image && (
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => {
                    setImage(undefined)
                    setPreview(product?.image || '/placeholder-product.svg')
                  }}
                >
                  Usar foto anterior
                </button>
              )}
            </div>
          </div>
          <div className={styles.formGrid}>
            <div className={`${styles.field} ${styles.wide}`}>
              <label htmlFor="product-name">Nombre del producto *</label>
              <input
                id="product-name"
                value={form.name}
                maxLength={180}
                aria-invalid={!!fields.name}
                aria-describedby={fields.name ? 'error-name' : undefined}
                onChange={(e) => field('name', e.target.value)}
                required
              />
              {fields.name && (
                <p className={styles.fieldError} id="error-name">
                  {fields.name}
                </p>
              )}
            </div>
            {(['sku', 'barcode'] as const).map((key) => (
              <div className={styles.field} key={key}>
                <label htmlFor={`product-${key}`}>
                  {key === 'sku' ? 'Código interno *' : 'EAN (opcional)'}
                </label>
                <input
                  id={`product-${key}`}
                  value={form[key]}
                  inputMode={key === 'barcode' ? 'numeric' : undefined}
                  maxLength={key === 'barcode' ? 14 : 60}
                  aria-invalid={!!fields[key]}
                  aria-describedby={fields[key] ? `error-${key}` : undefined}
                  onChange={(e) => field(key, e.target.value)}
                />
                {fields[key] ? (
                  <p className={styles.fieldError} id={`error-${key}`}>
                    {fields[key]}
                  </p>
                ) : (
                  <small>
                    {key === 'sku'
                      ? 'Identifica el producto en el mercado.'
                      : 'Código de barras del envase.'}
                  </small>
                )}
              </div>
            ))}
            <div className={`${styles.field} ${styles.wide}`}>
              <label htmlFor="product-family">Familia *</label>
              <select
                id="product-family"
                value={form.category}
                onChange={(e) => field('category', e.target.value)}
                aria-invalid={!!fields.category}
              >
                {families.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              {fields.category && (
                <p className={styles.fieldError}>{fields.category}</p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="product-price">Precio ($) *</label>
              <input
                id="product-price"
                inputMode="decimal"
                value={form.price}
                placeholder="Ej.: 1.250,50"
                onChange={(e) => field('price', e.target.value)}
                aria-invalid={!!fields.price}
                aria-describedby={fields.price ? 'error-price' : undefined}
              />
              {fields.price && (
                <p id="error-price" className={styles.fieldError}>
                  {fields.price}
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="product-stock">Stock interno *</label>
              <input
                id="product-stock"
                inputMode="numeric"
                value={form.stock}
                onChange={(e) => field('stock', e.target.value)}
                aria-invalid={!!fields.stock}
                aria-describedby="stock-help"
              />
              <small id="stock-help">
                Esta cantidad no se muestra a los clientes.
              </small>
              {fields.stock && (
                <p className={styles.fieldError}>{fields.stock}</p>
              )}
            </div>
            <div className={`${styles.field} ${styles.wide}`}>
              <label htmlFor="product-description">Descripción</label>
              <textarea
                id="product-description"
                value={form.description}
                maxLength={3000}
                rows={3}
                onChange={(e) => field('description', e.target.value)}
              />
            </div>
            <div className={`${styles.checkGroup} ${styles.wide}`}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => field('available', e.target.checked)}
                />
                Producto activo<small>Visible cuando tenga stock.</small>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => field('featured', e.target.checked)}
                />
                Destacar en el inicio
              </label>
            </div>
          </div>
        </div>
        {fields.image && <p className={styles.fieldError}>{fields.image}</p>}
        <div className={styles.modalFooter}>
          <button
            className={styles.button}
            type="button"
            disabled={saving}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className={styles.primary}
            type="submit"
            disabled={saving || processing}
          >
            {saving ? <LoaderCircle className="animate-spin" /> : <Save />}
            {saving ? 'Guardando…' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </AdminDialog>
  )
}
