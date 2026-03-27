"use client"

import { AppShell } from "@/components/layout/app-shell"
import { AIAnalyst } from "@/components/dashboard/ai-analyst"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGroup } from "@/components/providers/group-provider"
import {
  getAverageContribution,
  getContributionFairness,
  getInsights,
  getSettlementPositions,
  getSpendingCategories,
  getTotalContributions,
  getTotalExpenses,
} from "@/lib/group-analytics"
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react"

export default function InsightsPage() {
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Insights
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered financial analysis and smart insights
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Contributions</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  ${totalContributions.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  ${totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Team Members</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {group.members.length}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <Users className="h-5 w-5 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Contribution</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  ${avgContribution.toLocaleString()}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                <DollarSign className="h-5 w-5 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Analyst - Full width on mobile, half on desktop */}
        <div className="lg:col-span-2">
          <AIAnalyst />
        </div>

        {/* Smart Insights */}
        <InsightsPanel insights={insights} />

        {/* Spending Chart */}
        <SpendingChart categories={categories} />
      </div>

      <Card className="mt-6 border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Settlement Positions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {settlementPositions.map(({ member, netPosition, status, equalExpenseShare }) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  Equal expense share: ${equalExpenseShare.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
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
                <p className="text-xs text-muted-foreground">
                  Based on equal sharing of current expenses
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contribution Fairness Analysis */}
      <Card className="mt-6 border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Contribution Fairness Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fairness.map(({ member, percentage, fairShare, isOverContributing, isUnderContributing }) => {
              return (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                        {member.avatar}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {member.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        ${member.contribution.toLocaleString()}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isOverContributing
                            ? "text-primary"
                            : isUnderContributing
                            ? "text-warning"
                            : "text-muted-foreground"
                        }`}
                      >
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
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
                    <div
                      className="h-4 w-px bg-foreground/50"
                      style={{ marginLeft: `calc(${fairShare}% - 2px)` }}
                      title="Fair share marker"
                    />
                  </div>
                </div>
              )
            })}
            <p className="mt-4 text-xs text-muted-foreground">
              The vertical line indicates the fair share threshold ({group.members.length > 0 ? (100 / group.members.length).toFixed(1) : "0.0"}% per member).
              Green bars indicate over-contribution, yellow indicates under-contribution.
            </p>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  )
}
