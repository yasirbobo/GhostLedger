import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { getGroup } from "@/lib/repositories/groups"
import { buildMonthlyReport } from "@/lib/reports/build-monthly-report"

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to export reports." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId") ?? undefined
    const month = searchParams.get("month") ?? undefined
    const group = await getGroup(groupId, user.email)
    const report = buildMonthlyReport(group, month)

    return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to export monthly report.") },
      { status: getErrorStatus(error) }
    )
  }
}
