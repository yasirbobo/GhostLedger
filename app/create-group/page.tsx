import { CreateGroupPageClient } from "@/components/pages/create-group-page-client"
import { requireSessionUser } from "@/lib/auth/require-session-user"

export default async function CreateGroupPage() {
  await requireSessionUser("/create-group")
  return <CreateGroupPageClient />
}
