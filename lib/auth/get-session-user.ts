import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME } from "@/lib/auth/session"
import { getUserBySession } from "@/lib/repositories/auth"

export async function getSessionUser() {
  const cookieStore = await cookies()
  return getUserBySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}
