import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import {
  canAssignRole,
  canChangeRole,
  canCreateTransactions,
  canModifyTransactions,
  canRemoveRole,
  normalizeGroupRole,
} from "./authz/group-permissions"
import { buildEncryptedValue } from "./group-analytics"
import { isValidEmail } from "./auth-store"
import { mockGroup } from "./mock-data"
import type {
  AddTransactionInput,
  ActivityEvent,
  CreateGroupInput,
  Group,
  GroupRole,
  InviteSummary,
  Member,
  RecurringJobResult,
  RecurringTransaction,
  Transaction,
} from "./types"

interface StoredGroup extends Group {
  ownerEmail?: string
  memberEmails?: string[]
  memberRoles?: Record<string, GroupRole>
}

interface GroupStore {
  demoGroupId: string
  groups: Record<string, StoredGroup>
}

const DATA_DIR = process.env.GHOSTLEDGER_DATA_DIR ?? path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "groups.json")

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function cloneGroup(group: StoredGroup, requesterEmail?: string): Group {
  const normalizedRequesterEmail = requesterEmail
    ? normalizeEmail(requesterEmail)
    : undefined
  const ownerEmail = group.ownerEmail
  const memberEmails = group.memberEmails ? [...group.memberEmails] : undefined
  const currentUserRole =
    normalizedRequesterEmail && ownerEmail === normalizedRequesterEmail
      ? "owner"
      : normalizedRequesterEmail
        ? group.memberRoles?.[normalizedRequesterEmail] ?? "member"
        : undefined

  return {
    ...group,
    ownerEmail,
    memberEmails,
    invites: buildInviteSummaries(ownerEmail, memberEmails, group.memberRoles),
    recurringTransactions: (group.recurringTransactions ?? []).map((transaction) => ({
      ...transaction,
    })),
    activity: [...(group.activity ?? [])].sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    ),
    isOwner:
      normalizedRequesterEmail !== undefined &&
      ownerEmail === normalizedRequesterEmail,
    currentUserRole,
    members: group.members.map((member) => ({ ...member })),
    transactions: group.transactions.map((transaction) => ({ ...transaction })),
  }
}

function buildInviteSummaries(
  ownerEmail?: string,
  memberEmails?: string[],
  memberRoles?: Record<string, GroupRole>
): InviteSummary[] {
  return (memberEmails ?? [])
    .filter((email) => email !== ownerEmail)
    .map((email) => ({
      email,
      role: memberRoles?.[email] ?? "member",
      status: "accepted",
    }))
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function buildActivityEvent(event: Omit<ActivityEvent, "id" | "occurredAt">): ActivityEvent {
  return {
    id: `a-${randomUUID()}`,
    occurredAt: new Date().toISOString(),
    ...event,
  }
}

function buildRecurringTransaction(input: AddTransactionInput): RecurringTransaction | null {
  if (!input.recurrence) {
    return null
  }

  return {
    id: `r-${randomUUID()}`,
    description: input.description.trim(),
    amount: input.amount,
    type: input.type,
    memberId: input.memberId,
    memberName: input.memberName,
    isPrivate: input.isPrivate,
    category: input.type === "contribution" ? "Contribution" : input.category,
    frequency: input.recurrence.frequency,
    nextRunDate: input.recurrence.nextRunDate,
    active: true,
  }
}

function buildInitialStore(): GroupStore {
  return {
    demoGroupId: mockGroup.id,
    groups: {
      [mockGroup.id]: {
        ...mockGroup,
        ownerEmail: undefined,
        memberEmails: [],
        memberRoles: {},
        recurringTransactions: mockGroup.recurringTransactions ?? [],
        activity: mockGroup.activity ?? [],
      },
    },
  }
}

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await readFile(STORE_PATH, "utf8")
  } catch {
    await writeStore(buildInitialStore())
  }
}

async function readStore(): Promise<GroupStore> {
  await ensureStore()
  const rawStore = await readFile(STORE_PATH, "utf8")
  return JSON.parse(rawStore) as GroupStore
}

async function writeStore(store: GroupStore) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8")
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

function buildWalletAddress(index: number) {
  return `0xTEAM${(index + 1).toString().padStart(4, "0")}SAFE`
}

