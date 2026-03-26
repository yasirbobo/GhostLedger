"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Receipt,
  Search,
  Filter,
} from "lucide-react"
import { useGroup } from "@/components/providers/group-provider"
import type { Transaction } from "@/lib/types"

function formatPrivateAmount(amount: number): string {
  const lowerBound = Math.floor(amount / 50) * 50
  const upperBound = lowerBound + 100
  return `$${lowerBound}–$${upperBound}`
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-")
  const monthIndex = parseInt(month, 10) - 1
  return `${MONTHS[monthIndex]} ${parseInt(day, 10)}, ${year}`
}

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "contribution" | "expense">("all")
  const { group } = useGroup()

  const transactions = group.transactions

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.memberName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || tx.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Transactions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete history of all team transactions
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
          />
        </div>
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
      </div>

      {/* Transactions List */}
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
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}

function TransactionItem({ transaction }: { transaction: Transaction }) {
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
            <span className="text-xs text-muted-foreground">{"•"}</span>
            <p className="text-xs text-muted-foreground">{transaction.category}</p>
            {transaction.isPrivate && (
              <>
                <span className="text-xs text-muted-foreground">{"•"}</span>
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
    </div>
  )
}
