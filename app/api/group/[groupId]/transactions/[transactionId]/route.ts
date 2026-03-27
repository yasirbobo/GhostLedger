import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession, SESSION_COOKIE_NAME } from "@/lib/auth-store"
import { deleteTransaction } from "@/lib/group-store"

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ groupId: string; transactionId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const user = await getUserBySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update a group." },
        { status: 401 }
      )
    }

    const { groupId, transactionId } = await context.params
    const group = await deleteTransaction(groupId, transactionId, user.email)

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete transaction." },
      { status: 500 }
    )
  }
}
