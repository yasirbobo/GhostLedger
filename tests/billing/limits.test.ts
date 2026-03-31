import { describe, expect, it } from "vitest"
import { canAddSeat, canCreateRecurringPlan } from "../../lib/billing/limits"
import type { Group } from "../../lib/types"

const group: Group = {
  id: "group-1",
  name: "Ghost Team",
  budgetMonthly: 5000,
  totalBalance: 0,
  members: [],
  transactions: [],
  recurringTransactions: new Array(10).fill(null).map((_, index) => ({
    id: `rp-${index}`,
    description: "Recurring",
    amount: 10,
    type: "expense" as const,
    memberId: "m-1",
    memberName: "Taylor",
    isPrivate: false,
    category: "Software",
    frequency: "monthly" as const,
    nextRunDate: "2026-04-01",
    active: true,
  })),
  ownerEmail: "owner@example.com",
  memberEmails: [
    "owner@example.com",
    "member1@example.com",
    "member2@example.com",
    "member3@example.com",
    "member4@example.com",
  ],
}

describe("billing limits", () => {
  it("enforces starter seat limits", () => {
    expect(canAddSeat(group, "starter")).toBe(false)
    expect(canAddSeat(group, "scale")).toBe(true)
  })

  it("enforces recurring plan limits", () => {
    expect(canCreateRecurringPlan(group, "starter")).toBe(false)
    expect(canCreateRecurringPlan(group, "growth")).toBe(true)
  })
})
