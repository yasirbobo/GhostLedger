import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { getGroup } from "@/lib/repositories/groups"
import { buildTransactionsCsv } from "@/lib/reports/export-transactions-csv"

function sanitizeFileName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to export ledger data." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId") ?? undefined
    const group = await getGroup(groupId, user.email)
    const csv = buildTransactionsCsv(group)
    const fileName = `${sanitizeFileName(group.name || "ghostledger")}-transactions.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to export transactions.") },
      { status: getErrorStatus(error) }
    )
  }
}
