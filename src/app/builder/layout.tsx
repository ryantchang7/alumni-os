import { requireFounderOr404 } from '@/lib/auth/founder-page-gate'

export default async function BuilderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireFounderOr404()
  return <>{children}</>
}
