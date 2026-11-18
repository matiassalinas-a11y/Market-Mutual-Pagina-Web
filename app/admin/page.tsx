import { AdminCatalog } from '@/components/admin/admin-catalog'
import { localAdminEnabled } from '@/lib/admin/catalog-repository'
export const metadata = {
  title: 'Administración | Market Mutual',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'
export default function AdminPage() {
  return <AdminCatalog localMode={localAdminEnabled()} />
}
