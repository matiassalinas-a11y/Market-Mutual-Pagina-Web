'use client'
import { useEffect, useState } from 'react'
import { Check, Eye, Percent } from 'lucide-react'
import type { Product } from '@/lib/market-data'
import { pricePreview } from '@/lib/admin/catalog-rules'
import { formatMoney } from '@/lib/utils'
import { AdminDialog } from './admin-dialog'
import styles from './admin.module.css'

export function PriceAdjustment({
  products,
  families,
  selected,
  onApply,
  onClose,
  onDirty,
}: {
  products: Product[]
  families: string[]
  selected: string[]
  onApply: (changes: { id: string; price: number }[]) => Promise<void>
  onClose: () => void
  onDirty: (dirty: boolean) => void
}) {
  const [scope, setScope] = useState(selected.length ? 'selection' : 'family')
  const [family, setFamily] = useState(families[0] ?? '')
  const [percent, setPercent] = useState('')
  const [preview, setPreview] = useState<ReturnType<typeof pricePreview>>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    onDirty(Boolean(percent))
  }, [percent, onDirty])
  const reset = () => {
    setPreview([])
    setError('')
  }
  return (
    <AdminDialog
      title="Ajustar precios"
      onClose={() => {
        if (!saving) onClose()
      }}
    >
      <div className={styles.modalBody}>
        <p className="mb-5 text-slate-600">
          Elegí los productos y revisá los nuevos precios antes de aplicar el
          ajuste.
        </p>
        {error && (
          <div className={`${styles.notice} ${styles.error}`} role="alert">
            {error}
          </div>
        )}
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="price-scope">Aplicar a</label>
            <select
              id="price-scope"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value)
                reset()
              }}
            >
              <option value="family">Una familia</option>
              <option value="selection" disabled={!selected.length}>
                {selected.length} productos seleccionados
              </option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="price-family">Familia</label>
            <select
              id="price-family"
              value={family}
              disabled={scope !== 'family'}
              onChange={(e) => {
                setFamily(e.target.value)
                reset()
              }}
            >
              {families.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="adjust-percent">Ajuste (%)</label>
            <input
              id="adjust-percent"
              inputMode="decimal"
              value={percent}
              placeholder="Ej.: 10 o -5"
              onChange={(e) => {
                setPercent(e.target.value)
                reset()
              }}
            />
            <small>10 aumenta un 10%. -5 reduce un 5%.</small>
          </div>
          <div className="flex items-start pt-7">
            <button
              className={styles.button}
              onClick={() => {
                try {
                  if (!percent.trim())
                    throw new Error('Ingresá el porcentaje del ajuste.')
                  const ids =
                    scope === 'family'
                      ? products
                          .filter((p) => p.category === family)
                          .map((p) => p.id)
                      : selected
                  const result = pricePreview(
                    products,
                    ids,
                    Number(percent.replace(',', '.')),
                  )
                  if (!result.length)
                    throw new Error('No hay productos en esta selección.')
                  setPreview(result)
                  setError('')
                } catch (caught) {
                  setError(
                    caught instanceof Error
                      ? caught.message
                      : 'Revisá el porcentaje.',
                  )
                }
              }}
            >
              <Eye />
              Ver nuevos precios
            </button>
          </div>
        </div>
        {preview.length > 0 && (
          <>
            <p className={styles.hint}>
              <Percent size={15} className="mr-2 inline" />
              Se modificarán {preview.length} productos. Se redondea a dos
              decimales; el stock y las familias se conservan.
            </p>
            <div className={styles.preview}>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio actual</th>
                    <th>Nuevo precio</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{formatMoney(p.before)}</td>
                      <td>
                        <strong>{formatMoney(p.price)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <div className={styles.modalFooter}>
        <button className={styles.button} disabled={saving} onClick={onClose}>
          Cancelar
        </button>
        <button
          className={styles.primary}
          disabled={!preview.length || saving}
          onClick={async () => {
            setSaving(true)
            setError('')
            try {
              await onApply(preview.map((p) => ({ id: p.id, price: p.price })))
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : 'No se pudieron actualizar los precios.',
              )
            } finally {
              setSaving(false)
            }
          }}
        >
          <Check />
          {saving
            ? 'Aplicando…'
            : `Aplicar ajuste${preview.length ? ` a ${preview.length} productos` : ''}`}
        </button>
      </div>
    </AdminDialog>
  )
}
