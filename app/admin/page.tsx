import Link from 'next/link'
import { ArrowLeft, FlaskConical, ShieldAlert, ShoppingBag } from 'lucide-react'
import { CatalogImporter } from '@/components/market/catalog-importer'

export default function AdminDemoPage() {
  return (
    <main className="min-h-screen bg-[#f3f7fb] text-[#12243b]">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold tracking-wide text-amber-800">PANEL ADMINISTRATIVO DEMO · SIN AUTENTICACIÓN · DATOS LOCALES</div>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1450px] items-center gap-4 px-4 py-4 lg:px-8"><Link href="/" className="flex items-center gap-2.5" aria-label="Volver a Market Mutual"><span className="flex size-10 items-center justify-center rounded-xl bg-[#1456a0] text-white"><ShoppingBag /></span><span className="font-bold text-[#12355f]">Market <span className="text-[#2581d2]">Mutual</span></span></Link><span className="hidden h-6 w-px bg-slate-200 sm:block" /><span className="hidden text-sm font-semibold text-slate-500 sm:block">Administración de catálogo</span><Link href="/" className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-[#1456a0]"><ArrowLeft className="size-4" /> Volver a la tienda</Link></div>
      </header>

      <div className="mx-auto max-w-[1450px] px-4 py-8 lg:px-8 lg:py-12">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="inline-flex items-center gap-2 rounded-full bg-[#e5f2fd] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#1456a0]"><FlaskConical className="size-4" /> Prototipo funcional</div><h1 className="mt-4 text-3xl font-bold tracking-tight text-[#102f53] sm:text-4xl">Catálogo local de demostración</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">Importá una exportación de POSBerry, revisá la calidad de los datos y mostrala en la tienda sin usar servidores ni credenciales.</p></div><div className="flex max-w-md gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldAlert className="mt-0.5 size-5 shrink-0" /><p>Esta pantalla no tiene autenticación. No debe publicarse ni utilizarse para administrar información comercial real.</p></div></div>
        <CatalogImporter />
      </div>
    </main>
  )
}
