"use client"

import { AlertTriangle, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getBudgetStatus } from "@/lib/group-analytics"
import type { Group } from "@/lib/types"

interface BudgetProgressCardProps {
  group: Group
}

export function BudgetProgressCard({ group }: BudgetProgressCardProps) {
  const budget = getBudgetStatus(group)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Target className="h-4 w-4 text-primary" />
          Budget Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Monthly budget</p>
            <p className="text-2xl font-semibold text-foreground">
              ${group.budgetMonthly.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Spent</p>
            <p className="text-2xl font-semibold text-foreground">
              ${budget.spent.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className="font-medium text-foreground">{budget.percentUsed}%</span>
          </div>
          <Progress
            value={budget.percentUsed}
            className={budget.isOverBudget ? "[&_[data-slot=progress-indicator]]:bg-destructive" : undefined}
          />
        </div>

        {budget.isOverBudget ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Budget exceeded</p>
                <p className="text-sm text-muted-foreground">
                  Spending is ${Math.abs(budget.variance).toLocaleString()} over the monthly target.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-sm font-medium text-foreground">
              ${budget.remaining.toLocaleString()} remains this month.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep spend inside this range to stay on plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
