'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Save, Trash2 } from 'lucide-react'
import type { FeaturedFlyer } from '@/lib/featured-flyers'
import styles from './admin.module.css'

export function FlyerManager({
  initialFlyers,
  disabled,
  onSave,
  onDirty,
}: {
  initialFlyers: FeaturedFlyer[]
  disabled: boolean
  onSave: (flyers: FeaturedFlyer[]) => Promise<void>
  onDirty: (dirty: boolean) => void
}) {
  const [flyers, setFlyers] = useState(initialFlyers)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(flyers) !== JSON.stringify(initialFlyers)
  useEffect(() => {
    onDirty(dirty)
  }, [dirty, onDirty])
  useEffect(() => () => onDirty(false), [onDirty])
  const upload = async (file: File | undefined, replaceId?: string) => {
    if (!file) return
    setProcessing(true)
    setError('')
    try {
      if (!replaceId && flyers.length >= 5)
        throw new Error('Podés cargar un máximo de 5 flyers.')
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
        throw new Error('Elegí una imagen JPG, PNG o WebP de hasta 5 MB.')
      const bitmap = await createImageBitmap(file)
      if (
        !bitmap.width ||
        !bitmap.height ||
        bitmap.width * bitmap.height > 40000000
      ) {
        bitmap.close()
        throw new Error('Usá una imagen de hasta 40 megapíxeles.')
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
              : reject(new Error('No pudimos preparar la imagen.')),
          'image/webp',
          0.9,
        ),
      )
      const form = new FormData()
      form.append('image', blob, 'flyer.webp')
      const response = await fetch('/api/admin/images', {
        method: 'POST',
        body: form,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      if (replaceId)
        setFlyers((current) =>
          current.map((f) =>
            f.id === replaceId
              ? { ...f, image: result.imageUrl, mobileImage: undefined }
              : f,
          ),
        )
      else
        setFlyers((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            title: file.name.replace(/\.[^.]+$/, '').slice(0, 240),
            image: result.imageUrl,
            href: '#productos',
          },
        ])
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'No pudimos subir el flyer.',
      )
    } finally {
      setProcessing(false)
    }
  }
  const locked = disabled || processing || saving
  return (
    <section className={styles.panel} aria-label="Flyers destacados del inicio">
      <div className={styles.featuredHeader}>
        <div>
          <h2 className="mb-1 text-xl font-bold">
            Flyers destacados{' '}
            <span className={styles.badge}>{flyers.length} de 5</span>
          </h2>
          <p>Estos son los flyers que aparecen en el carrusel del inicio.</p>
        </div>
        <button
          className={styles.primary}
          disabled={locked || !dirty}
          onClick={async () => {
            setSaving(true)
            setError('')
            try {
              await onSave(flyers)
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : 'No se pudieron guardar los flyers.',
              )
            } finally {
              setSaving(false)
            }
          }}
        >
          <Save />
          {saving ? 'Guardando…' : 'Guardar flyers'}
        </button>
      </div>
      <div className="border-b border-slate-200 bg-sky-50 px-5 py-4 text-sm text-[#12355f]">
        <strong>Tamaño recomendado: 960 × 540 px</strong> (horizontal, 16:9).
        JPG, PNG o WebP, hasta 5 MB. Máximo 5 flyers. Las imágenes se muestran
        completas, sin recortar.
      </div>
      {error && (
        <div role="alert" className={`${styles.notice} ${styles.error} m-4`}>
          {error}
        </div>
      )}
      <ol className={styles.flyerList}>
        {flyers.map((flyer, index) => (
          <li key={flyer.id}>
            <span className={styles.orderNumber}>{index + 1}</span>
            <img
              className={styles.flyerThumbnail}
              src={flyer.image}
              alt={flyer.title}
            />
            <div className={styles.flyerInfo}>
              <label htmlFor={`flyer-${flyer.id}`}>Nombre del flyer</label>
              <input
                id={`flyer-${flyer.id}`}
                value={flyer.title}
                maxLength={240}
                disabled={locked}
                onChange={(e) =>
                  setFlyers((current) =>
                    current.map((f) =>
                      f.id === flyer.id ? { ...f, title: e.target.value } : f,
                    ),
                  )
                }
              />
              <small>Recomendado: 960 × 540 px</small>
              <label className={styles.button}>
                Reemplazar imagen
                <input
                  className="sr-only"
                  type="file"
                  aria-label={`Reemplazar imagen de ${flyer.title}`}
                  accept="image/jpeg,image/png,image/webp"
                  disabled={locked}
                  onChange={(e) => {
                    void upload(e.target.files?.[0], flyer.id)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            <div className={styles.flyerActions}>
              {[-1, 1].map((direction) => (
                <button
                  className={styles.iconButton}
                  key={direction}
                  disabled={
                    locked ||
                    index + direction < 0 ||
                    index + direction >= flyers.length
                  }
                  aria-label={`${direction < 0 ? 'Subir' : 'Bajar'} flyer ${flyer.title}`}
                  onClick={() =>
                    setFlyers((current) => {
                      const next = [...current]
                      ;[next[index], next[index + direction]] = [
                        next[index + direction],
                        next[index],
                      ]
                      return next
                    })
                  }
                >
                  {direction < 0 ? <ArrowUp /> : <ArrowDown />}
                </button>
              ))}
              <button
                className={styles.button}
                disabled={locked}
                aria-label={`Quitar flyer ${flyer.title}`}
                onClick={() =>
                  setFlyers((current) =>
                    current.filter((f) => f.id !== flyer.id),
                  )
                }
              >
                <Trash2 />
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ol>
      {!flyers.length && (
        <p className="p-6 text-slate-600">
          No hay flyers. Agregá uno para mostrarlo en el inicio.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 p-5">
        <label
          className={`${styles.button} ${locked || flyers.length >= 5 ? 'opacity-50' : ''}`}
        >
          <ImagePlus />
          {processing ? 'Preparando imagen…' : 'Agregar flyer'}
          <input
            className="sr-only"
            type="file"
            aria-label="Agregar flyer"
            accept="image/jpeg,image/png,image/webp"
            disabled={locked || flyers.length >= 5}
            onChange={(e) => {
              void upload(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        <small>
          {flyers.length >= 5
            ? 'Llegaste al máximo de 5. Quitá uno para agregar otro.'
            : 'Los cambios se muestran en el inicio al guardar.'}
        </small>
        {dirty && (
          <button
            className={styles.button}
            disabled={locked}
            onClick={() => setFlyers(initialFlyers)}
          >
            Descartar cambios
          </button>
        )}
      </div>
    </section>
  )
}
