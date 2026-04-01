"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  CalendarClock,
  Mail,
  ShieldAlert,
  Building2,
  FileText,
  Send,
} from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { useAuth } from "@/components/providers/auth-provider"
import { useGroup } from "@/components/providers/group-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { NotificationPreferences } from "@/lib/types"
import type { EmailMessage } from "@/lib/email/client"

const defaultPreferences: NotificationPreferences = {
  monthlySummary: true,
  budgetAlerts: true,
  recurringReminders: true,
  inviteUpdates: true,
}

const preferenceItems = [
  {
    key: "monthlySummary" as const,
    title: "Monthly summary",
    description: "Receive a monthly finance digest with spend, contributions, and budget status.",
    icon: Mail,
  },
  {
    key: "budgetAlerts" as const,
    title: "Budget alerts",
    description: "Get notified when the team is close to or over the configured monthly budget.",
    icon: ShieldAlert,
  },
  {
    key: "recurringReminders" as const,
    title: "Recurring reminders",
    description: "Stay ahead of scheduled recurring contributions and expenses.",
    icon: CalendarClock,
  },
  {
    key: "inviteUpdates" as const,
    title: "Invite updates",
    description: "Be notified when access invites are accepted or need attention.",
    icon: Bell,
  },
]

export function SettingsPageClient() {
  const { user } = useAuth()
  const { group, updateGroup } = useGroup()
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const [groupName, setGroupName] = useState("")
  const [budgetMonthly, setBudgetMonthly] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)
  const [summaryPreview, setSummaryPreview] = useState<string | null>(null)
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null)
  const [outbox, setOutbox] = useState<EmailMessage[]>([])
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setGroupName(group.name)
    setBudgetMonthly(String(group.budgetMonthly))
  }, [group.name, group.budgetMonthly])

  useEffect(() => {
    let mounted = true

    async function loadPreferences() {
      try {
        const response = await fetch("/api/notifications/preferences")
        const payload = (await response.json()) as {
          preferences?: NotificationPreferences
          error?: string
        }

        if (!response.ok || !payload.preferences) {
          throw new Error(payload.error ?? "Failed to load preferences")
        }

        if (mounted) {
          setPreferences(payload.preferences)
        }
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : "Failed to load preferences")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPreferences()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadOutbox() {
      try {
        const response = await fetch("/api/email/outbox")
        const payload = (await response.json()) as {
          messages?: EmailMessage[]
        }

        if (mounted && payload.messages) {
          setOutbox(payload.messages)
        }
      } catch {
        // Outbox is non-blocking for settings.
      }
    }

    void loadOutbox()

    return () => {
      mounted = false
    }
  }, [])

  const updatePreference = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const nextPreferences = {
      ...preferences,
      [key]: value,
    }

    setPreferences(nextPreferences)
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextPreferences),
      })

      const payload = (await response.json()) as {
        preferences?: NotificationPreferences
        error?: string
      }

      if (!response.ok || !payload.preferences) {
        throw new Error(payload.error ?? "Failed to save preferences")
      }

      setPreferences(payload.preferences)
      setMessage("Notification preferences updated.")
    } catch (error) {
      setPreferences(preferences)
      setMessage(error instanceof Error ? error.message : "Failed to save preferences")
    } finally {
      setIsSaving(false)
    }
  }

  const handleWorkspaceSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSavingWorkspace(true)
    setMessage(null)

    try {
      await updateGroup({
        name: groupName.trim(),
        budgetMonthly: Number.parseFloat(budgetMonthly) || 0,
      })
      setMessage("Workspace settings updated.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update workspace")
    } finally {
      setIsSavingWorkspace(false)
    }
  }

  const handleSummaryPreview = async () => {
    setMessage(null)

    try {
      const response = await fetch("/api/jobs/monthly-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: group.id }),
      })

      const payload = (await response.json()) as {
        report?: {
          month: string
          totals: { expenses: number; contributions: number; netFlow: number }
        }
        error?: string
      }

      if (!response.ok || !payload.report) {
        throw new Error(payload.error ?? "Failed to preview monthly summary")
      }

      setSummaryPreview(
        `Preview ready for ${payload.report.month}: expenses $${payload.report.totals.expenses.toLocaleString()}, contributions $${payload.report.totals.contributions.toLocaleString()}, net flow $${payload.report.totals.netFlow.toLocaleString()}.`
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to preview monthly summary")
    }
  }

  const handleSummarySend = async () => {
    setMessage(null)
    setDeliveryMessage(null)

    try {
      const response = await fetch("/api/jobs/monthly-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: group.id, mode: "send" }),
      })

      const payload = (await response.json()) as {
        job?: { delivery: { delivered: boolean; messageId: string | null } }
        error?: string
      }

      if (!response.ok || !payload.job) {
        throw new Error(payload.error ?? "Failed to send monthly summary")
      }

      setDeliveryMessage(
        payload.job.delivery.delivered
          ? `Monthly summary queued to local outbox as ${payload.job.delivery.messageId}.`
          : "Monthly summary delivery is disabled by your preferences."
      )
      const outboxResponse = await fetch("/api/email/outbox")
      const outboxPayload = (await outboxResponse.json()) as { messages?: EmailMessage[] }
      if (outboxPayload.messages) {
        setOutbox(outboxPayload.messages)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send monthly summary")
    }
  }

  const handleRecurringReminderSend = async () => {
    setMessage(null)
    setDeliveryMessage(null)

    try {
      const response = await fetch("/api/jobs/recurring-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: group.id, mode: "send" }),
      })

      const payload = (await response.json()) as {
        job?: { dueCount: number; delivery: { delivered: boolean; messageId: string | null } }
        error?: string
      }

      if (!response.ok || !payload.job) {
        throw new Error(payload.error ?? "Failed to send recurring reminders")
      }

      setDeliveryMessage(
        payload.job.delivery.delivered
          ? `Recurring reminder queued with ${payload.job.dueCount} due plan(s).`
          : payload.job.dueCount === 0
            ? "There are no due recurring plans to remind right now."
            : "Recurring reminder delivery is disabled by your preferences."
      )
      const outboxResponse = await fetch("/api/email/outbox")
      const outboxPayload = (await outboxResponse.json()) as { messages?: EmailMessage[] }
      if (outboxPayload.messages) {
        setOutbox(outboxPayload.messages)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send recurring reminders")
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace controls"
        title="Settings"
        description="Manage workspace details, notification preferences, and the delivery workflows that support your finance operations."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="section-card border-0 bg-transparent shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Configure the operational alerts and summaries you want to receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferenceItems.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-secondary/20 p-4"
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[item.key]}
                    onCheckedChange={(checked) => void updatePreference(item.key, checked)}
                    disabled={isLoading || isSaving}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="section-card border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Workspace Settings
              </CardTitle>
              <CardDescription>
                Update the shared finance workspace details for your team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {group.isOwner ? (
                <form onSubmit={handleWorkspaceSave} className="space-y-4">
                  <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Owner controls</p>
                        <p className="text-sm text-muted-foreground">You can rename this workspace and adjust its budget target.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="workspaceName">Workspace name</Label>
                        <Input
                          id="workspaceName"
                          value={groupName}
                          onChange={(event) => setGroupName(event.target.value)}
                          className="border-border bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workspaceBudget">Monthly budget</Label>
                        <Input
                          id="workspaceBudget"
                          type="number"
                          min="0"
                          step="0.01"
                          value={budgetMonthly}
                          onChange={(event) => setBudgetMonthly(event.target.value)}
                          className="border-border bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingWorkspace || !groupName.trim()}
                    className="w-full"
                  >
                    {isSavingWorkspace ? "Saving..." : "Save workspace settings"}
                  </Button>
                </form>
              ) : (
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
                  Only the workspace owner can update shared settings.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="section-card border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Account Snapshot
              </CardTitle>
              <CardDescription>
                Current session and delivery context for this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Signed in as</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user?.name ?? "Unknown user"}</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? "No active session"}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
                Delivery infrastructure is currently local and file-backed. These preferences are ready for future email jobs and notification pipelines.
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => void handleSummaryPreview()}
              >
                <FileText className="h-4 w-4" />
                Preview monthly summary
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => void handleSummarySend()}
              >
                <Send className="h-4 w-4" />
                Send monthly summary
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => void handleRecurringReminderSend()}
              >
                <CalendarClock className="h-4 w-4" />
                Send recurring reminders
              </Button>
              {summaryPreview ? (
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
                  {summaryPreview}
                </div>
              ) : null}
              {deliveryMessage ? (
                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground">
                  {deliveryMessage}
                </div>
              ) : null}
              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Local outbox
                </p>
                <div className="mt-3 space-y-2">
                  {outbox.length > 0 ? (
                    outbox.slice(0, 3).map((email) => (
                      <div key={email.id} className="rounded-xl border border-border/70 bg-background px-3 py-2">
                        <p className="text-sm font-medium text-foreground">{email.subject}</p>
                        <p className="text-xs text-muted-foreground">{email.to}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No delivered messages yet.
                    </p>
                  )}
                </div>
              </div>
              {message ? (
                <p className="text-sm text-muted-foreground">{message}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppShell>
  )
}
