import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  createSession,
  createUser,
  isValidEmail,
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
      name?: string
      email?: string
      password?: string
    }
    const name = body.name?.trim() ?? ""
    const email = body.email?.trim() ?? ""
    const password = body.password ?? ""

    if (!name || !isValidEmail(email) || password.length < 8) {
      return NextResponse.json(
        { error: "Enter a name, valid email, and password with at least 8 characters." },
        { status: 400 }
      )
    }

    const user = await createUser({ name, email, password })
    const sessionId = await createSession(user.id)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, cookieOptions)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create account." },
      { status: 500 }
    )
  }
}
