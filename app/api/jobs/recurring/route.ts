import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { canRunOperationalJobs } from "@/lib/authz/group-permissions"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { getGroup, processDueRecurringTransactions } from "@/lib/repositories/groups"

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to run recurring jobs." },
        { status: 401 }
      )
    }

    const payload = (await request.json()) as { groupId?: string; runDate?: string }
    if (!payload.groupId) {
      return NextResponse.json({ error: "groupId is required." }, { status: 400 })
    }

    const group = await getGroup(payload.groupId, user.email)
    if (!canRunOperationalJobs(group)) {
      return NextResponse.json(
        { error: "You do not have permission to run recurring jobs." },
        { status: 403 }
      )
    }

    const result = await processDueRecurringTransactions(
      payload.groupId,
      user.email,
      payload.runDate
    )

    return NextResponse.json({
      job: {
        type: "recurring-transactions",
        status: "completed",
        processedCount: result.processedCount,
        generatedTransactionIds: result.generatedTransactionIds,
        runDate: payload.runDate ?? new Date().toISOString().split("T")[0] ?? "",
      },
      group: result.group,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to process recurring transactions.") },
      { status: getErrorStatus(error) }
    )
  }
}
