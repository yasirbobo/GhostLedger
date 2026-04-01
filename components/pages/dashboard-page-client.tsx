"use client"

import { ArrowRight, Receipt, Repeat2, ShieldCheck, Users, Wallet } from "lucide-react"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AddTransactionModal } from "@/components/dashboard/add-transaction-modal"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { BudgetProgressCard } from "@/components/dashboard/budget-progress-card"
import { GroupAccessCard } from "@/components/dashboard/group-access-card"
import { MembersList } from "@/components/dashboard/members-list"
import { RecurringPlansCard } from "@/components/dashboard/recurring-plans-card"
import { TransactionsList } from "@/components/dashboard/transactions-list"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { useGroup } from "@/components/providers/group-provider"
import { Button } from "@/components/ui/button"
import { canEditTransactions } from "@/lib/authz/group-permissions"
import {
  getSpendingCategories,
  getTotalContributions,
  getTotalExpenses,
} from "@/lib/group-analytics"

export function DashboardPageClient() {
  const { group, addTransaction } = useGroup()
  const canAddTransactions = canEditTransactions(group)
  const totalContributions = getTotalContributions(group)
  const totalExpenses = getTotalExpenses(group)
  const remainingBudget = Math.max(group.budgetMonthly - totalExpenses, 0)
  const recentTransactions = group.transactions.slice(0, 5)
  const topCategory = getSpendingCategories(group).find((category) => category.amount > 0)

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace overview"
          title={group.name}
          description="Keep a tight read on liquidity, monthly burn, member contributions, and the activity that needs follow-up across your team."
          actions={
            <>
              {canAddTransactions ? (
                <AddTransactionModal members={group.members} onAdd={addTransaction} />
              ) : null}
              <Button asChild variant="outline" className="rounded-xl">
                <a href="/transactions">
                  Review ledger
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <DashboardMetric
            label="Available balance"
            value={`$${group.totalBalance.toLocaleString()}`}
            hint="Live workspace balance"
            icon={Wallet}
          />
          <DashboardMetric
            label="Contributions"
            value={`$${totalContributions.toLocaleString()}`}
            hint={`${group.members.length} active member${group.members.length === 1 ? "" : "s"}`}
            icon={Users}
          />
          <DashboardMetric
            label="Expenses"
            value={`$${totalExpenses.toLocaleString()}`}
            hint={topCategory ? `Top category: ${topCategory.name}` : "No expense trend yet"}
            icon={Receipt}
          />
          <DashboardMetric
            label="Budget room"
            value={`$${remainingBudget.toLocaleString()}`}
            hint={group.budgetMonthly > 0 ? "Remaining this month" : "Budget target not set"}
            icon={ShieldCheck}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <BalanceCard
                totalBalance={group.totalBalance}
                groupName={group.name}
                budgetMonthly={group.budgetMonthly}
              />
              <BudgetProgressCard group={group} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <MembersList members={group.members} totalContributions={totalContributions} />
              <TransactionsList transactions={recentTransactions} />
            </div>
          </div>

          <div className="grid gap-6">
            <QuickActionCard
              title="Operating rhythm"
              description="Use recurring plans and quick ledger updates to keep the workspace current."
              items={[
                `${group.recurringTransactions?.length ?? 0} recurring plan(s) configured`,
                `${group.transactions.length} transaction(s) recorded`,
                group.ownerEmail ? "Role-aware access controls enabled" : "Owner controls not yet surfaced",
              ]}
            />
            <RecurringPlansCard plans={group.recurringTransactions ?? []} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {group.ownerEmail ? <GroupAccessCard /> : <QuickAccessPlaceholder />}
          <ActivityFeed />
        </div>
      </div>
    </AppShell>
  )
}

function DashboardMetric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: typeof Wallet
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

function QuickActionCard({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: string[]
}) {
  return (
    <div className="section-card px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/12 p-3">
          <Repeat2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-border/70 bg-secondary/20 px-4 py-3 text-sm text-foreground"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickAccessPlaceholder() {
  return (
    <div className="section-card px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/12 p-3">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Access management</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Ownership data is still being configured for this workspace. Once present, GhostLedger
            will surface invite and member controls here.
          </p>
        </div>
      </div>
    </div>
  )
}
