import { DashboardPageClient } from "@/components/pages/dashboard-page-client"
import { requireSessionUser } from "@/lib/auth/require-session-user"

export default async function DashboardPage() {
  await requireSessionUser("/dashboard")
  return <DashboardPageClient />
}
