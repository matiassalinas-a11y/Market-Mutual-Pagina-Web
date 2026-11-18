import { catalogRepository } from '@/lib/admin/catalog-repository'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const snapshot = await catalogRepository().read()
    // The shop never renders inventory quantities. In a central adapter, return a
    // public projection and validate inventory again in server-side checkout.
    return Response.json(
      {
        revision: snapshot.revision,
        products: snapshot.products.filter(
          (p) => p.available && p.stock != null && p.stock > 0,
        ),
        families: snapshot.families,
        flyers: snapshot.flyers ?? [],
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return Response.json(
      { error: 'No pudimos cargar el catálogo. Volvé a intentarlo.' },
      { status: 503 },
    )
  }
}
