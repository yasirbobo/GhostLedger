"use client"

import { AppShell } from "@/components/layout/app-shell"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { MembersList } from "@/components/dashboard/members-list"
import { TransactionsList } from "@/components/dashboard/transactions-list"
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal"
import { useGroup } from "@/components/providers/group-provider"
import { getTotalContributions } from "@/lib/group-analytics"

export default function DashboardPage() {
  const { group, addTransaction } = useGroup()
  const totalContributions = getTotalContributions(group)

  // Only show recent 5 transactions on dashboard
  const recentTransactions = group.transactions.slice(0, 5)

  return (
    <AppShell>
      {/* Header section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Team Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team{"'"}s finances with privacy
          </p>
        </div>
        <AddTransactionModal members={group.members} onAdd={addTransaction} />
      </div>

      {/* Stats grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <BalanceCard
          totalBalance={group.totalBalance}
          groupName={group.name}
          budgetMonthly={group.budgetMonthly}
        />
        <MembersList members={group.members} totalContributions={totalContributions} />
        <div className="sm:col-span-2 lg:col-span-1">
          <TransactionsList transactions={recentTransactions} />
        </div>
      </div>
    </AppShell>
  )
}
