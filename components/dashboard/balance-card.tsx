"use client"

import { ShieldCheck, Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface BalanceCardProps {
  totalBalance: number
  groupName: string
  budgetMonthly: number
}

export function BalanceCard({ totalBalance, groupName, budgetMonthly }: BalanceCardProps) {
  return (
    <Card className="section-card border-0 bg-transparent shadow-none">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Available balance</p>
            <h2 className="mt-3 text-4xl font-semibold text-foreground">
              ${totalBalance.toLocaleString()}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{groupName}</p>
          </div>
          <div className="rounded-2xl bg-primary/12 p-3">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Monthly budget target</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {budgetMonthly > 0 ? `$${budgetMonthly.toLocaleString()}` : "Not configured yet"}
            </p>
          </div>
          <div className="rounded-full border border-primary/30 bg-primary/10 p-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
