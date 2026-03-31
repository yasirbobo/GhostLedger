import { InsightsPageClient } from "@/components/pages/insights-page-client"
import { requireSessionUser } from "@/lib/auth/require-session-user"

export default async function InsightsPage() {
  await requireSessionUser("/insights")
  return <InsightsPageClient />
}
