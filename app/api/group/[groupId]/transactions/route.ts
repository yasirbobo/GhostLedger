import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession, SESSION_COOKIE_NAME } from "@/lib/auth-store"
import { addTransaction } from "@/lib/group-store"
import type { AddTransactionInput } from "@/lib/types"

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const user = await getUserBySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
    const { groupId } = await context.params
    const body = (await request.json()) as Partial<AddTransactionInput>

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update a group." },
        { status: 401 }
      )
    }

    if (
      !body.description?.trim() ||
      typeof body.amount !== "number" ||
      !Number.isFinite(body.amount) ||
      body.amount <= 0 ||
      !body.memberId ||
      !body.memberName ||
      !body.type ||
      !body.category
    ) {
      return NextResponse.json(
        { error: "Transaction payload is incomplete." },
        { status: 400 }
      )
    }

    const group = await addTransaction(groupId, {
      description: body.description.trim(),
      amount: body.amount,
      type: body.type,
      memberId: body.memberId,
      memberName: body.memberName,
      isPrivate: Boolean(body.isPrivate),
      category: body.category,
    }, user.email)

    return NextResponse.json({ group }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Unable to add transaction." },
      { status: 500 }
    )
  }
}
