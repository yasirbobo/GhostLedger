import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/get-session-user"
import {
  getInsights,
  getSpendingCategories,
  getTotalContributions,
  getTotalExpenses,
  summarizePrivateSpending,
} from "@/lib/group-analytics"
import { getErrorMessage, getErrorStatus } from "@/lib/http/errors"
import { getOpenAIConfig } from "@/lib/openai/config"
import { logEvent } from "@/lib/observability/logger"
import { getGroup } from "@/lib/repositories/groups"
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit"
import type { Group } from "@/lib/types"
import { aiQuestionSchema } from "@/lib/validation/ai"

interface OpenAIResponsePayload {
  id: string
  output_text?: string
}

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

function buildLedgerSummary(group: Group) {
  return {
    group: {
      id: group.id,
      name: group.name,
      monthlyBudget: group.budgetMonthly,
      totalBalance: group.totalBalance,
      ownerEmail: group.ownerEmail ?? null,
      memberEmails: group.memberEmails ?? [],
    },
    members: group.members.map((member) => ({
      name: member.name,
      contribution: member.contribution,
      walletAddress: member.walletAddress,
    })),
    totals: {
      contributions: getTotalContributions(group),
      expenses: getTotalExpenses(group),
      privateExpenseSummary: summarizePrivateSpending(group.transactions),
    },
    insights: getInsights(group),
    categories: getSpendingCategories(group),
    recentTransactions: group.transactions.slice(0, 12).map((transaction) => ({
      date: transaction.date,
      description: transaction.description,
      memberName: transaction.memberName,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.isPrivate
        ? transaction.encryptedValue ?? "encrypted"
        : transaction.amount,
      isPrivate: transaction.isPrivate,
    })),
  }
}

async function generateModelAnswer(input: {
  question: string
  group: Group
  previousResponseId?: string
}) {
  const config = getOpenAIConfig()
  if (!config) {
    return null
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      instructions:
        "You are GhostLedger's financial analyst. Answer only from the provided ledger snapshot. Be concise, precise, and explicit when data is missing. Do not invent transactions, budgets, or member activity.",
      previous_response_id: input.previousResponseId,
      reasoning: {
        effort: "low",
      },
      text: {
        verbosity: "low",
      },
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Question: ${input.question}\n\nLedger snapshot:\n${JSON.stringify(buildLedgerSummary(input.group), null, 2)}`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error("OpenAI request failed")
  }

  const payload = (await response.json()) as OpenAIResponsePayload
  return {
    answer: payload.output_text?.trim() || answerQuestion(input.question, input.group),
    responseId: payload.id,
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request)
    const rateLimit = consumeRateLimit({
      key: `ai:${clientIp}`,
      limit: 20,
      windowMs: 60_000,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many analyst requests. Please wait a minute and try again." },
        { status: 429 }
      )
    }

    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to use the analyst." },
        { status: 401 }
      )
    }

    const payload = aiQuestionSchema.safeParse(await request.json())
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid AI request." },
        { status: 400 }
      )
    }

    const group = await getGroup(payload.data.groupId, user.email)

    try {
      const modelResponse = await generateModelAnswer({
        question: payload.data.question,
        group,
        previousResponseId: payload.data.previousResponseId,
      })

      if (modelResponse) {
        logEvent("info", "ai.response.generated", {
          groupId: group.id,
          userId: user.id,
          source: "model",
          clientIp,
        })
        return NextResponse.json(modelResponse)
      }
    } catch {
      // Fall back to deterministic analytics if the model request fails.
    }

    logEvent("info", "ai.response.generated", {
      groupId: group.id,
      userId: user.id,
      source: "deterministic",
      clientIp,
    })
    return NextResponse.json({
      answer: answerQuestion(payload.data.question, group),
      responseId: null,
    })
  } catch (error) {
    logEvent("error", "ai.response.failed", {
      clientIp: getClientIp(request),
      message: error instanceof Error ? error.message : "Unable to process AI request.",
    })
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to process AI request.") },
      { status: getErrorStatus(error) }
    )
  }
}
