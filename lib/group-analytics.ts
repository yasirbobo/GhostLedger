import type { Group, Insight, SpendingCategory, Transaction } from "@/lib/types"

const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function buildEncryptedValue(amount: number) {
  const lowerBound = Math.floor(amount / 50) * 50
  const upperBound = lowerBound + 100
  return `$${lowerBound}-$${upperBound} encrypted`
}

export function getTotalContributions(group: Group) {
  return group.members.reduce((sum, member) => sum + member.contribution, 0)
}

export function getTotalExpenses(group: Group) {
  return group.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

export function getAverageContribution(group: Group) {
  if (group.members.length === 0) return 0
  return getTotalContributions(group) / group.members.length
}

export function getContributionFairness(group: Group) {
  const totalContributions = getTotalContributions(group)
  const fairShare = group.members.length > 0 ? 100 / group.members.length : 0

  return group.members.map((member) => {
    const percentage =
      totalContributions > 0 ? (member.contribution / totalContributions) * 100 : 0
    const deviation = percentage - fairShare

    return {
      member,
      percentage,
      fairShare,
      deviation,
      isOverContributing: deviation > 5,
      isUnderContributing: deviation < -5,
    }
  })
}

export function getSettlementPositions(group: Group) {
  if (group.members.length === 0) {
    return []
  }

  const equalExpenseShare = getTotalExpenses(group) / group.members.length

  return group.members.map((member) => {
    const netPosition = member.contribution - equalExpenseShare

    return {
      member,
      equalExpenseShare,
      netPosition,
      status:
        netPosition > 0 ? "is owed" : netPosition < 0 ? "owes" : "settled",
    }
  })
}

export function getSpendingCategories(group: Group): SpendingCategory[] {
  const expenseTotals = group.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce<Record<string, number>>((accumulator, transaction) => {
      accumulator[transaction.category] =
        (accumulator[transaction.category] ?? 0) + transaction.amount
      return accumulator
    }, {})

  const entries = Object.entries(expenseTotals).sort((a, b) => b[1] - a[1])
  const totalExpenses = getTotalExpenses(group)

  if (entries.length === 0 || totalExpenses === 0) {
    return [
      {
        name: "No spending yet",
        amount: 0,
        percentage: 100,
        color: CATEGORY_COLORS[0],
      },
    ]
  }

  return entries.map(([name, amount], index) => ({
    name,
    amount,
    percentage: Math.round((amount / totalExpenses) * 100),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))
}

export function getInsights(group: Group): Insight[] {
  const totalExpenses = getTotalExpenses(group)
  const totalContributions = getTotalContributions(group)
  const categories = getSpendingCategories(group)
  const insights: Insight[] = []

  if (group.budgetMonthly > 0 && totalExpenses > group.budgetMonthly) {
    const overBudgetBy = Math.round(
      ((totalExpenses - group.budgetMonthly) / group.budgetMonthly) * 100
    )
    insights.push({
      id: "budget-warning",
      type: "warning",
      title: "Over Budget Alert",
      message: `You are ${overBudgetBy}% over the monthly budget of $${group.budgetMonthly.toLocaleString()}.`,
    })
  } else if (group.budgetMonthly > 0) {
    const remaining = group.budgetMonthly - totalExpenses
    insights.push({
      id: "budget-info",
      type: "success",
      title: "Budget Headroom",
      message: `$${remaining.toLocaleString()} remains in this month's budget.`,
    })
  }

  const topContributor = [...group.members].sort(
    (left, right) => right.contribution - left.contribution
  )[0]
  if (topContributor && totalContributions > 0) {
    const share = Math.round((topContributor.contribution / totalContributions) * 100)
    insights.push({
      id: "contribution-imbalance",
      type: share > 40 ? "warning" : "info",
      title: "Contribution Fairness",
      message: `${topContributor.name} has contributed ${share}% of total funds.`,
    })
  }

  const topCategory = categories[0]
  if (topCategory && topCategory.amount > 0) {
    insights.push({
      id: "top-category",
      type: "info",
      title: "Top Spending Category",
      message: `${topCategory.name} accounts for ${topCategory.percentage}% of spending.`,
    })
  }

  if (group.totalBalance > 0) {
    insights.push({
      id: "balance-health",
      type: "success",
      title: "Runway Status",
      message: `The group currently holds $${group.totalBalance.toLocaleString()} available for future expenses.`,
    })
  }

  return insights.slice(0, 4)
}

export function summarizePrivateSpending(transactions: Transaction[]) {
  const privateExpenses = transactions.filter(
    (transaction) => transaction.type === "expense" && transaction.isPrivate
  )

  if (privateExpenses.length === 0) {
    return "There are no private expenses in the current ledger."
  }

  const total = privateExpenses.reduce((sum, transaction) => sum + transaction.amount, 0)
  return `${privateExpenses.length} expense(s) are marked private, representing $${total.toLocaleString()} in encrypted outflows.`
}
