import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth/get-session-user"

export async function requireSessionUser(nextPath: string) {
  const user = await getSessionUser()

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(nextPath)}`)
  }

  return user
}
