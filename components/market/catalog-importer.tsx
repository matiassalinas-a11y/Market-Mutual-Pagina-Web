'use client'

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  ImageOff,
  LoaderCircle,
  PackageSearch,
  Search,
  Tags,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatalog } from '@/components/market/catalog-store'
import {
  buildImportReportCsv,
  IMPORT_FIELD_OPTIONS,
  parseCatalogFile,
  suggestColumnMapping,
  validateCatalogRows,
} from '@/lib/catalog-import'
import type { ColumnMapping, ParsedCatalogFile } from '@/lib/catalog-import'
import { formatMoney } from '@/lib/utils'
import type { ProductImageCandidate } from '@/lib/product-images'
import { isApprovedProductImage } from '@/lib/product-images'

function downloadTextFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function CatalogImporter() {
  const {
    products,
    categories,
    source,
    meta,
    imageAssociations,
    imageCandidates,
    imagePilotReport,
    storageError,
    replaceCatalog,
    reviewImageCandidate,
    clearCatalog,
  } = useCatalog()
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsedFile, setParsedFile] = useState<ParsedCatalogFile | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [catalogQuery, setCatalogQuery] = useState('')
  const [imageError, setImageError] = useState<string | null>(null)
  const [reviewingImageId, setReviewingImageId] = useState<string | null>(null)
  const [verifiedCandidates, setVerifiedCandidates] = useState<string[]>([])
  const [candidateUrls, setCandidateUrls] = useState<Record<string, string>>({})

  const result = useMemo(
    () => parsedFile ? validateCatalogRows(parsedFile.rows, mapping) : null,
    [parsedFile, mapping],
  )

  const filteredProducts = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => [product.name, product.sku, product.barcode, product.category, product.brand]
      .some((value) => value?.toLowerCase().includes(query)))
  }, [catalogQuery, products])

  const productsWithStock = products.filter((product) => product.stock != null && product.stock > 0)
  const reviewedAssociations = new Map(imageAssociations.map((association) => [association.id, association]))
  const pendingImageCandidates = imageCandidates.filter((candidate) => !reviewedAssociations.has(candidate.id))
  const stats = {
    products: products.length,
    categories: categories.length,
    withImage: productsWithStock.filter(isApprovedProductImage).length,
    withoutImage: productsWithStock.filter((product) => !isApprovedProductImage(product)).length,
    unverifiedImages: productsWithStock.filter((product) => Boolean(product.image) && !isApprovedProductImage(product)).length,
    automaticImages: new Set([
      ...productsWithStock
        .filter((product) => isApprovedProductImage(product) && product.image?.startsWith('/products/'))
        .map((product) => product.id),
      ...imageAssociations
        .filter((association) => association.status === 'approved' && association.method === 'automatic')
        .map((association) => association.productId),
    ]).size,
    manuallyApprovedImages: imageAssociations.filter((association) => association.status === 'approved' && association.method === 'manual').length,
    pendingImages: pendingImageCandidates.length,
    withoutPrice: products.filter((product) => !Number.isFinite(product.price) || product.price <= 0).length,
    withoutStock: products.filter((product) => product.stock == null).length,
    categoryReview: products.filter((product) => product.categoryReview).length,
  }

  const handleImageReview = async (
    candidate: ProductImageCandidate,
    status: 'approved' | 'rejected',
  ) => {
    setImageError(null)
    if (status === 'approved' && !verifiedCandidates.includes(candidate.id)) {
      setImageError('Confirmá primero que la foto muestra la marca y la presentación exactas.')
      return
    }

    const imageUrl = candidateUrls[candidate.id]?.trim() || candidate.imageUrl
    setReviewingImageId(candidate.id)
    try {
      await reviewImageCandidate(candidate, status, imageUrl)
      setNotice(status === 'approved'
        ? `Se aprobó la imagen de ${candidate.productName}. Se conserva en este navegador y se reaplica al reimportar por SKU o código de barras.`
        : `La coincidencia de ${candidate.productName} quedó descartada.`)
      setVerifiedCandidates((current) => current.filter((id) => id !== candidate.id))
    } catch (caught) {
      setImageError(caught instanceof Error ? caught.message : 'No se pudo guardar la revisión de la imagen.')
    } finally {
      setReviewingImageId(null)
    }
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const parsed = await parseCatalogFile(file)
      setParsedFile(parsed)
      setMapping(suggestColumnMapping(parsed.headers))
    } catch (caught) {
      setParsedFile(null)
      setError(caught instanceof Error ? caught.message : 'No se pudo leer el archivo.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const cancelImport = () => {
    setParsedFile(null)
    setMapping({})
    setError(null)
  }

  const confirmImport = async () => {
    if (!parsedFile || !result || result.products.length === 0) return
    setSaving(true)
    setError(null)
    try {
      await replaceCatalog(result.products, {
        fileName: parsedFile.fileName,
        importedAt: new Date().toISOString(),
        validCount: result.validCount,
        duplicateCount: result.duplicateCount,
        invalidCount: result.invalidCount,
      })
      setNotice(`Catálogo local actualizado con ${result.validCount.toLocaleString('es-AR')} productos.`)
      cancelImport()
    } catch {
      setError('No se pudo guardar el catálogo en IndexedDB. Verificá que el navegador permita almacenamiento local.')
    } finally {
      setSaving(false)
    }
  }

  const clearDemoData = async () => {
    if (!window.confirm('¿Descartar el catálogo importado manualmente y restaurar el catálogo POSBerry incluido en la tienda?')) return
    await clearCatalog()
    setNotice('Se eliminaron los datos importados manualmente. Se restauró el catálogo POSBerry con stock real.')
  }

  const requiredMapped = mapping.name != null && mapping.price != null

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6" aria-label="Resumen del catálogo">
        {[
          { label: 'Productos', value: stats.products, icon: Database, tone: 'blue' },
          { label: 'Categorías', value: stats.categories, icon: Tags, tone: 'sky' },
          { label: 'Sin fotografía', value: stats.withoutImage, icon: ImageOff, tone: 'amber' },
          { label: 'Precio inválido', value: stats.withoutPrice, icon: XCircle, tone: 'red' },
          { label: 'Stock no informado', value: stats.withoutStock, icon: PackageSearch, tone: 'slate' },
          { label: 'Categoría a revisar', value: stats.categoryReview, icon: AlertTriangle, tone: 'amber' },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_28px_rgba(16,47,83,0.05)]">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{item.label}</p><item.icon className="size-5 text-[#2581d2]" /></div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#12355f]">{item.value.toLocaleString('es-AR')}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Resumen de fotografías">
        {[
          { label: 'Con imagen aprobada · stock positivo', value: stats.withImage },
          { label: 'Sin imagen aprobada · stock positivo', value: stats.withoutImage },
          { label: 'Referencias no verificadas', value: stats.unverifiedImages },
          { label: 'Verificadas automáticamente', value: stats.automaticImages },
          { label: 'Aprobadas manualmente', value: stats.manuallyApprovedImages },
          { label: 'Pendientes de revisión', value: stats.pendingImages },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#12355f]">{item.value.toLocaleString('es-AR')}</p>
          </div>
        ))}
      </section>

      {notice && <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status"><CheckCircle2 className="size-5" />{notice}</div>}
      {error && <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert"><AlertTriangle className="size-5" />{error}</div>}
      {storageError && <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="alert"><AlertTriangle className="size-5" />No se pudieron cargar las asociaciones locales de imágenes: {storageError}</div>}
      {imageError && <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert"><AlertTriangle className="size-5" />{imageError}</div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(16,47,83,0.07)]">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#0d2d55,#1456a0)] p-6 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Importación masiva</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Cargá Excel o CSV de POSBerry</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">El archivo se procesa en este navegador. Nada se envía a un servidor y el catálogo queda disponible solo en este equipo.</p></div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1456a0] shadow-lg transition hover:-translate-y-0.5">
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {loading ? 'Leyendo archivo…' : 'Seleccionar archivo'}
            <input ref={inputRef} type="file" accept=".xlsx,.csv" className="sr-only" disabled={loading} onChange={(event) => void handleFile(event.target.files?.[0])} />
          </label>
        </div>

        {!parsedFile ? (
          <div className="grid gap-5 p-6 sm:grid-cols-3 lg:p-8">
            {[
              ['01', 'Seleccioná', 'Excel .xlsx o CSV con coma, punto y coma o tabulación.'],
              ['02', 'Revisá el mapeo', 'Confirmá qué columna corresponde a cada dato del catálogo.'],
              ['03', 'Validá e importá', 'Revisá válidos, duplicados y errores antes de reemplazar el catálogo local.'],
            ].map(([number, title, description]) => <div key={number} className="rounded-2xl bg-slate-50 p-5"><span className="text-xs font-bold tracking-widest text-[#2581d2]">PASO {number}</span><h3 className="mt-3 font-bold text-[#12355f]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>)}
          </div>
        ) : (
          <div className="space-y-7 p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 font-bold text-[#12355f]"><FileSpreadsheet className="size-5 text-[#2581d2]" />{parsedFile.fileName}</p><p className="mt-1 text-sm text-slate-500">{parsedFile.rows.length.toLocaleString('es-AR')} filas · {parsedFile.headers.length} columnas detectadas</p></div><Button variant="outline" className="rounded-xl" onClick={cancelImport}>Cancelar</Button></div>

            <div>
              <h3 className="font-bold text-[#12355f]">Mapeo de columnas</h3>
              <p className="mt-1 text-sm text-slate-500">Nombre y precio son necesarios para mostrar un producto. Los demás campos son opcionales.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {IMPORT_FIELD_OPTIONS.map((option) => (
                  <label key={option.field} className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="text-xs font-bold text-[#12355f]">{option.label}{option.required && <span className="text-red-600"> *</span>}</span><select className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-[#2581d2]" value={mapping[option.field] ?? ''} onChange={(event) => setMapping((current) => ({ ...current, [option.field]: event.target.value === '' ? null : Number(event.target.value) }))}><option value="">No asignada</option>{parsedFile.headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header}</option>)}</select></label>
                ))}
              </div>
            </div>

            {result && requiredMapped && (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-emerald-700">Válidos</p><p className="mt-1 text-2xl font-bold text-emerald-800">{result.validCount.toLocaleString('es-AR')}</p></div>
                  <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-bold uppercase text-amber-700">Duplicados</p><p className="mt-1 text-2xl font-bold text-amber-800">{result.duplicateCount.toLocaleString('es-AR')}</p></div>
                  <div className="rounded-xl bg-red-50 p-4"><p className="text-xs font-bold uppercase text-red-700">Inválidos</p><p className="mt-1 text-2xl font-bold text-red-800">{result.invalidCount.toLocaleString('es-AR')}</p></div>
                  <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-bold uppercase text-blue-700">Con avisos</p><p className="mt-1 text-2xl font-bold text-blue-800">{result.warningCount.toLocaleString('es-AR')}</p></div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Fila</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Precio</th><th className="px-4 py-3">Observación</th></tr></thead><tbody className="divide-y divide-slate-100">{result.rows.slice(0, 12).map((row) => <tr key={row.sourceRow}><td className="px-4 py-3 text-slate-500">{row.sourceRow}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${row.status === 'valid' ? 'bg-emerald-50 text-emerald-700' : row.status === 'duplicate' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{row.status}</span></td><td className="px-4 py-3 text-slate-600">{row.rawSku || row.rawBarcode || '—'}</td><td className="max-w-72 truncate px-4 py-3 font-semibold text-[#12355f]">{row.rawName || 'Sin nombre'}</td><td className="px-4 py-3 text-slate-600">{row.product ? formatMoney(row.product.price) : row.rawPrice || '—'}</td><td className="max-w-80 truncate px-4 py-3 text-xs text-slate-500">{row.issues.join(' · ') || 'Sin observaciones'}</td></tr>)}</tbody></table>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between"><Button variant="outline" className="rounded-xl" onClick={() => downloadTextFile(buildImportReportCsv(result), 'reporte-importacion-market-mutual.csv')}><Download className="size-4" /> Exportar reporte</Button><Button className="rounded-xl bg-[#1456a0] px-6 hover:bg-[#0d4381]" disabled={saving || result.validCount === 0} onClick={() => void confirmImport()}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Confirmar y reemplazar catálogo local</Button></div>
              </>
            )}

            {!requiredMapped && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">Asigná las columnas de nombre y precio para generar la vista previa.</div>}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(16,47,83,0.05)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2581d2]">Catálogo actual</p><h2 className="mt-2 text-2xl font-bold text-[#12355f]">{source === 'demo' ? 'Datos iniciales de demostración' : source === 'posberry' ? 'Catálogo POSBerry con stock real' : meta?.fileName}</h2><p className="mt-1 text-sm text-slate-500">{source === 'posberry' && meta ? `${meta.validCount.toLocaleString('es-AR')} productos disponibles. Stock: ${meta.stockFileName ?? 'archivo local'}.` : source === 'imported' && meta ? `Importado ${new Date(meta.importedAt).toLocaleString('es-AR')}.` : 'Importá un archivo para reemplazar estos productos en este navegador.'}</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search className="size-4 text-slate-400" /><span className="sr-only">Buscar catálogo</span><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Nombre, SKU, categoría…" /></label>{source === 'imported' && <Button variant="outline" className="rounded-xl border-red-200 text-red-700 hover:bg-red-50" onClick={() => void clearDemoData()}><Trash2 className="size-4" /> Restaurar POSBerry</Button>}</div></div>
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3">Precio</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Imagen</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredProducts.slice(0, 100).map((product) => <tr key={product.id}><td className="px-4 py-3 font-mono text-xs text-slate-500">{product.sku || product.barcode || '—'}</td><td className="max-w-80 truncate px-4 py-3 font-semibold text-[#12355f]">{product.name}</td><td className="px-4 py-3 text-slate-600">{product.category}</td><td className="px-4 py-3 font-semibold text-[#12355f]">{formatMoney(product.price)}</td><td className="px-4 py-3 text-slate-600">{product.stock == null ? 'No informado' : product.stock}</td><td className="px-4 py-3">{isApprovedProductImage(product) ? <span className="text-emerald-700">Aprobada</span> : product.image ? <span className="text-amber-700">No verificada</span> : <span className="text-slate-500">Placeholder</span>}</td></tr>)}</tbody></table></div>
        {filteredProducts.length > 100 && <p className="mt-3 text-xs text-slate-500">Mostrando 100 de {filteredProducts.length.toLocaleString('es-AR')} resultados. Usá la búsqueda para acotar el catálogo.</p>}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(16,47,83,0.05)] sm:p-7" aria-labelledby="image-review-heading">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2581d2]">Lote piloto · 20 productos</p>
          <h2 id="image-review-heading" className="mt-2 text-2xl font-bold text-[#12355f]">Revisión de coincidencias</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            Las imágenes no se asocian automáticamente solo por tener un código coincidente. Revisá visualmente marca y presentación antes de aprobar.
            Open Food Facts publica las fotos bajo CC BY-SA 3.0; la exactitud y los derechos de elementos gráficos del envase no están garantizados.
          </p>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-5" aria-label="Resultados del lote piloto">
            {[
              { label: 'Consultas procesadas', value: `${imagePilotReport.processed} / 20` },
              { label: 'Candidatas con imagen', value: imagePilotReport.summary.imageCandidates },
              { label: 'Encontrado sin imagen', value: imagePilotReport.summary.productFoundWithoutImage },
              { label: 'Sin coincidencia', value: imagePilotReport.summary.notFound },
              { label: 'Errores de respuesta', value: imagePilotReport.summary.requestErrors },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                <p className="mt-1 font-bold text-[#12355f]">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            La aprobación guarda la URL y su atribución en IndexedDB de este navegador; no descarga ni optimiza un archivo local.
            <a className="ml-1 font-semibold text-[#1456a0] underline" href="https://world.openfoodfacts.org/terms-of-use" target="_blank" rel="noreferrer">Condiciones de reutilización</a>
          </p>
        </div>

        {pendingImageCandidates.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No quedan coincidencias pendientes de este lote.</p>
        ) : (
          <div className="mt-5 divide-y divide-slate-200">
            {pendingImageCandidates.map((candidate) => {
              const product = products.find((item) => item.id === candidate.id)
              const imageUrl = candidateUrls[candidate.id] || candidate.imageUrl
              const verified = verifiedCandidates.includes(candidate.id)
              const busy = reviewingImageId === candidate.id
              return (
                <article key={candidate.id} className="grid gap-4 py-5 sm:grid-cols-[112px_1fr]">
                  <img
                    src={imageUrl}
                    alt={`Candidata de imagen: ${candidate.candidateName}`}
                    loading="lazy"
                    className="aspect-square w-28 rounded-xl border border-slate-200 bg-slate-50 object-contain p-2"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[#12355f]">{product?.name || candidate.productName}</h3>
                        <p className="mt-1 text-xs text-slate-500">SKU {candidate.sku} · EAN {candidate.barcode} · coincidencia {Math.round(candidate.confidence * 100)}%</p>
                      </div>
                      <a className="text-sm font-semibold text-[#1456a0] underline" href={candidate.sourceProductUrl} target="_blank" rel="noreferrer">
                        Ver ficha de Open Food Facts
                      </a>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Candidato: {candidate.candidateName}
                      {candidate.brand ? ` · ${candidate.brand}` : ''}
                      {candidate.quantity ? ` · ${candidate.quantity}` : ''}
                    </p>
                    <label className="mt-3 block text-xs font-semibold text-slate-600">
                      URL de imagen (solo Open Food Facts)
                      <input
                        type="url"
                        value={candidateUrls[candidate.id] ?? candidate.imageUrl}
                        onChange={(event) => setCandidateUrls((current) => ({ ...current, [candidate.id]: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#2581d2]"
                      />
                    </label>
                    <label className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={verified}
                        onChange={(event) => setVerifiedCandidates((current) => event.target.checked
                          ? [...current, candidate.id]
                          : current.filter((id) => id !== candidate.id))}
                        className="mt-1 accent-[#1456a0]"
                      />
                      <span>Verifiqué que la foto corresponde a la marca y presentación de este producto y acepto la atribución CC BY-SA 3.0.</span>
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        className="rounded-xl bg-[#1456a0] hover:bg-[#0d4381]"
                        disabled={!verified || busy}
                        onClick={() => void handleImageReview(candidate, 'approved')}
                      >
                        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        Aprobar imagen
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        disabled={busy}
                        onClick={() => void handleImageReview(candidate, 'rejected')}
                      >
                        <ImageOff className="size-4" />
                        Descartar coincidencia
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
