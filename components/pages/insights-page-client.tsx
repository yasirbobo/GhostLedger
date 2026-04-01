"use client"

import { DollarSign, TrendingDown, TrendingUp, Users } from "lucide-react"
import { AIAnalyst } from "@/components/dashboard/ai-analyst"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { MonthlySummaryCard } from "@/components/dashboard/monthly-summary-card"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { useGroup } from "@/components/providers/group-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getAverageContribution,
  getContributionFairness,
  getInsights,
  getSettlementPositions,
  getSpendingCategories,
  getTotalContributions,
  getTotalExpenses,
} from "@/lib/group-analytics"

export function InsightsPageClient() {
  const { group } = useGroup()
  const totalContributions = getTotalContributions(group)
  const totalExpenses = getTotalExpenses(group)
  const avgContribution = getAverageContribution(group)
  const fairness = getContributionFairness(group)
  const settlementPositions = getSettlementPositions(group)
  const insights = getInsights(group)
  const categories = getSpendingCategories(group)

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Analysis workspace"
          title="Insights"
          description="Move from raw transactions to a confident read on spending patterns, fairness, and what the team should pay attention to next."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InsightMetric
            label="Total contributions"
            value={`$${totalContributions.toLocaleString()}`}
            hint="Capital added to the workspace"
            icon={TrendingUp}
          />
          <InsightMetric
            label="Total expenses"
            value={`$${totalExpenses.toLocaleString()}`}
            hint="Spend recorded so far"
            icon={TrendingDown}
          />
          <InsightMetric
            label="Team members"
            value={String(group.members.length)}
            hint="Active contributors and viewers"
            icon={Users}
          />
          <InsightMetric
            label="Average contribution"
            value={`$${avgContribution.toLocaleString()}`}
            hint="Mean contribution per member"
            icon={DollarSign}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <AIAnalyst />
            <div className="grid gap-6 lg:grid-cols-2">
              <MonthlySummaryCard group={group} />
              <InsightsPanel insights={insights} />
            </div>
          </div>
          <SpendingChart categories={categories} />
        </div>

        <Card className="section-card border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Settlement positions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-0">
            {settlementPositions.map(({ member, netPosition, status, equalExpenseShare }) => (
              <div
                key={member.id}
                className="section-card flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-medium text-foreground">{member.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Equal expense share: $
                    {equalExpenseShare.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p
                    className={`text-base font-semibold ${
                      netPosition > 0
                        ? "text-primary"
                        : netPosition < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {status === "settled"
                      ? "Settled"
                      : `${status} $${Math.abs(netPosition).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}`}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Based on equal sharing of current expenses
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="section-card border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">
              Contribution fairness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            {fairness.map(
              ({ member, percentage, fairShare, isOverContributing, isUnderContributing }) => (
                <div key={member.id} className="section-card px-5 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-base font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Contributed ${member.contribution.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        isOverContributing
                          ? "text-primary"
                          : isUnderContributing
                            ? "text-warning"
                            : "text-muted-foreground"
                      }`}
                    >
                      {percentage.toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverContributing
                            ? "bg-primary"
                            : isUnderContributing
                              ? "bg-warning"
                              : "bg-muted-foreground"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fair share marker: {fairShare.toFixed(1)}% of team contribution load.
                    </p>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function InsightMetric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: typeof TrendingUp
}) {
  return (
    <div className="section-card px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-2xl bg-primary/12 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  )
}
