import { BillingPageClient } from "@/components/pages/billing-page-client"
import { requireSessionUser } from "@/lib/auth/require-session-user"

export default async function BillingPage() {
  await requireSessionUser("/billing")
  return <BillingPageClient />
}
