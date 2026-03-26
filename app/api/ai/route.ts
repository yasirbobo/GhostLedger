import { NextResponse } from "next/server"
import {
  getInsights,
  getSpendingCategories,
  getTotalContributions,
  getTotalExpenses,
  summarizePrivateSpending,
} from "@/lib/group-analytics"
import type { Group } from "@/lib/types"

function answerQuestion(question: string, group: Group) {
  const normalizedQuestion = question.toLowerCase()
  const totalContributions = getTotalContributions(group)
  const totalExpenses = getTotalExpenses(group)
  const categories = getSpendingCategories(group)
  const insights = getInsights(group)
  const topContributor = [...group.members].sort(
    (left, right) => right.contribution - left.contribution
  )[0]

  if (normalizedQuestion.includes("where") && normalizedQuestion.includes("money")) {
    const categorySummary = categories
      .filter((category) => category.amount > 0)
      .slice(0, 3)
      .map(
        (category) =>
          `${category.name} ${category.percentage}% ($${category.amount.toLocaleString()})`
      )
      .join(", ")

    return `Most spending is concentrated in ${categorySummary || "no categories yet"}. Total expenses are $${totalExpenses.toLocaleString()}, against contributions of $${totalContributions.toLocaleString()}. ${summarizePrivateSpending(group.transactions)}`
  }

  if (normalizedQuestion.includes("who") && normalizedQuestion.includes("contributed")) {
    if (!topContributor) {
      return "No team members are available yet, so there is no contribution history to analyze."
    }

    const share =
      totalContributions > 0
        ? Math.round((topContributor.contribution / totalContributions) * 100)
        : 0

    return `${topContributor.name} has contributed the most so far with $${topContributor.contribution.toLocaleString()} (${share}% of total contributions). The team has raised $${totalContributions.toLocaleString()} across ${group.members.length} member(s).`
  }

  if (
    normalizedQuestion.includes("overspending") ||
    normalizedQuestion.includes("over budget") ||
    normalizedQuestion.includes("budget")
  ) {
    if (group.budgetMonthly <= 0) {
      return `There is no monthly budget configured yet. Current expenses are $${totalExpenses.toLocaleString()}.`
    }

    if (totalExpenses > group.budgetMonthly) {
      const overBy = Math.round(
        ((totalExpenses - group.budgetMonthly) / group.budgetMonthly) * 100
      )
      return `Yes. The team is ${overBy}% over the monthly budget. Expenses are $${totalExpenses.toLocaleString()} versus a budget of $${group.budgetMonthly.toLocaleString()}.`
    }

    const remaining = group.budgetMonthly - totalExpenses
    return `Not yet. The team is still within budget, with $${remaining.toLocaleString()} remaining this month.`
  }

  if (normalizedQuestion.includes("private") || normalizedQuestion.includes("encrypted")) {
    return summarizePrivateSpending(group.transactions)
  }

  const defaultInsight = insights[0]?.message ?? "Add more transactions to unlock better analysis."
  return `Here is the current financial snapshot for ${group.name}: balance $${group.totalBalance.toLocaleString()}, contributions $${totalContributions.toLocaleString()}, expenses $${totalExpenses.toLocaleString()}. ${defaultInsight}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string; group?: Group }
    const question = body.question?.trim()
    const group = body.group

    if (!question || !group) {
      return NextResponse.json(
        { error: "Question and group data are required." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      answer: answerQuestion(question, group),
    })
  } catch {
    return NextResponse.json(
      { error: "Unable to process AI request." },
      { status: 500 }
    )
  }
}
