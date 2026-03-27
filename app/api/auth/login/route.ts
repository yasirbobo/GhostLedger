import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  authenticateUser,
  createSession,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-store"

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }
    const email = body.email?.trim() ?? ""
    const password = body.password ?? ""

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)
    const sessionId = await createSession(user.id)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, cookieOptions)

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sign in." },
      { status: 401 }
    )
  }
}
