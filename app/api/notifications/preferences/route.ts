import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notification-store"
import { notificationPreferencesSchema } from "@/lib/validation/notifications"

export async function GET() {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to view notification preferences." },
        { status: 401 }
      )
    }

    const preferences = await getNotificationPreferences(user.email)
    return NextResponse.json({ preferences })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to load notification preferences.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update notification preferences." },
        { status: 401 }
      )
    }

    const payload = notificationPreferencesSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid notification preferences." },
        { status: 400 }
      )
    }

    const preferences = await updateNotificationPreferences(user.email, payload.data)
    return NextResponse.json({ preferences })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to update notification preferences.") },
      { status: getErrorStatus(error) }
    )
  }
}
