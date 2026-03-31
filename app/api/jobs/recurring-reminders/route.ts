import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import { canRunOperationalJobs } from "@/lib/authz/group-permissions"
import { sendEmail } from "@/lib/email/client"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { getNotificationPreferences } from "@/lib/notification-store"
import { getGroup } from "@/lib/repositories/groups"

export async function POST(request: Request) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to run recurring reminders." },
        { status: 401 }
      )
    }

    const payload = (await request.json()) as {
      groupId?: string
      runDate?: string
      mode?: "preview" | "send"
    }
    const group = await getGroup(payload.groupId, user.email)
    const preferences = await getNotificationPreferences(user.email)
    const mode = payload.mode === "send" ? "send" : "preview"
    const runDate = payload.runDate ?? new Date().toISOString().split("T")[0] ?? ""
    const upcoming = (group.recurringTransactions ?? []).filter(
      (plan) => plan.active && plan.nextRunDate <= runDate
    )

    let delivery = {
      emailEnabled: preferences.recurringReminders,
      recipient: user.email,
      delivered: false,
      messageId: null as string | null,
    }

    if (mode === "send" && !canRunOperationalJobs(group)) {
      return NextResponse.json(
        { error: "You do not have permission to send recurring reminders." },
        { status: 403 }
      )
    }

    if (mode === "send" && preferences.recurringReminders && upcoming.length > 0) {
      const email = await sendEmail({
        to: user.email,
        subject: `GhostLedger recurring reminders for ${group.name}`,
        body: [
          `Workspace: ${group.name}`,
          `Due plans: ${upcoming.length}`,
          "",
          ...upcoming.map(
            (plan) =>
              `${plan.description} · ${plan.frequency} · next run ${plan.nextRunDate} · $${plan.amount.toLocaleString()}`
          ),
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
        type: "recurring-reminders",
        status: mode === "send" ? "sent" : "preview",
        generatedAt: new Date().toISOString(),
        dueCount: upcoming.length,
        delivery,
      },
      plans: upcoming,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to run recurring reminders.") },
      { status: getErrorStatus(error) }
    )
  }
}
