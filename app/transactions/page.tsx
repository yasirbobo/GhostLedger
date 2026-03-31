import { TransactionsPageClient } from "@/components/pages/transactions-page-client"
import { requireSessionUser } from "@/lib/auth/require-session-user"

export default async function TransactionsPage() {
  await requireSessionUser("/transactions")
  return <TransactionsPageClient />
}
