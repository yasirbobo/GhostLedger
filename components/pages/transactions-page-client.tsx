"use client"

import { useState } from "react"
import { EditTransactionModal } from "@/components/dashboard/edit-transaction-modal"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowDownLeft,
  Download,
  ArrowUpRight,
  Lock,
  Receipt,
  Search,
  Filter,
  Trash2,
  CalendarRange,
} from "lucide-react"
import { useGroup } from "@/components/providers/group-provider"
import { canEditTransactions } from "@/lib/authz/group-permissions"
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
  const canManageTransactions = canEditTransactions(group)

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
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Transactions
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete history of all team transactions
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="gap-2 border-border text-foreground"
          >
            <a href={`/api/export/csv?groupId=${encodeURIComponent(group.id)}`}>
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border-border bg-secondary/50 pl-9 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {(["all", "contribution", "expense"] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className={
                    filterType === type
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              Date range
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="border-border bg-secondary/50 text-foreground"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="border-border bg-secondary/50 text-foreground"
            />
            {startDate || endDate ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
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

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Receipt className="h-4 w-4 text-primary" />
            All Transactions
            <Badge variant="outline" className="ml-2 border-border text-muted-foreground">
              {filteredTransactions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No transactions found
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
    const confirmed = window.confirm(
      `Delete "${transaction.description}" from the ledger?`
    )
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
    <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            transaction.type === "contribution"
              ? "bg-primary/10 text-primary"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {transaction.type === "contribution" ? (
            <ArrowDownLeft className="h-5 w-5" />
          ) : (
            <ArrowUpRight className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {transaction.description}
            </p>
            <Badge
              variant="outline"
              className={`text-xs ${
                transaction.type === "contribution"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {transaction.type}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-xs text-muted-foreground">{transaction.memberName}</p>
            <span className="text-xs text-muted-foreground">-</span>
            <p className="text-xs text-muted-foreground">{transaction.category}</p>
            {transaction.isPrivate && (
              <>
                <span className="text-xs text-muted-foreground">-</span>
                <Badge
                  variant="outline"
                  className="h-5 gap-1 border-primary/30 bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
                >
                  <Lock className="h-2.5 w-2.5" />
                  Encrypted
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p
            className={`text-sm font-semibold ${
              transaction.type === "contribution" ? "text-primary" : "text-destructive"
            }`}
          >
            {transaction.type === "contribution" ? "+" : "-"}
            {transaction.isPrivate
              ? transaction.encryptedValue ?? formatPrivateAmount(transaction.amount)
              : `$${transaction.amount.toLocaleString()}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(transaction.date)}
          </p>
        </div>
        {canManageTransactions ? (
          <>
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
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete transaction</span>
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}
