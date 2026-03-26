"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "lucide-react"
import type { SpendingCategory } from "@/lib/types"

interface SpendingChartProps {
  categories: SpendingCategory[]
}

export function SpendingChart({ categories }: SpendingChartProps) {
  const total = categories.reduce((sum, cat) => sum + cat.amount, 0)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <PieChart className="h-4 w-4 text-primary" />
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual bar chart */}
        <div className="flex h-4 w-full overflow-hidden rounded-full">
          {categories.map((category, index) => (
            <div
              key={category.name}
              className="h-full transition-all"
              style={{
                width: `${category.percentage}%`,
                backgroundColor: category.color,
                marginLeft: index > 0 ? "2px" : "0",
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <div key={category.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground truncate">
                    {category.name}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {category.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="rounded-lg border border-border bg-secondary/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Spending</span>
            <span className="text-lg font-bold text-foreground">
              ${total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
