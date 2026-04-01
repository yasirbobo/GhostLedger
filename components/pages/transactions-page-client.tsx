"use client"

import { useState } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarRange,
  Download,
  Filter,
  Lock,
  Receipt,
  Search,
  Trash2,
} from "lucide-react"
import { EditTransactionModal } from "@/components/dashboard/edit-transaction-modal"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { useGroup } from "@/components/providers/group-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { canModifyTransactions } from "@/lib/authz/group-permissions"
import type { Member, Transaction } from "@/lib/types"

function formatPrivateAmount(amount: number): string {
  const lowerBound = Math.floor(amount / 50) * 50
  const upperBound = lowerBound + 100
  return `$${lowerBound}-$${upperBound}`
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-")
  const monthIndex = parseInt(month, 10) - 1
  return `${MONTHS[monthIndex]} ${parseInt(day, 10)}, ${year}`
}

export function TransactionsPageClient() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "contribution" | "expense">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const { group, updateTransaction, deleteTransaction } = useGroup()
  const canManageTransactions = canModifyTransactions(group)

  const filteredTransactions = group.transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.memberName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || transaction.type === filterType
    const matchesStartDate = !startDate || transaction.date >= startDate
    const matchesEndDate = !endDate || transaction.date <= endDate

    return matchesSearch && matchesType && matchesStartDate && matchesEndDate
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ledger history"
          title="Transactions"
          description="Search, review, and export the complete movement of funds across the workspace with clear filtering and private amount handling."
          actions={
            <Button asChild variant="outline" className="rounded-xl">
              <a href={`/api/export/csv?groupId=${encodeURIComponent(group.id)}`}>
                <Download className="h-4 w-4" />
                Export CSV
              </a>
            </Button>
          }
        />

        <div className="section-card px-5 py-5">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by description or member"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-xl bg-background/70 pl-11"
              />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "contribution", "expense"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={filterType === type ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setFilterType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              <span>Date range</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-11 rounded-xl bg-background/70"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-11 rounded-xl bg-background/70"
              />
              {startDate || endDate ? (
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => {
                    setStartDate("")
                    setEndDate("")
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <Card className="section-card border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Receipt className="h-5 w-5 text-primary" />
              Complete ledger
              <Badge variant="outline" className="rounded-full px-2.5 py-1">
                {filteredTransactions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-0">
            {filteredTransactions.length === 0 ? (
              <div className="section-card px-6 py-12 text-center text-sm text-muted-foreground">
                No transactions match the current filters yet.
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  members={group.members}
                  onUpdate={updateTransaction}
                  onDelete={deleteTransaction}
                  canManageTransactions={canManageTransactions}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function TransactionItem({
  transaction,
  members,
  onUpdate,
  onDelete,
  canManageTransactions,
}: {
  transaction: Transaction
  members: Member[]
  onUpdate: (transactionId: string, input: {
    description: string
    amount: number
    type: "contribution" | "expense"
    memberId: string
    memberName: string
    isPrivate: boolean
    category: string
  }) => Promise<unknown>
  onDelete: (transactionId: string) => Promise<unknown>
  canManageTransactions: boolean
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${transaction.description}" from the ledger?`)
    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(transaction.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="section-card flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            transaction.type === "contribution"
              ? "bg-primary/12 text-primary"
              : "bg-destructive/12 text-destructive"
          }`}
        >
          {transaction.type === "contribution" ? (
            <ArrowDownLeft className="h-5 w-5" />
          ) : (
            <ArrowUpRight className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-medium text-foreground">{transaction.description}</p>
            <Badge
              variant="outline"
              className={`rounded-full ${
                transaction.type === "contribution"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {transaction.type}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{transaction.memberName}</span>
            <span>{transaction.category}</span>
            <span>{formatDate(transaction.date)}</span>
            {transaction.isPrivate ? (
              <Badge
                variant="outline"
                className="gap-1 rounded-full border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
              >
                <Lock className="h-3 w-3" />
                Private amount
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 lg:justify-end">
        <div className="text-left lg:text-right">
          <p
            className={`text-base font-semibold ${
              transaction.type === "contribution" ? "text-primary" : "text-destructive"
            }`}
          >
            {transaction.type === "contribution" ? "+" : "-"}
            {transaction.isPrivate
              ? transaction.encryptedValue ?? formatPrivateAmount(transaction.amount)
              : `$${transaction.amount.toLocaleString()}`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {transaction.isPrivate ? "Exact amount masked" : "Recorded in full"}
          </p>
        </div>

        {canManageTransactions ? (
          <div className="flex items-center gap-2">
            <EditTransactionModal
              transaction={transaction}
              members={members}
              onSave={onUpdate}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
              className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete transaction</span>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
