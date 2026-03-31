import { SettingsPageClient } from "@/components/pages/settings-page-client"
import { requireSessionUser } from "@/lib/auth/require-session-user"

export default async function SettingsPage() {
  await requireSessionUser("/settings")
  return <SettingsPageClient />
}
