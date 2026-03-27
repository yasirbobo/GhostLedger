"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight, Lock, Receipt, ArrowRight } from "lucide-react"
import type { Transaction } from "@/lib/types"

interface TransactionsListProps {
  transactions: Transaction[]
  showViewAll?: boolean
}

function formatPrivateAmount(amount: number): string {
  const lowerBound = Math.floor(amount / 50) * 50
  const upperBound = lowerBound + 100
  return `$${lowerBound}-$${upperBound}`
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatDate(dateString: string): string {
  const [, month, day] = dateString.split("-")
  const monthIndex = parseInt(month, 10) - 1
  return `${MONTHS[monthIndex]} ${parseInt(day, 10)}`
}

export function TransactionsList({ transactions, showViewAll = true }: TransactionsListProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Receipt className="h-4 w-4 text-primary" />
            Recent Transactions
          </CardTitle>
          {showViewAll && (
            <Link
              href="/transactions"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  transaction.type === "contribution"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {transaction.type === "contribution" ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {transaction.description}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {transaction.memberName}
                  </p>
                  {transaction.isPrivate && (
                    <Badge
                      variant="outline"
                      className="h-5 gap-1 border-primary/30 bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
                    >
                      <Lock className="h-2.5 w-2.5" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  transaction.type === "contribution"
                    ? "text-primary"
                    : "text-destructive"
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
        ))}
      </CardContent>
    </Card>
  )
}
