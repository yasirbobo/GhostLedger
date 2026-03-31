import { afterEach, describe, expect, it, vi } from "vitest"
import { getAllBillingPlans } from "../../lib/billing/store"
import { buildBillingSnapshot } from "../../lib/billing/store"
import type { Group } from "../../lib/types"

const baseGroup: Group = {
  id: "group-1",
  name: "Ghost Team",
  budgetMonthly: 5000,
  totalBalance: 1200,
  members: [],
  transactions: [
    {
      id: "tx-1",
      description: "Contribution",
      amount: 200,
      type: "contribution",
      memberId: "m-1",
      memberName: "Taylor",
      date: "2026-03-01",
      isPrivate: false,
      category: "Contribution",
    },
  ],
  recurringTransactions: [
    {
      id: "rp-1",
      description: "Monthly dues",
      amount: 50,
      type: "contribution",
      memberId: "m-1",
      memberName: "Taylor",
      isPrivate: false,
      category: "Contribution",
      frequency: "monthly",
      nextRunDate: "2026-04-01",
      active: true,
    },
  ],
  ownerEmail: "owner@example.com",
  memberEmails: ["owner@example.com", "member@example.com"],
  invites: [
    {
      email: "pending@example.com",
      role: "member",
      status: "pending",
      token: "invite-token",
    },
  ],
}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  delete process.env.GHOSTLEDGER_STORAGE_MODE
})

describe("billing store", () => {
  it("builds a default starter snapshot from a group", () => {
    const billing = buildBillingSnapshot(baseGroup)

    expect(billing.plan).toBe("starter")
    expect(billing.usage.seats).toBe(2)
    expect(billing.usage.pendingInvites).toBe(1)
    expect(billing.usage.recurringPlans).toBe(1)
    expect(billing.limits.maxSeats).toBe(5)
  })

  it("returns all supported plans", () => {
    const plans = getAllBillingPlans()

    expect(plans.map((plan) => plan.id)).toEqual(["starter", "growth", "scale"])
  })

  it("reads and updates billing through prisma in database mode", async () => {
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const findUniqueMock = vi.fn(async () => ({
      groupId: "group-1",
      plan: "growth",
      status: "active",
      renewalDate: new Date("2026-04-30T00:00:00.000Z"),
    }))
    const upsertMock = vi.fn(async () => ({
      groupId: "group-1",
      plan: "scale",
      status: "active",
      renewalDate: new Date("2026-04-30T00:00:00.000Z"),
    }))

    vi.doMock("../../lib/db/client", () => ({
      getPrismaClient: () => ({
        billingSubscription: {
          findUnique: findUniqueMock,
          upsert: upsertMock,
        },
      }),
    }))

    const billingStore = await import("../../lib/billing/store")
    const current = await billingStore.getGroupBilling(baseGroup)
    const updated = await billingStore.updateGroupBillingPlan(baseGroup, "scale")

    expect(current.plan).toBe("growth")
    expect(updated.plan).toBe("scale")
    expect(findUniqueMock).toHaveBeenCalledWith({ where: { groupId: "group-1" } })
    expect(upsertMock).toHaveBeenCalled()
  })
})
