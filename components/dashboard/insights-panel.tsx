"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Info, CheckCircle, Lightbulb } from "lucide-react"
import type { Insight } from "@/lib/types"

interface InsightsPanelProps {
  insights: Insight[]
}

const iconMap = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

const colorMap = {
  warning: {
    bg: "bg-warning/10",
    border: "border-warning/30",
    icon: "text-warning",
    title: "text-warning",
  },
  info: {
    bg: "bg-chart-2/10",
    border: "border-chart-2/30",
    icon: "text-chart-2",
    title: "text-chart-2",
  },
  success: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: "text-primary",
    title: "text-primary",
  },
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Lightbulb className="h-4 w-4 text-primary" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const Icon = iconMap[insight.type]
          const colors = colorMap[insight.type]

          return (
            <div
              key={insight.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${colors.bg} ${colors.border}`}
            >
              <div className={`mt-0.5 ${colors.icon}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${colors.title}`}>
                  {insight.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {insight.message}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
