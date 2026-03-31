"use client"

import { useState } from "react"
import { CalendarClock, Pause, Play, Repeat, Trash2 } from "lucide-react"
import { useGroup } from "@/components/providers/group-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { canRunOperationalJobs } from "@/lib/authz/group-permissions"
import type { RecurringTransaction } from "@/lib/types"

interface RecurringPlansCardProps {
  plans: RecurringTransaction[]
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function RecurringPlansCard({ plans }: RecurringPlansCardProps) {
  const { group, refreshGroup } = useGroup()
  const [isRunning, setIsRunning] = useState(false)
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const canRunJobs = canRunOperationalJobs(group)

  const handleRunDuePlans = async () => {
    setIsRunning(true)
    setMessage(null)

    try {
      const response = await fetch("/api/jobs/recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: group.id }),
      })

      const payload = (await response.json()) as {
        job?: { processedCount: number }
        error?: string
      }

      if (!response.ok || !payload.job) {
        throw new Error(payload.error ?? "Failed to process recurring plans.")
      }

      await refreshGroup()
      setMessage(
        payload.job.processedCount > 0
          ? `${payload.job.processedCount} recurring plan(s) executed.`
          : "No recurring plans were due today."
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to process recurring plans."
      )
    } finally {
      setIsRunning(false)
    }
  }

  const handleTogglePlan = async (planId: string, active: boolean) => {
    setBusyPlanId(planId)
    setMessage(null)

    try {
      const response = await fetch(`/api/group/${group.id}/recurring/${planId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update recurring plan.")
      }

      await refreshGroup()
      setMessage(active ? "Recurring plan resumed." : "Recurring plan paused.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update recurring plan.")
    } finally {
      setBusyPlanId(null)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    setBusyPlanId(planId)
    setMessage(null)

    try {
      const response = await fetch(`/api/group/${group.id}/recurring/${planId}`, {
        method: "DELETE",
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete recurring plan.")
      }

      await refreshGroup()
      setMessage("Recurring plan removed.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete recurring plan.")
    } finally {
      setBusyPlanId(null)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Repeat className="h-4 w-4 text-primary" />
            Recurring Plans
          </CardTitle>
          {canRunJobs ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void handleRunDuePlans()}
              disabled={isRunning}
            >
              <Play className="h-3.5 w-3.5" />
              {isRunning ? "Running..." : "Run due"}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.length > 0 ? (
          plans.slice(0, 4).map((plan) => (
            <div
              key={plan.id}
              className="rounded-lg border border-border bg-secondary/20 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{plan.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.memberName} · {plan.category}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {plan.active ? plan.frequency : `${plan.frequency} paused`}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span
                  className={
                    plan.type === "contribution"
                      ? "font-medium text-primary"
                      : "font-medium text-foreground"
                  }
                >
                  {plan.type === "contribution" ? "+" : "-"}${plan.amount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatDate(plan.nextRunDate)}
                </span>
              </div>
              {canRunJobs ? (
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => void handleTogglePlan(plan.id, !plan.active)}
                    disabled={busyPlanId === plan.id}
                  >
                    {plan.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {plan.active ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-muted-foreground hover:text-destructive"
                    onClick={() => void handleDeletePlan(plan.id)}
                    disabled={busyPlanId === plan.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Recurring plans will appear here once you save a repeating transaction.
          </div>
        )}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  )
}
