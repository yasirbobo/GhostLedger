import { NextResponse } from "next/server"
import { canRunOperationalJobs } from "@/lib/authz/group-permissions"
import { sendEmail } from "@/lib/email/client"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { getNotificationPreferences } from "@/lib/notification-store"
import { getGroup } from "@/lib/repositories/groups"
import { buildMonthlyReport } from "@/lib/reports/build-monthly-report"

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to run monthly summaries." },
        { status: 401 }
      )
    }

    const payload = (await request.json()) as {
      groupId?: string
      month?: string
      mode?: "preview" | "send"
    }
    const group = await getGroup(payload.groupId, user.email)
    const preferences = await getNotificationPreferences(user.email)
    const report = buildMonthlyReport(group, payload.month)
    const mode = payload.mode === "send" ? "send" : "preview"

    if (mode === "send" && !canRunOperationalJobs(group)) {
      return NextResponse.json(
        { error: "You do not have permission to send monthly summaries." },
        { status: 403 }
      )
    }

    let delivery = {
      emailEnabled: preferences.monthlySummary,
      recipient: user.email,
      delivered: false,
      messageId: null as string | null,
    }

    if (mode === "send" && preferences.monthlySummary) {
      const email = await sendEmail({
        to: user.email,
        subject: `GhostLedger monthly summary for ${report.month}`,
        body: [
          `Workspace: ${report.group.name}`,
          `Month: ${report.month}`,
          `Contributions: $${report.totals.contributions.toLocaleString()}`,
          `Expenses: $${report.totals.expenses.toLocaleString()}`,
          `Net flow: $${report.totals.netFlow.toLocaleString()}`,
          "",
          ...report.highlights,
        ].join("\n"),
      })

      delivery = {
        emailEnabled: true,
        recipient: user.email,
        delivered: true,
        messageId: email.id,
      }
    }

    return NextResponse.json({
      job: {
        type: "monthly-summary",
        status: mode === "send" ? "sent" : "preview",
        generatedAt: new Date().toISOString(),
        delivery,
      },
      report,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to run monthly summary job.") },
      { status: getErrorStatus(error) }
    )
  }
}
