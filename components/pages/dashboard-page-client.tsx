"use client"

import { AppShell } from "@/components/layout/app-shell"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { BudgetProgressCard } from "@/components/dashboard/budget-progress-card"
import { MembersList } from "@/components/dashboard/members-list"
import { TransactionsList } from "@/components/dashboard/transactions-list"
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal"
import { GroupAccessCard } from "@/components/dashboard/group-access-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { RecurringPlansCard } from "@/components/dashboard/recurring-plans-card"
import { useGroup } from "@/components/providers/group-provider"
import { canEditTransactions } from "@/lib/authz/group-permissions"
import { getTotalContributions } from "@/lib/group-analytics"

export function DashboardPageClient() {
  const { group, addTransaction } = useGroup()
  const totalContributions = getTotalContributions(group)
  const recentTransactions = group.transactions.slice(0, 5)
  const canAddTransactions = canEditTransactions(group)

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Team Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team{"'"}s finances with privacy
          </p>
        </div>
        {canAddTransactions ? (
          <AddTransactionModal members={group.members} onAdd={addTransaction} />
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          totalBalance={group.totalBalance}
          groupName={group.name}
          budgetMonthly={group.budgetMonthly}
        />
        <BudgetProgressCard group={group} />
        <MembersList members={group.members} totalContributions={totalContributions} />
        <div className="sm:col-span-2 lg:col-span-2">
          <TransactionsList transactions={recentTransactions} />
        </div>
      </div>

      <div className="mt-6">
        <RecurringPlansCard plans={group.recurringTransactions ?? []} />
      </div>

      {group.ownerEmail ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GroupAccessCard />
          <ActivityFeed />
        </div>
      ) : (
        <div className="mt-6">
          <ActivityFeed />
        </div>
      )}
    </AppShell>
  )
}
