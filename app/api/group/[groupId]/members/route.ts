import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession, SESSION_COOKIE_NAME } from "@/lib/auth-store"
import { addMemberToGroup } from "@/lib/group-store"

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const user = await getUserBySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to manage group access." },
        { status: 401 }
      )
    }

    const { groupId } = await context.params
    const body = (await request.json()) as { email?: string }
    const email = body.email?.trim() ?? ""

    if (!email) {
      return NextResponse.json(
        { error: "Invite email is required." },
        { status: 400 }
      )
    }

    const group = await addMemberToGroup(groupId, email, user.email)
    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add group member." },
      { status: 500 }
    )
  }
}