function buildMember(name: string, index: number): Member {
  return {
    id: `m-${randomUUID()}`,
    name,
    avatar: getInitials(name),
    walletAddress: buildWalletAddress(index),
    contribution: 0,
  }
}

function buildTransaction(input: AddTransactionInput): Transaction {
  return {
    ...input,
    id: `t-${randomUUID()}`,
    date: new Date().toISOString().split("T")[0] ?? "",
    encryptedValue: input.isPrivate ? buildEncryptedValue(input.amount) : undefined,
  }
}

function buildTransactionFromRecurringPlan(plan: RecurringTransaction): Transaction {
  return {
    id: `t-${randomUUID()}`,
    description: plan.description,
    amount: plan.amount,
    type: plan.type,
    memberId: plan.memberId,
    memberName: plan.memberName,
    date: new Date().toISOString().split("T")[0] ?? "",
    isPrivate: plan.isPrivate,
    category: plan.category,
    encryptedValue: plan.isPrivate ? buildEncryptedValue(plan.amount) : undefined,
  }
}

function addRecurringInterval(date: string, frequency: RecurringTransaction["frequency"]) {
  const nextDate = new Date(`${date}T00:00:00.000Z`)

  if (frequency === "weekly") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 7)
  } else {
    nextDate.setUTCMonth(nextDate.getUTCMonth() + 1)
  }

  return nextDate.toISOString().split("T")[0] ?? date
}

function hasAccess(group: StoredGroup, requesterEmail?: string) {
  if (!group.ownerEmail) {
    return true
  }

  if (!requesterEmail) {
    return false
  }

  const normalizedRequesterEmail = normalizeEmail(requesterEmail)
  return group.memberEmails?.includes(normalizedRequesterEmail) ?? false
}

function getStoredRole(group: StoredGroup, requesterEmail: string): GroupRole {
  const normalizedRequesterEmail = normalizeEmail(requesterEmail)

  if (group.ownerEmail === normalizedRequesterEmail) {
    return "owner"
  }

  return group.memberRoles?.[normalizedRequesterEmail] ?? "member"
}

function getStoredAccessRole(group: StoredGroup, memberEmail: string): GroupRole {
  const normalizedMemberEmail = normalizeEmail(memberEmail)

  if (group.ownerEmail === normalizedMemberEmail) {
    return "owner"
  }

  return normalizeGroupRole(group.memberRoles?.[normalizedMemberEmail])
}

function getAccessibleGroups(store: GroupStore, requesterEmail?: string) {
  return Object.values(store.groups).filter((group) =>
    hasAccess(group, requesterEmail)
  )
}

export async function getGroup(groupId?: string, requesterEmail?: string) {
  const store = await readStore()
  const accessibleGroups = getAccessibleGroups(store, requesterEmail)

  if (groupId) {
    const candidate = store.groups[groupId]
    if (candidate && hasAccess(candidate, requesterEmail)) {
      return cloneGroup(candidate, requesterEmail)
    }
  }

  const fallbackGroup =
    accessibleGroups[0] ?? store.groups[store.demoGroupId]

  if (!fallbackGroup) {
    throw new Error("Group not found")
  }

  return cloneGroup(fallbackGroup, requesterEmail)
}

export async function createGroup(input: CreateGroupInput, ownerEmail: string) {
  const store = await readStore()
  const normalizedOwnerEmail = normalizeEmail(ownerEmail)
  const groupId = `g-${randomUUID()}`
  const group: StoredGroup = {
    id: groupId,
    name: input.name.trim(),
    budgetMonthly: input.budgetMonthly,
    totalBalance: 0,
    members: input.memberNames.map((memberName, index) =>
      buildMember(memberName.trim(), index)
    ),
    transactions: [],
    recurringTransactions: [],
    ownerEmail: normalizedOwnerEmail,
    memberEmails: [normalizedOwnerEmail],
    memberRoles: {
      [normalizedOwnerEmail]: "owner",
    },
    activity: [
      buildActivityEvent({
        type: "group",
        title: "Workspace created",
        description: `${input.name.trim()} was created by ${normalizedOwnerEmail}.`,
      }),
    ],
  }

  store.groups[groupId] = group
  await writeStore(store)

  return cloneGroup(group, ownerEmail)
}

