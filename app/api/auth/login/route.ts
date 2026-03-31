import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { authenticateUser, createSession } from "@/lib/repositories/auth"
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session"
import { logEvent } from "@/lib/observability/logger"
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit"
import { loginSchema } from "@/lib/validation/auth"

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = consumeRateLimit({
      key: `auth:login:${clientIp}`,
      limit: 10,
      windowMs: 60_000,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please wait a minute and try again." },
        { status: 429 }
      )
    }

    const payload = loginSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid sign-in details." },
        { status: 400 }
      )
    }

    const user = await authenticateUser(payload.data.email, payload.data.password)
    const sessionId = await createSession(user.id)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions)
    logEvent("info", "auth.login.success", {
      email: user.email,
      clientIp,
    })

    return NextResponse.json({ user })
  } catch (error) {
    logEvent("warn", "auth.login.failed", {
      clientIp: getClientIp(request),
      message: error instanceof Error ? error.message : "Unable to sign in.",
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sign in." },
      { status: 401 }
    )
  }
}
