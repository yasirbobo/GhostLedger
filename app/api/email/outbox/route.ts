import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { listEmails } from "@/lib/email/client"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to view the outbox." },
      { status: 401 }
    )
  }

  const messages = await listEmails()
  return NextResponse.json({ messages })
}
