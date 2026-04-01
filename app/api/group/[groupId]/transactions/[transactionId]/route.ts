import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { canModifyTransactions } from "@/lib/authz/group-permissions"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { deleteTransaction, getGroup, updateTransaction } from "@/lib/repositories/groups"
import { updateTransactionSchema } from "@/lib/validation/group"

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ groupId: string; transactionId: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update a group." },
        { status: 401 }
      )
    }

    const { groupId, transactionId } = await context.params
    const existingGroup = await getGroup(groupId, user.email)
    if (!canModifyTransactions(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to delete transactions." },
        { status: 403 }
      )
    }

    const group = await deleteTransaction(groupId, transactionId, user.email)

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to delete transaction.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ groupId: string; transactionId: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update a group." },
        { status: 401 }
      )
    }

    const payload = updateTransactionSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid transaction payload." },
        { status: 400 }
      )
    }

    const { groupId, transactionId } = await context.params
    const existingGroup = await getGroup(groupId, user.email)
    if (!canModifyTransactions(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to update transactions." },
        { status: 403 }
      )
    }

    const group = await updateTransaction(groupId, transactionId, payload.data, user.email)

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to update transaction.") },
      { status: getErrorStatus(error) }
    )
  }
}
