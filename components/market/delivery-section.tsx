import { Clock3, MapPin, Truck } from 'lucide-react'

export function DeliverySection() {
  return (
    <section className="bg-[#e7f2fc] py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between lg:px-8">
        <div><h2 className="text-2xl font-bold text-[#12355f]">Recibí tu pedido</h2><p className="mt-2 text-sm text-slate-600">Hacé tu compra online y coordinamos el envío directamente con vos.</p></div>
        <div className="flex flex-wrap gap-5 text-sm font-semibold text-[#12355f]"><span className="flex items-center gap-2"><Truck className="text-[#2581d2]" /> Zona norte: $40.000</span><span className="flex items-center gap-2"><MapPin className="text-[#2581d2]" /> Zona sur: $60.000</span><span className="flex items-center gap-2"><Clock3 className="text-[#2581d2]" /> 09:00 a 16:30</span></div>
      </div>
    </section>
  )
}