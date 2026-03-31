import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { canManageAccess } from "@/lib/authz/group-permissions"
import { canAddSeat, getSeatLimitMessage } from "@/lib/billing/limits"
import { getGroupBilling } from "@/lib/billing/store"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import {
  addMemberToGroup,
  getGroup,
  removeMemberAccess,
  updateMemberAccess,
} from "@/lib/repositories/groups"
import {
  inviteMemberSchema,
  removeMemberAccessSchema,
  updateMemberAccessSchema,
} from "@/lib/validation/group"

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to manage group access." },
        { status: 401 }
      )
    }

    const { groupId } = await context.params
    const existingGroup = await getGroup(groupId, user.email)
    if (!canManageAccess(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to manage workspace access." },
        { status: 403 }
      )
    }

    const payload = inviteMemberSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid invite email." },
        { status: 400 }
      )
    }

    const billing = await getGroupBilling(existingGroup)
    if (!canAddSeat(existingGroup, billing.plan)) {
      return NextResponse.json(
        { error: getSeatLimitMessage(billing.plan) },
        { status: 403 }
      )
    }

    const group = await addMemberToGroup(
      groupId,
      payload.data.email,
      user.email,
      payload.data.role
    )
    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to add group member.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to manage group access." },
        { status: 401 }
      )
    }

    const { groupId } = await context.params
    const existingGroup = await getGroup(groupId, user.email)
    if (!canManageAccess(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to manage workspace access." },
        { status: 403 }
      )
    }

    const payload = updateMemberAccessSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid access update." },
        { status: 400 }
      )
    }

    const group = await updateMemberAccess(
      groupId,
      payload.data.email,
      user.email,
      payload.data.role
    )
    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to update group member access.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to manage group access." },
        { status: 401 }
      )
    }

    const { groupId } = await context.params
    const existingGroup = await getGroup(groupId, user.email)
    if (!canManageAccess(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to manage workspace access." },
        { status: 403 }
      )
    }

    const payload = removeMemberAccessSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid access removal request." },
        { status: 400 }
      )
    }

    const group = await removeMemberAccess(groupId, payload.data.email, user.email)
    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to remove group member access.") },
      { status: getErrorStatus(error) }
    )
  }
}
