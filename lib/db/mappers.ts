import type {
  ActivityEvent,
  AuthUser,
  Group,
  GroupRole,
  InviteSummary,
  Member,
  RecurringTransaction,
  Transaction,
} from "../types"
import type {
  Group as PrismaGroup,
  GroupInvite,
  GroupMember,
  RecurringTransactionPlan,
  Transaction as PrismaTransaction,
  User,
} from "@prisma/client"

function asNumber(value: number) {
  return value
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function mapUserToAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

export function mapGroupMember(member: GroupMember): Member {
  return {
    id: member.id,
    name: member.displayName,
    avatar: member.avatar,
    walletAddress: member.walletAddress,
    contribution: asNumber(member.contribution),
  }
}

export function mapTransaction(transaction: PrismaTransaction, member: GroupMember): Transaction {
  return {
    id: transaction.id,
    description: transaction.description,
    amount: asNumber(transaction.amount),
    type: transaction.type,
    memberId: transaction.memberId,
    memberName: member.displayName,
    date: transaction.transactionAt.toISOString().split("T")[0] ?? "",
    isPrivate: transaction.isPrivate,
    category: transaction.category,
    encryptedValue: transaction.encryptedValue ?? undefined,
  }
}

export function mapRecurringTransaction(
  plan: RecurringTransactionPlan,
  member: GroupMember
): RecurringTransaction {
  return {
    id: plan.id,
    description: plan.description,
    amount: asNumber(plan.amount),
    type: plan.type,
    memberId: plan.memberId,
    memberName: member.displayName,
    isPrivate: plan.isPrivate,
    category: plan.category,
    frequency: plan.frequency,
    nextRunDate: plan.nextRunDate.toISOString().split("T")[0] ?? "",
    active: plan.active,
  }
}

export function mapInviteSummary(invite: GroupInvite): InviteSummary {
  return {
    email: invite.email,
    token: invite.token,
    role: invite.role as GroupRole,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
  }
}

function buildActivity(params: {
  group: PrismaGroup
  invites: GroupInvite[]
  transactions: Array<PrismaTransaction & { member: GroupMember }>
}): ActivityEvent[] {
  const entries: ActivityEvent[] = [
    {
      id: `group-${params.group.id}`,
      type: "group",
      title: "Workspace created",
      description: `${params.group.name} was created and is ready for collaboration.`,
      occurredAt: params.group.createdAt.toISOString(),
    },
    ...params.invites.flatMap((invite) => {
      const pendingEvent: ActivityEvent = {
        id: `invite-pending-${invite.id}`,
        type: "invite",
        title: "Invite sent",
        description: `${invite.email} was invited to join as ${invite.role}.`,
        occurredAt: invite.createdAt.toISOString(),
      }

      if (invite.status !== "accepted") {
        return [pendingEvent] satisfies ActivityEvent[]
      }

      return [
        pendingEvent,
        {
          id: `invite-accepted-${invite.id}`,
          type: "invite",
          title: "Invite accepted",
          description: `${invite.email} accepted their workspace access.`,
          occurredAt: invite.updatedAt.toISOString(),
        },
      ] satisfies ActivityEvent[]
    }),
    ...params.transactions.map(
      (transaction): ActivityEvent => ({
        id: `transaction-${transaction.id}`,
        type: "transaction",
        title:
          transaction.type === "contribution" ? "Contribution recorded" : "Expense recorded",
        description:
          transaction.type === "contribution"
            ? `${transaction.member.displayName} added a contribution of ${formatCurrency(asNumber(transaction.amount))}.`
            : `${transaction.member.displayName} logged ${transaction.description} for ${formatCurrency(asNumber(transaction.amount))}.`,
        occurredAt: transaction.createdAt.toISOString(),
      })
    ),
  ]

  return entries
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    )
    .slice(0, 8)
}

export function mapGroup(params: {
  group: PrismaGroup
  members: GroupMember[]
  invites?: GroupInvite[]
  recurringPlans?: Array<RecurringTransactionPlan & { member: GroupMember }>
  transactions: Array<PrismaTransaction & { member: GroupMember }>
  ownerEmail?: string
  requesterEmail?: string
}): Group {
  const {
    group,
    members,
    invites = [],
    recurringPlans = [],
    transactions,
    ownerEmail,
    requesterEmail,
  } = params
  const normalizedRequesterEmail = requesterEmail?.trim().toLowerCase()
  const normalizedOwnerEmail = ownerEmail?.trim().toLowerCase()
  const requesterMember = normalizedRequesterEmail
    ? members.find((member) => member.email === normalizedRequesterEmail)
    : undefined
  const requesterInvite = normalizedRequesterEmail
    ? invites.find((invite) => invite.email === normalizedRequesterEmail)
    : undefined
  const currentUserRole: GroupRole | undefined =
    normalizedRequesterEmail !== undefined &&
    normalizedOwnerEmail !== undefined &&
    normalizedRequesterEmail === normalizedOwnerEmail
      ? "owner"
      : ((requesterMember?.role ?? requesterInvite?.role) as GroupRole | undefined)

  return {
    id: group.id,
    name: group.name,
    budgetMonthly: asNumber(group.budgetMonthly),
    totalBalance: asNumber(group.totalBalance),
    ownerEmail,
    memberEmails: [
      ownerEmail,
      ...members.map((member) => member.email),
      ...invites.map((invite) => invite.email),
    ].filter((email): email is string => Boolean(email)),
    invites: invites.map(mapInviteSummary),
    recurringTransactions: recurringPlans.map((plan) =>
      mapRecurringTransaction(plan, plan.member)
    ),
    activity: buildActivity({ group, invites, transactions }),
    isOwner:
      normalizedRequesterEmail !== undefined &&
      normalizedOwnerEmail !== undefined &&
      normalizedRequesterEmail === normalizedOwnerEmail,
    currentUserRole,
    members: members.map(mapGroupMember),
    transactions: transactions.map((transaction) =>
      mapTransaction(transaction, transaction.member)
    ),
  }
}
