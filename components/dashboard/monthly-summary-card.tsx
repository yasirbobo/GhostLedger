"use client"

import { FileText, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Group } from "@/lib/types"
import { buildMonthlyReport } from "@/lib/reports/build-monthly-report"

interface MonthlySummaryCardProps {
  group: Group
}

function formatMonth(month: string) {
  const [year, numericMonth] = month.split("-")
  return new Date(Number(year), Number(numericMonth) - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  })
}

export function MonthlySummaryCard({ group }: MonthlySummaryCardProps) {
  const report = buildMonthlyReport(group)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Monthly Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{formatMonth(report.month)}</p>
            <p className="text-2xl font-semibold text-foreground">
              ${report.totals.expenses.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              spent across {report.totals.transactions} transaction(s)
            </p>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              report.totals.netFlow >= 0 ? "bg-primary/10" : "bg-destructive/10"
            }`}
          >
            {report.totals.netFlow >= 0 ? (
              <TrendingUp className="h-5 w-5 text-primary" />
            ) : (
              <TrendingDown className="h-5 w-5 text-destructive" />
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Net flow
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              ${report.totals.netFlow.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Top category
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {report.topCategory?.name ?? "No spend"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {report.highlights.map((highlight) => (
            <p key={highlight} className="text-sm text-muted-foreground">
              {highlight}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
