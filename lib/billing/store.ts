import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { BILLING_PLANS, getBillingPlan } from "./plans"
import { getPrismaClient } from "../db/client"
import { isDatabaseMode } from "../persistence/mode"
import type { BillingPlan, Group, GroupBilling } from "../types"

interface BillingRecord {
  plan: BillingPlan
  status: "trialing" | "active"
  renewalDate: string
}

interface BillingStore {
  groups: Record<string, BillingRecord>
}

const DATA_DIR = process.env.GHOSTLEDGER_DATA_DIR ?? path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "billing.json")

function buildInitialStore(): BillingStore {
  return {
    groups: {},
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

async function readStore(): Promise<BillingStore> {
  await ensureStore()
  const rawStore = await readFile(STORE_PATH, "utf8")
  return JSON.parse(rawStore) as BillingStore
}

async function writeStore(store: BillingStore) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8")
}

function buildDefaultRecord(): BillingRecord {
  const renewalDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    .toISOString()
    .split("T")[0] ?? ""

  return {
    plan: "starter",
    status: "trialing",
    renewalDate,
  }
}

export function buildBillingSnapshot(group: Group, record?: BillingRecord): GroupBilling {
  const effectiveRecord = record ?? buildDefaultRecord()
  const plan = getBillingPlan(effectiveRecord.plan)

  return {
    groupId: group.id,
    plan: effectiveRecord.plan,
    status: effectiveRecord.status,
    renewalDate: effectiveRecord.renewalDate,
    priceMonthly: plan.priceMonthly,
    usage: {
      seats: group.memberEmails?.length ?? (group.ownerEmail ? 1 : 0),
      pendingInvites: (group.invites ?? []).filter((invite) => invite.status === "pending").length,
      recurringPlans: (group.recurringTransactions ?? []).length,
      transactions: group.transactions.length,
    },
    limits: plan.limits,
  }
}

export async function getGroupBilling(group: Group) {
  if (isDatabaseMode()) {
    const prisma = getPrismaClient()
    const record = await prisma.billingSubscription.findUnique({
      where: { groupId: group.id },
    })

    return buildBillingSnapshot(
      group,
      record
        ? {
            plan: record.plan as BillingPlan,
            status: record.status as "trialing" | "active",
            renewalDate: record.renewalDate.toISOString().split("T")[0] ?? "",
          }
        : undefined
    )
  }

  const store = await readStore()
  return buildBillingSnapshot(group, store.groups[group.id])
}

export async function updateGroupBillingPlan(group: Group, plan: BillingPlan) {
  if (isDatabaseMode()) {
    const prisma = getPrismaClient()
    const existingRecord = await prisma.billingSubscription.findUnique({
      where: { groupId: group.id },
    })
    const fallback = existingRecord
      ? {
          plan: existingRecord.plan as BillingPlan,
          status: existingRecord.status as "trialing" | "active",
          renewalDate: existingRecord.renewalDate.toISOString().split("T")[0] ?? "",
        }
      : buildDefaultRecord()

    const updated = await prisma.billingSubscription.upsert({
      where: { groupId: group.id },
      update: {
        plan,
        status: "active",
        renewalDate: new Date(`${fallback.renewalDate}T00:00:00.000Z`),
      },
      create: {
        groupId: group.id,
        plan,
        status: "active",
        renewalDate: new Date(`${fallback.renewalDate}T00:00:00.000Z`),
      },
    })

    return buildBillingSnapshot(group, {
      plan: updated.plan as BillingPlan,
      status: updated.status as "trialing" | "active",
      renewalDate: updated.renewalDate.toISOString().split("T")[0] ?? "",
    })
  }

  const store = await readStore()
  const previousRecord = store.groups[group.id] ?? buildDefaultRecord()
  store.groups[group.id] = {
    ...previousRecord,
    plan,
    status: "active",
  }
  await writeStore(store)

  return buildBillingSnapshot(group, store.groups[group.id])
}

export function getAllBillingPlans() {
  return Object.values(BILLING_PLANS)
}