export async function updateGroupDetails(
  groupId: string,
  input: Pick<CreateGroupInput, "name" | "budgetMonthly">,
  requesterEmail: string
) {
  const store = await readStore()
  const group = store.groups[groupId]
  const normalizedRequesterEmail = normalizeEmail(requesterEmail)

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Group not found")
  }

  const updatedGroup: StoredGroup = {
    ...group,
    name: input.name.trim(),
    budgetMonthly: input.budgetMonthly,
    activity: [
      buildActivityEvent({
        type: "group",
        title: "Workspace updated",
        description: `${input.name.trim()} settings were updated by ${normalizedRequesterEmail}.`,
      }),
      ...(group.activity ?? []),
    ],
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function addTransaction(
  groupId: string,
  input: AddTransactionInput,
  requesterEmail: string
) {
  const store = await readStore()
  const group = store.groups[groupId]

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (!canCreateTransactions({ ...group, currentUserRole: requesterRole })) {
    throw new Error("Insufficient permissions")
  }

  const nextTransaction = buildTransaction(input)
  const recurringTransaction = buildRecurringTransaction(input)
  const members = group.members.map((member) => {
    if (member.id !== input.memberId || input.type !== "contribution") {
      return member
    }

    return {
      ...member,
      contribution: member.contribution + input.amount,
    }
  })

  const updatedGroup: StoredGroup = {
    ...group,
    totalBalance:
      input.type === "contribution"
        ? group.totalBalance + input.amount
        : group.totalBalance - input.amount,
    members,
    activity: [
      ...(recurringTransaction
        ? [
            buildActivityEvent({
              type: "transaction",
              title: "Recurring schedule created",
              description: `${input.description.trim()} will repeat ${recurringTransaction.frequency}.`,
            }),
          ]
        : []),
      buildActivityEvent({
        type: "transaction",
        title: input.type === "contribution" ? "Contribution recorded" : "Expense recorded",
        description:
          input.type === "contribution"
            ? `${input.memberName} added a contribution of ${formatCurrency(input.amount)}.`
            : `${input.memberName} logged ${input.description.trim()} for ${formatCurrency(input.amount)}.`,
      }),
      ...(group.activity ?? []),
    ],
    recurringTransactions: recurringTransaction
      ? [recurringTransaction, ...(group.recurringTransactions ?? [])]
      : group.recurringTransactions,
    transactions: [nextTransaction, ...group.transactions],
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function deleteTransaction(
  groupId: string,
  transactionId: string,
  requesterEmail: string
) {
  const store = await readStore()
  const group = store.groups[groupId]

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (!canModifyTransactions({ ...group, currentUserRole: requesterRole })) {
    throw new Error("Insufficient permissions")
  }

  const transaction = group.transactions.find((entry) => entry.id === transactionId)
  if (!transaction) {
    throw new Error("Transaction not found")
  }

  const members = group.members.map((member) => {
    if (transaction.type !== "contribution" || member.id !== transaction.memberId) {
      return member
    }

    return {
      ...member,
      contribution: Math.max(0, member.contribution - transaction.amount),
    }
  })

  const updatedGroup: StoredGroup = {
    ...group,
    totalBalance:
      transaction.type === "contribution"
        ? group.totalBalance - transaction.amount
        : group.totalBalance + transaction.amount,
    members,
    activity: [
      buildActivityEvent({
        type: "transaction",
        title: "Transaction removed",
        description: `${transaction.description} was removed from the ledger.`,
      }),
      ...(group.activity ?? []),
    ],
    transactions: group.transactions.filter((entry) => entry.id !== transactionId),
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

function getBalanceImpact(transaction: Pick<Transaction, "type" | "amount">) {
  return transaction.type === "contribution" ? transaction.amount : -transaction.amount
}

export async function updateTransaction(
  groupId: string,
  transactionId: string,
  input: AddTransactionInput,
  requesterEmail: string
) {
  const store = await readStore()
  const group = store.groups[groupId]

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (!canModifyTransactions({ ...group, currentUserRole: requesterRole })) {
    throw new Error("Insufficient permissions")
  }

  const existingTransaction = group.transactions.find((entry) => entry.id === transactionId)
  if (!existingTransaction) {
    throw new Error("Transaction not found")
  }

  const member = group.members.find((candidate) => candidate.id === input.memberId)
  if (!member) {
    throw new Error("Group not found")
  }

  const nextTransaction: Transaction = {
    ...existingTransaction,
    ...input,
    description: input.description.trim(),
    category: input.type === "contribution" ? "Contribution" : input.category,
    encryptedValue: input.isPrivate ? buildEncryptedValue(input.amount) : undefined,
  }

  const members = group.members.map((candidate) => {
    let nextContribution = candidate.contribution

    if (
      existingTransaction.type === "contribution" &&
      candidate.id === existingTransaction.memberId
    ) {
      nextContribution = Math.max(0, nextContribution - existingTransaction.amount)
    }

    if (nextTransaction.type === "contribution" && candidate.id === nextTransaction.memberId) {
      nextContribution += nextTransaction.amount
    }

    return nextContribution === candidate.contribution
      ? candidate
      : {
          ...candidate,
          contribution: nextContribution,
        }
  })

  const updatedGroup: StoredGroup = {
    ...group,
    totalBalance:
      group.totalBalance - getBalanceImpact(existingTransaction) + getBalanceImpact(nextTransaction),
    members,
    activity: [
      buildActivityEvent({
        type: "transaction",
        title: "Transaction updated",
        description: `${nextTransaction.description} was updated in the ledger.`,
      }),
      ...(group.activity ?? []),
    ],
    transactions: group.transactions.map((entry) =>
      entry.id === transactionId ? nextTransaction : entry
    ),
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function addMemberToGroup(
  groupId: string,
  memberEmail: string,
  requesterEmail: string,
  role: GroupRole = "member"
) {
  const store = await readStore()
  const group = store.groups[groupId]
  const normalizedMemberEmail = normalizeEmail(memberEmail)

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Group not found")
  }

  if (!isValidEmail(normalizedMemberEmail)) {
    throw new Error("Invite email is invalid.")
  }

  const nextMemberEmails = new Set(group.memberEmails ?? [])
  nextMemberEmails.add(normalizedMemberEmail)

  const updatedGroup: StoredGroup = {
    ...group,
    memberEmails: [...nextMemberEmails],
    memberRoles: {
      ...(group.memberRoles ?? {}),
      [normalizedMemberEmail]: role,
    },
    activity: [
      buildActivityEvent({
        type: "invite",
        title: "Access granted",
        description: `${normalizedMemberEmail} was added to the workspace as ${role}.`,
      }),
      ...(group.activity ?? []),
    ],
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function updateMemberAccess(
  groupId: string,
  memberEmail: string,
  requesterEmail: string,
  role: Exclude<GroupRole, "owner">
) {
  const store = await readStore()
  const group = store.groups[groupId]
  const normalizedMemberEmail = normalizeEmail(memberEmail)

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Group not found")
  }

  if (group.ownerEmail === normalizedMemberEmail) {
    throw new Error("Owner access cannot be changed.")
  }

  if (!(group.memberEmails ?? []).includes(normalizedMemberEmail)) {
    throw new Error("Access entry not found.")
  }

  const updatedGroup: StoredGroup = {
    ...group,
    memberRoles: {
      ...(group.memberRoles ?? {}),
      [normalizedMemberEmail]: role,
    },
    activity: [
      buildActivityEvent({
        type: "invite",
        title: "Access updated",
        description: `${normalizedMemberEmail} is now assigned the ${role} role.`,
      }),
      ...(group.activity ?? []),
    ],
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function removeMemberAccess(
  groupId: string,
  memberEmail: string,
  requesterEmail: string
) {
  const store = await readStore()
  const group = store.groups[groupId]
  const normalizedRequesterEmail = normalizeEmail(requesterEmail)
  const normalizedMemberEmail = normalizeEmail(memberEmail)

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Group not found")
  }

  if (group.ownerEmail === normalizedMemberEmail) {
    throw new Error("Owner access cannot be removed.")
  }

  if (normalizedRequesterEmail === normalizedMemberEmail) {
    throw new Error("You cannot remove your own access.")
  }

  if (!(group.memberEmails ?? []).includes(normalizedMemberEmail)) {
    throw new Error("Access entry not found.")
  }

  const nextMemberEmails = (group.memberEmails ?? []).filter(
    (email) => email !== normalizedMemberEmail
  )
  const nextMemberRoles = { ...(group.memberRoles ?? {}) }
  delete nextMemberRoles[normalizedMemberEmail]

  const updatedGroup: StoredGroup = {
    ...group,
    memberEmails: nextMemberEmails,
    memberRoles: nextMemberRoles,
    activity: [
      buildActivityEvent({
        type: "invite",
        title: "Access removed",
        description: `${normalizedMemberEmail} was removed from the workspace.`,
      }),
      ...(group.activity ?? []),
    ],
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function updateRecurringPlanState(
  groupId: string,
  planId: string,
  requesterEmail: string,
  active: boolean
) {
  const store = await readStore()
  const group = store.groups[groupId]

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const existingPlan = (group.recurringTransactions ?? []).find((plan) => plan.id === planId)
  if (!existingPlan) {
    throw new Error("Recurring plan not found")
  }

  const updatedGroup: StoredGroup = {
    ...group,
    recurringTransactions: (group.recurringTransactions ?? []).map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            active,
          }
        : plan
    ),
    activity: [
      buildActivityEvent({
        type: "transaction",
        title: active ? "Recurring plan resumed" : "Recurring plan paused",
        description: `${existingPlan.description} was ${active ? "resumed" : "paused"}.`,
      }),
      ...(group.activity ?? []),
    ],
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function deleteRecurringPlan(
  groupId: string,
  planId: string,
  requesterEmail: string
) {
  const store = await readStore()
  const group = store.groups[groupId]

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const existingPlan = (group.recurringTransactions ?? []).find((plan) => plan.id === planId)
  if (!existingPlan) {
    throw new Error("Recurring plan not found")
  }

  const updatedGroup: StoredGroup = {
    ...group,
    recurringTransactions: (group.recurringTransactions ?? []).filter(
      (plan) => plan.id !== planId
    ),
    activity: [
      buildActivityEvent({
        type: "transaction",
        title: "Recurring plan removed",
        description: `${existingPlan.description} was removed from recurring schedules.`,
      }),
      ...(group.activity ?? []),
    ],
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function processDueRecurringTransactions(
  groupId: string,
  requesterEmail: string,
  runDate = new Date().toISOString().split("T")[0] ?? ""
): Promise<RecurringJobResult> {
  const store = await readStore()
  const group = store.groups[groupId]

  if (!group || !hasAccess(group, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getStoredRole(group, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const duePlans = (group.recurringTransactions ?? []).filter(
    (plan) => plan.active && plan.nextRunDate <= runDate
  )

  if (duePlans.length === 0) {
    return {
      group: cloneGroup(group, requesterEmail),
      processedCount: 0,
      generatedTransactionIds: [],
    }
  }

  const generatedTransactions = duePlans.map(buildTransactionFromRecurringPlan)
  const generatedTransactionIds = generatedTransactions.map((transaction) => transaction.id)

  const members = group.members.map((member) => {
    const addedContribution = duePlans
      .filter((plan) => plan.type === "contribution" && plan.memberId === member.id)
      .reduce((sum, plan) => sum + plan.amount, 0)

    return addedContribution > 0
      ? {
          ...member,
          contribution: member.contribution + addedContribution,
        }
      : member
  })

  const balanceDelta = duePlans.reduce((sum, plan) => {
    return sum + (plan.type === "contribution" ? plan.amount : -plan.amount)
  }, 0)

  const recurringTransactions = (group.recurringTransactions ?? []).map((plan) =>
    duePlans.some((duePlan) => duePlan.id === plan.id)
      ? {
          ...plan,
          nextRunDate: addRecurringInterval(plan.nextRunDate, plan.frequency),
        }
      : plan
  )

  const updatedGroup: StoredGroup = {
    ...group,
    totalBalance: group.totalBalance + balanceDelta,
    members,
    recurringTransactions,
    activity: [
      ...duePlans.map((plan) =>
        buildActivityEvent({
          type: "transaction",
          title: "Recurring transaction executed",
          description: `${plan.description} ran automatically for ${formatCurrency(plan.amount)}.`,
        })
      ),
      ...(group.activity ?? []),
    ],
    transactions: [...generatedTransactions, ...group.transactions],
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return {
    group: cloneGroup(updatedGroup, requesterEmail),
    processedCount: duePlans.length,
    generatedTransactionIds,
  }
}
