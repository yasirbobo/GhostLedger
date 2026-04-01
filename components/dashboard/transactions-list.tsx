"use client"

import Link from "next/link"
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Lock, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card className="section-card border-0 bg-transparent shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Receipt className="h-5 w-5 text-primary" />
            Recent transactions
          </CardTitle>
          {showViewAll ? (
            <Link href="/transactions" className="flex items-center gap-1 text-sm text-primary">
              View ledger
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="rounded-2xl border border-border/70 bg-secondary/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      transaction.type === "contribution"
                        ? "bg-primary/12 text-primary"
                        : "bg-destructive/12 text-destructive"
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
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{transaction.memberName}</span>
                      <span>{formatDate(transaction.date)}</span>
                      {transaction.isPrivate ? (
                        <Badge
                          variant="outline"
                          className="gap-1 rounded-full border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          Private
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>

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
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-border/70 bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No transactions recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
