import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySession, SESSION_COOKIE_NAME } from "@/lib/auth-store"
import { createGroup, getGroup } from "@/lib/group-store"
import type { CreateGroupInput } from "@/lib/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId") ?? undefined
    const cookieStore = await cookies()
    const user = await getUserBySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
    const group = await getGroup(groupId, user?.email)

    return NextResponse.json({ group })
  } catch {
    return NextResponse.json(
      { error: "Unable to load group." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const user = await getUserBySession(cookieStore.get(SESSION_COOKIE_NAME)?.value)
    const body = (await request.json()) as Partial<CreateGroupInput>
    const name = body.name?.trim() ?? ""
    const memberNames =
      body.memberNames?.map((memberName) => memberName.trim()).filter(Boolean) ?? []
    const budgetMonthly =
      typeof body.budgetMonthly === "number" && Number.isFinite(body.budgetMonthly)
        ? body.budgetMonthly
        : 0

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to create a group." },
        { status: 401 }
      )
    }

    if (!name || memberNames.length === 0) {
      return NextResponse.json(
        { error: "Group name and at least one member are required." },
        { status: 400 }
      )
    }

    const group = await createGroup({
      name,
      memberNames,
      budgetMonthly,
    }, user.email)

    return NextResponse.json({ group }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Unable to create group." },
      { status: 500 }
    )
  }
}
