import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import {
  createGroup as createRepositoryGroup,
  getGroup as getRepositoryGroup,
} from "@/lib/repositories/groups"
import { createGroupSchema } from "@/lib/validation/group"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId") ?? undefined
    const user = await getSessionUser()
    const group = await getRepositoryGroup(groupId, user?.email)

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to load group.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to create a group." },
        { status: 401 }
      )
    }

    const payload = createGroupSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid group details." },
        { status: 400 }
      )
    }

    const group = await createRepositoryGroup(payload.data, user.email)

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to create group.") },
      { status: getErrorStatus(error) }
    )
  }
}
