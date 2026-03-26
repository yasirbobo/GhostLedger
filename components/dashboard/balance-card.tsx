"use client"

import { TrendingUp, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface BalanceCardProps {
  totalBalance: number
  groupName: string
  budgetMonthly: number
}

export function BalanceCard({ totalBalance, groupName, budgetMonthly }: BalanceCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{groupName}</p>
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              ${totalBalance.toLocaleString()}
            </h2>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="flex items-center gap-1 text-primary">
                <TrendingUp className="h-4 w-4" />
                +12.5%
              </span>
              <span className="text-muted-foreground">from last month</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly budget: ${budgetMonthly.toLocaleString()}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
