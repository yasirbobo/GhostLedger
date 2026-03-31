import {
  getBudgetStatus,
  getSpendingCategories,
  getTotalContributions,
  getTotalExpenses,
} from "../group-analytics"
import type { Group } from "../types"

function resolveMonth(month?: string, fallbackDate?: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return month
  }

  if (fallbackDate) {
    return fallbackDate.slice(0, 7)
  }

  return new Date().toISOString().slice(0, 7)
}

export function buildMonthlyReport(group: Group, requestedMonth?: string) {
  const latestTransactionDate = group.transactions[0]?.date
  const month = resolveMonth(requestedMonth, latestTransactionDate)
  const monthlyTransactions = group.transactions.filter((transaction) =>
    transaction.date.startsWith(month)
  )

  const scopedGroup: Group = {
    ...group,
    transactions: monthlyTransactions,
  }

  const contributions = getTotalContributions(scopedGroup)
  const expenses = getTotalExpenses(scopedGroup)
  const netFlow = contributions - expenses
  const categories = getSpendingCategories(scopedGroup).filter((category) => category.amount > 0)
  const topCategory = categories[0] ?? null
  const topContributor = [...group.members].sort(
    (left, right) => right.contribution - left.contribution
  )[0] ?? null
  const budget = getBudgetStatus(scopedGroup)

  return {
    month,
    group: {
      id: group.id,
      name: group.name,
    },
    totals: {
      contributions,
      expenses,
      netFlow,
      transactions: monthlyTransactions.length,
    },
    budget: {
      monthlyBudget: group.budgetMonthly,
      spent: budget.spent,
      remaining: budget.remaining,
      isOverBudget: budget.isOverBudget,
      percentUsed: budget.percentUsed,
    },
    topCategory: topCategory
      ? {
          name: topCategory.name,
          amount: topCategory.amount,
          percentage: topCategory.percentage,
        }
      : null,
    topContributor: topContributor
      ? {
          name: topContributor.name,
          contribution: topContributor.contribution,
        }
      : null,
    highlights: [
      netFlow >= 0
        ? `Net flow is positive at $${netFlow.toLocaleString()}.`
        : `Net flow is negative at $${Math.abs(netFlow).toLocaleString()}.`,
      budget.isOverBudget
        ? `Spending exceeded budget by $${Math.abs(group.budgetMonthly - expenses).toLocaleString()}.`
        : `$${budget.remaining.toLocaleString()} remains in the monthly budget.`,
      topCategory
        ? `${topCategory.name} is the largest expense category at ${topCategory.percentage}% of spend.`
        : "No expense categories were recorded for this month.",
    ],
  }
}
