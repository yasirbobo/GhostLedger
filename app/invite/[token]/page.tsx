import { InvitePageClient } from "@/components/pages/invite-page-client"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { getInvite } from "@/lib/repositories/invites"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [invite, user] = await Promise.all([
    getInvite(token),
    getSessionUser(),
  ])

  return (
    <InvitePageClient
      token={token}
      invite={invite}
      currentUserEmail={user?.email ?? null}
    />
  )
}
