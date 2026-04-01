import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createSession, createUser } from "@/lib/repositories/auth"
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { logEvent } from "@/lib/observability/logger"
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit"
import { signupSchema } from "@/lib/validation/auth"

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = consumeRateLimit({
      key: `auth:signup:${clientIp}`,
      limit: 5,
      windowMs: 60_000,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many sign-up attempts. Please wait a minute and try again." },
        { status: 429 }
      )
    }

    const payload = signupSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid sign-up details." },
        { status: 400 }
      )
    }

    const user = await createUser(payload.data)
    const sessionId = await createSession(user.id)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions)
    logEvent("info", "auth.signup.success", {
      email: user.email,
      clientIp,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    logEvent("warn", "auth.signup.failed", {
      clientIp: getClientIp(request),
      message: getErrorMessage(error, "Unable to create account."),
    })
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to create account.") },
      { status: getErrorStatus(error) }
    )
  }
}
