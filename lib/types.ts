export type GroupRole = "owner" | "admin" | "member" | "viewer"
export type BillingPlan = "starter" | "growth" | "scale"
export type BillingStatus = "trialing" | "active"

export interface Member {
  id: string
  name: string
  avatar: string
  walletAddress: string
  contribution: number
}

export interface Transaction {
  id: string
  description: string
  amount: number
  type: "contribution" | "expense"
  memberId: string
  memberName: string
  date: string
  isPrivate: boolean
  category: string
  encryptedValue?: string
}

export interface RecurrenceRule {
  frequency: "weekly" | "monthly"
  nextRunDate: string
}

export interface RecurringTransaction {
  id: string
  description: string
  amount: number
  type: "contribution" | "expense"
  memberId: string
  memberName: string
  isPrivate: boolean
  category: string
  frequency: "weekly" | "monthly"
  nextRunDate: string
  active: boolean
}

export interface InviteSummary {
  email: string
  token?: string
  role: GroupRole
  status: "pending" | "accepted" | "revoked" | "expired"
  expiresAt?: string
}

export interface ActivityEvent {
  id: string
  type: "group" | "invite" | "transaction"
  title: string
  description: string
  occurredAt: string
}

export interface Group {
  id: string
  name: string
  budgetMonthly: number
  totalBalance: number
  members: Member[]
  transactions: Transaction[]
  recurringTransactions?: RecurringTransaction[]
  ownerEmail?: string
  memberEmails?: string[]
  invites?: InviteSummary[]
  activity?: ActivityEvent[]
  isOwner?: boolean
  currentUserRole?: GroupRole
}

export interface Insight {
  id: string
  type: "warning" | "info" | "success"
  title: string
  message: string
}

export interface SpendingCategory {
  name: string
  amount: number
  percentage: number
  color: string
}

export interface AIMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface AddTransactionInput {
  description: string
  amount: number
  type: "contribution" | "expense"
  memberId: string
  memberName: string
  isPrivate: boolean
  category: string
  recurrence?: RecurrenceRule
}

export interface CreateGroupInput {
  name: string
  memberNames: string[]
  budgetMonthly: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface NotificationPreferences {
  monthlySummary: boolean
  budgetAlerts: boolean
  recurringReminders: boolean
  inviteUpdates: boolean
}

export interface BillingUsage {
  seats: number
  pendingInvites: number
  recurringPlans: number
  transactions: number
}

export interface BillingLimits {
  maxSeats: number | null
  maxPendingInvites: number | null
  maxRecurringPlans: number | null
}

export interface GroupBilling {
  groupId: string
  plan: BillingPlan
  status: BillingStatus
  renewalDate: string
  priceMonthly: number
  usage: BillingUsage
  limits: BillingLimits
}

export interface RecurringJobResult {
  group: Group
  processedCount: number
  generatedTransactionIds: string[]
}
