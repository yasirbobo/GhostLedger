import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { canCreateTransactions } from "@/lib/authz/group-permissions"
import { canCreateRecurringPlan, getRecurringLimitMessage } from "@/lib/billing/limits"
import { getGroupBilling } from "@/lib/billing/store"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { addTransaction, getGroup } from "@/lib/repositories/groups"
import { addTransactionSchema } from "@/lib/validation/group"

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser()
    const { groupId } = await context.params

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update a group." },
        { status: 401 }
      )
    }

    const payload = addTransactionSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid transaction payload." },
        { status: 400 }
      )
    }

    const existingGroup = await getGroup(groupId, user.email)
    if (!canCreateTransactions(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to add transactions." },
        { status: 403 }
      )
    }

    if (payload.data.recurrence) {
      const billing = await getGroupBilling(existingGroup)
      if (!canCreateRecurringPlan(existingGroup, billing.plan)) {
        return NextResponse.json(
          { error: getRecurringLimitMessage(billing.plan) },
          { status: 403 }
        )
      }
    }

    const group = await addTransaction(groupId, payload.data, user.email)

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to add transaction.") },
      { status: getErrorStatus(error) }
    )
  }
}
