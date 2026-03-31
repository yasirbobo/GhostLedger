"use client"

import { useEffect, useState } from "react"
import { CreditCard, Gauge, Rocket, Sparkles, Users } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { useGroup } from "@/components/providers/group-provider"
import { canManageWorkspace } from "@/lib/authz/group-permissions"
import type { BillingPlan, GroupBilling } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BillingPlanDefinition {
  id: BillingPlan
  name: string
  description: string
  priceMonthly: number
  highlights: string[]
}

const planIcons = {
  starter: Sparkles,
  growth: Rocket,
  scale: Gauge,
}

export function BillingPageClient() {
  const { group } = useGroup()
  const [billing, setBilling] = useState<GroupBilling | null>(null)
  const [plans, setPlans] = useState<BillingPlanDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadBilling() {
      try {
        const response = await fetch(`/api/billing?groupId=${encodeURIComponent(group.id)}`)
        const payload = (await response.json()) as {
          billing?: GroupBilling
          plans?: BillingPlanDefinition[]
          error?: string
        }

        if (!response.ok || !payload.billing || !payload.plans) {
          throw new Error(payload.error ?? "Failed to load billing.")
        }

        if (mounted) {
          setBilling(payload.billing)
          setPlans(payload.plans)
        }
      } catch (error) {
        if (mounted) {
          setMessage(error instanceof Error ? error.message : "Failed to load billing.")
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadBilling()

    return () => {
      mounted = false
    }
  }, [group.id])

  const handlePlanChange = async (plan: BillingPlan) => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/billing", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: group.id, plan }),
      })

      const payload = (await response.json()) as {
        billing?: GroupBilling
        plans?: BillingPlanDefinition[]
        error?: string
      }

      if (!response.ok || !payload.billing || !payload.plans) {
        throw new Error(payload.error ?? "Failed to update plan.")
      }

      setBilling(payload.billing)
      setPlans(payload.plans)
      setMessage(`Workspace moved to the ${payload.billing.plan} plan.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update plan.")
    } finally {
      setIsSaving(false)
    }
  }

  const canManageBilling = canManageWorkspace(group)

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Billing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the plan that matches your team size and operating complexity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4">
          {plans.map((plan) => {
            const Icon = planIcons[plan.id]
            const isCurrent = billing?.plan === plan.id

            return (
              <Card
                key={plan.id}
                className={`border-border bg-card ${isCurrent ? "ring-1 ring-primary/40" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                          {plan.name}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-foreground">
                        ${plan.priceMonthly}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        per month
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {plan.highlights.map((highlight) => (
                      <Badge key={highlight} variant="outline">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                  {canManageBilling ? (
                    <Button
                      type="button"
                      variant={isCurrent ? "secondary" : "default"}
                      disabled={isSaving || isCurrent}
                      onClick={() => void handlePlanChange(plan.id)}
                    >
                      {isCurrent ? "Current plan" : `Switch to ${plan.name}`}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Owners and admins can update workspace billing.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                Current plan
              </CardTitle>
              <CardDescription>
                Real billing rails can replace this local plan state later without changing the product surface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {billing ? (
                <>
                  <div className="rounded-lg border border-border bg-secondary/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Workspace
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">{group.name}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge>{billing.plan}</Badge>
                      <Badge variant="outline">{billing.status}</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Renewal
                    </p>
                    <p className="mt-2 text-sm text-foreground">{billing.renewalDate}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      ${billing.priceMonthly}/month
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  {isLoading ? "Loading billing..." : "Billing data is unavailable."}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Usage snapshot
              </CardTitle>
              <CardDescription>
                Seat and automation usage compared with the active plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {billing ? (
                <>
                  <UsageRow
                    label="Seats"
                    value={billing.usage.seats}
                    limit={billing.limits.maxSeats}
                  />
                  <UsageRow
                    label="Pending invites"
                    value={billing.usage.pendingInvites}
                    limit={billing.limits.maxPendingInvites}
                  />
                  <UsageRow
                    label="Recurring plans"
                    value={billing.usage.recurringPlans}
                    limit={billing.limits.maxRecurringPlans}
                  />
                  <UsageRow
                    label="Transactions"
                    value={billing.usage.transactions}
                    limit={null}
                  />
                </>
              ) : (
                <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  Usage will appear here once billing loads.
                </div>
              )}
              {message ? (
                <p className="text-sm text-muted-foreground">{message}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

function UsageRow({
  label,
  value,
  limit,
}: {
  label: string
  value: number
  limit: number | null
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-4 py-3">
      <p className="text-sm text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground">
        {value}
        {limit === null ? " / unlimited" : ` / ${limit}`}
      </p>
    </div>
  )
}
