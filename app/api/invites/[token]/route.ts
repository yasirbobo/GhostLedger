import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import {
  acceptInvite,
  getInvite,
  resendInvite,
  revokeInvite,
} from "@/lib/repositories/invites"

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params
    const invite = await getInvite(token)

    if (!invite) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 })
    }

    return NextResponse.json({ invite })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to load invite.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to accept an invite." },
        { status: 401 }
      )
    }

    const { token } = await context.params
    const group = await acceptInvite(token, user.email)

    return NextResponse.json({ group })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to accept invite.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to manage invites." },
        { status: 401 }
      )
    }

    const { token } = await context.params
    const invite = await resendInvite(token, user.email)

    return NextResponse.json({ invite })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to resend invite.") },
      { status: getErrorStatus(error) }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to manage invites." },
        { status: 401 }
      )
    }

    const { token } = await context.params
    const invite = await revokeInvite(token, user.email)

    return NextResponse.json({ invite })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to revoke invite.") },
      { status: getErrorStatus(error) }
    )
  }
}
