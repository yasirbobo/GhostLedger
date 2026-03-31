import { NextResponse } from "next/server"
import { canManageWorkspace } from "@/lib/authz/group-permissions"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { getAllBillingPlans, getGroupBilling, updateGroupBillingPlan } from "@/lib/billing/store"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { getGroup } from "@/lib/repositories/groups"
import { updateBillingPlanSchema } from "@/lib/validation/billing"

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to view billing." },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const groupId = url.searchParams.get("groupId")

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required." }, { status: 400 })
    }

    const group = await getGroup(groupId, user.email)
    const billing = await getGroupBilling(group)

    return NextResponse.json({
      billing,
      plans: getAllBillingPlans(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to load billing.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update billing." },
        { status: 401 }
      )
    }

    const payload = updateBillingPlanSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid billing update." },
        { status: 400 }
      )
    }

    const group = await getGroup(payload.data.groupId, user.email)
    if (!canManageWorkspace(group)) {
      return NextResponse.json(
        { error: "You do not have permission to manage billing." },
        { status: 403 }
      )
    }

    const billing = await updateGroupBillingPlan(group, payload.data.plan)

    return NextResponse.json({
      billing,
      plans: getAllBillingPlans(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to update billing.") },
      { status: getErrorStatus(error) }
    )
  }
}
