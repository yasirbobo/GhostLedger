import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { canManageWorkspace } from "@/lib/authz/group-permissions"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { getGroup, updateGroup } from "@/lib/repositories/groups"
import { updateGroupSchema } from "@/lib/validation/group"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update a group." },
        { status: 401 }
      )
    }

    const payload = updateGroupSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid group details." },
        { status: 400 }
      )
    }

    const { groupId } = await context.params
    const existingGroup = await getGroup(groupId, user.email)
    if (!canManageWorkspace(existingGroup)) {
      return NextResponse.json(
        { error: "You do not have permission to update this workspace." },
        { status: 403 }
      )
    }

    const group = await updateGroup(groupId, payload.data, user.email)

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to update group.") },
      { status: getErrorStatus(error) }
    )
  }
}
