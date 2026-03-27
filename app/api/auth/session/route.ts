import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession, SESSION_COOKIE_NAME } from "@/lib/auth-store"

export async function GET() {
  const cookieStore = await cookies()
  const user = await getUserBySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
  return NextResponse.json({ user })
}
