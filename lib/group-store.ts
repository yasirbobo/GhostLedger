import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { buildEncryptedValue } from "@/lib/group-analytics"
import { isValidEmail } from "@/lib/auth-store"
import { mockGroup } from "@/lib/mock-data"
import type { AddTransactionInput, CreateGroupInput, Group, Member, Transaction } from "@/lib/types"

interface StoredGroup extends Group {
  ownerEmail?: string
  memberEmails?: string[]
}

interface GroupStore {
  demoGroupId: string
  groups: Record<string, StoredGroup>
}

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "groups.json")

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function cloneGroup(group: StoredGroup, requesterEmail?: string): Group {
  const normalizedRequesterEmail = requesterEmail
    ? normalizeEmail(requesterEmail)
    : undefined

  return {
    ...group,
    ownerEmail: group.ownerEmail,
    memberEmails: group.memberEmails ? [...group.memberEmails] : undefined,
    isOwner:
      normalizedRequesterEmail !== undefined &&
      group.ownerEmail === normalizedRequesterEmail,
    members: group.members.map((member) => ({ ...member })),
    transactions: group.transactions.map((transaction) => ({ ...transaction })),
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
    ownerEmail: normalizedOwnerEmail,
    memberEmails: [normalizedOwnerEmail],
  }

  store.groups[groupId] = group
  await writeStore(store)

  return cloneGroup(group, ownerEmail)
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

  const nextTransaction = buildTransaction(input)
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
    transactions: group.transactions.filter((entry) => entry.id !== transactionId),
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}

export async function addMemberToGroup(
  groupId: string,
  memberEmail: string,
  requesterEmail: string
) {
  const store = await readStore()
  const group = store.groups[groupId]
  const normalizedRequesterEmail = normalizeEmail(requesterEmail)
  const normalizedMemberEmail = normalizeEmail(memberEmail)

  if (!group || group.ownerEmail !== normalizedRequesterEmail) {
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
  }

  store.groups[groupId] = updatedGroup
  await writeStore(store)

  return cloneGroup(updatedGroup, requesterEmail)
}
