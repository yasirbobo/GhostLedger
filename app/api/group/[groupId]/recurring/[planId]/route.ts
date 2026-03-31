import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { canRunOperationalJobs } from "@/lib/authz/group-permissions"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import {
  deleteRecurringPlan,
  getGroup,
  updateRecurringPlanState,
} from "@/lib/repositories/groups"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ groupId: string; planId: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to manage recurring plans." },
        { status: 401 }
      )
    }

    const { groupId, planId } = await context.params
    const existingGroup = await getGroup(groupId, user.email)
    if (!canRunOperationalJobs(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to manage recurring plans." },
        { status: 403 }
      )
    }

    const payload = (await request.json()) as { active?: boolean }
    if (typeof payload.active !== "boolean") {
      return NextResponse.json(
        { error: "active must be provided as a boolean." },
        { status: 400 }
      )
    }

    const group = await updateRecurringPlanState(groupId, planId, user.email, payload.active)
    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to update recurring plan.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ groupId: string; planId: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to manage recurring plans." },
        { status: 401 }
      )
    }

    const { groupId, planId } = await context.params
    const existingGroup = await getGroup(groupId, user.email)
    if (!canRunOperationalJobs(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to manage recurring plans." },
        { status: 403 }
      )
    }

    const group = await deleteRecurringPlan(groupId, planId, user.email)
    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to delete recurring plan.") },
      { status: getErrorStatus(error) }
    )
  }
}
