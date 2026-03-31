import type { Group, Insight, SpendingCategory } from "./types"
import { buildEncryptedValue } from "./group-analytics"

export const mockGroup: Group = {
  id: "1",
  name: "Startup Team Fund",
  budgetMonthly: 1400,
  totalBalance: 12450,
  members: [
    { id: "1", name: "Alex Chen", avatar: "AC", walletAddress: "0xTEAM0001SAFE", contribution: 4200 },
    { id: "2", name: "Sarah Kim", avatar: "SK", walletAddress: "0xTEAM0002SAFE", contribution: 3800 },
    { id: "3", name: "Mike Ross", avatar: "MR", walletAddress: "0xTEAM0003SAFE", contribution: 2950 },
    { id: "4", name: "Emma Liu", avatar: "EL", walletAddress: "0xTEAM0004SAFE", contribution: 1500 },
  ],
  recurringTransactions: [
    {
      id: "r1",
      description: "Monthly Software Licenses",
      amount: 450,
      type: "expense",
      memberId: "2",
      memberName: "Sarah Kim",
      isPrivate: true,
      category: "Software",
      frequency: "monthly",
      nextRunDate: "2024-04-14",
      active: true,
    },
    {
      id: "r2",
      description: "Community Treasury Contribution",
      amount: 500,
      type: "contribution",
      memberId: "3",
      memberName: "Mike Ross",
      isPrivate: false,
      category: "Contribution",
      frequency: "monthly",
      nextRunDate: "2024-04-05",
      active: true,
    },
  ],
  invites: [],
  activity: [
    {
      id: "a1",
      type: "group",
      title: "Workspace created",
      description: "Startup Team Fund was set up for team budgeting and shared expenses.",
      occurredAt: "2024-03-01T09:00:00.000Z",
    },
    {
      id: "a2",
      type: "transaction",
      title: "Contribution recorded",
      description: "Sarah Kim added a contribution of $500.00.",
      occurredAt: "2024-03-05T10:00:00.000Z",
    },
    {
      id: "a3",
      type: "transaction",
      title: "Expense recorded",
      description: "Alex Chen logged Monthly Team Lunch for $285.00.",
      occurredAt: "2024-03-15T12:00:00.000Z",
    },
  ],
  transactions: [
    {
      id: "t1",
      description: "Monthly Team Lunch",
      amount: 285,
      type: "expense",
      memberId: "1",
      memberName: "Alex Chen",
      date: "2024-03-15",
      isPrivate: false,
      category: "Food",
    },
    {
      id: "t2",
      description: "Software Licenses",
      amount: 450,
      type: "expense",
      memberId: "2",
      memberName: "Sarah Kim",
      date: "2024-03-14",
      isPrivate: true,
      category: "Software",
      encryptedValue: buildEncryptedValue(450),
    },
    {
      id: "t3",
      description: "Contribution - Q1",
      amount: 1000,
      type: "contribution",
      memberId: "3",
      memberName: "Mike Ross",
      date: "2024-03-12",
      isPrivate: false,
      category: "Contribution",
    },
    {
      id: "t4",
      description: "Office Supplies",
      amount: 125,
      type: "expense",
      memberId: "4",
      memberName: "Emma Liu",
      date: "2024-03-10",
      isPrivate: false,
      category: "Office",
    },
    {
      id: "t5",
      description: "Team Building Event",
      amount: 680,
      type: "expense",
      memberId: "1",
      memberName: "Alex Chen",
      date: "2024-03-08",
      isPrivate: true,
      category: "Events",
      encryptedValue: buildEncryptedValue(680),
    },
    {
      id: "t6",
      description: "Monthly Contribution",
      amount: 500,
      type: "contribution",
      memberId: "2",
      memberName: "Sarah Kim",
      date: "2024-03-05",
      isPrivate: false,
      category: "Contribution",
    },
  ],
}

export const mockInsights: Insight[] = [
  {
    id: "i1",
    type: "warning",
    title: "Over Budget Alert",
    message: "You are 15% over the monthly software budget",
  },
  {
    id: "i2",
    type: "info",
    title: "Contribution Imbalance",
    message: "Alex Chen has contributed 34% of total funds",
  },
  {
    id: "i3",
    type: "success",
    title: "Savings Goal",
    message: "Team is on track to reach Q2 savings target",
  },
]

export const mockSpendingCategories: SpendingCategory[] = [
  { name: "Software", amount: 2450, percentage: 35, color: "var(--chart-1)" },
  { name: "Food", amount: 1820, percentage: 26, color: "var(--chart-2)" },
  { name: "Events", amount: 1400, percentage: 20, color: "var(--chart-3)" },
  { name: "Office", amount: 980, percentage: 14, color: "var(--chart-4)" },
  { name: "Other", amount: 350, percentage: 5, color: "var(--chart-5)" },
]

export const mockAIResponses: Record<string, string> = {
  "where is our money going":
    "Based on your transaction history, the majority of your spending (35%) goes to Software licenses and tools, followed by Food & dining (26%) for team meals. Events account for 20%, Office supplies 14%, and miscellaneous expenses 5%. Consider reviewing software subscriptions for potential savings.",
  "who contributed the most":
    "Alex Chen has contributed the most with $4,200 (34% of total contributions), followed by Sarah Kim at $3,800 (30%). Mike Ross contributed $2,950 (24%), and Emma Liu has contributed $1,500 (12%). The contribution spread shows some imbalance that you may want to address.",
  default:
    "I can help you analyze your team's finances. Try asking questions like 'Where is our money going?' or 'Who contributed the most?' to get detailed insights about your spending patterns and member contributions.",
}
