import { describe, expect, it, vi } from "vitest"
import { withTemporaryWorkspace } from "../utils/workspace"
import type { AddTransactionInput, CreateGroupInput } from "../../lib/types"

describe("group store", () => {
  it("creates an owned group and grants owner access", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const groupStore = await import("../../lib/group-store")

      const group = await groupStore.createGroup(
        {
          name: "Core Team",
          memberNames: ["Ada Lovelace", "Grace Hopper"],
          budgetMonthly: 3000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      expect(group.name).toBe("Core Team")
      expect(group.isOwner).toBe(true)
      expect(group.memberEmails).toContain("owner@example.com")
      expect(group.members).toHaveLength(2)
})
  }, 30000)

  it("updates totals and member contributions when adding and deleting a contribution", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const groupStore = await import("../../lib/group-store")

      const group = await groupStore.createGroup(
        {
          name: "Ops Fund",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1500,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      const updatedGroup = await groupStore.addTransaction(
        group.id,
        {
          description: "Seed funding",
          amount: 250,
          type: "contribution",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Contribution",
        } as AddTransactionInput,
        "owner@example.com"
      )

      expect(updatedGroup.totalBalance).toBe(250)
      expect(updatedGroup.members[0]?.contribution).toBe(250)

      const transactionId = updatedGroup.transactions[0]?.id
      expect(transactionId).toBeDefined()

      const afterDelete = await groupStore.deleteTransaction(
        group.id,
        transactionId!,
        "owner@example.com"
      )

      expect(afterDelete.totalBalance).toBe(0)
      expect(afterDelete.members[0]?.contribution).toBe(0)
      expect(afterDelete.transactions).toHaveLength(0)
    })
  }, 30000)

  it("creates a recurring schedule when a transaction includes recurrence", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const groupStore = await import("../../lib/group-store")

      const group = await groupStore.createGroup(
        {
          name: "Recurring Ops",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1500,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      const updatedGroup = await groupStore.addTransaction(
        group.id,
        {
          description: "Monthly hosting",
          amount: 95,
          type: "expense",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Software",
          recurrence: {
            frequency: "monthly",
            nextRunDate: "2026-04-01",
          },
        } as AddTransactionInput,
        "owner@example.com"
      )

      expect(updatedGroup.recurringTransactions).toHaveLength(1)
      expect(updatedGroup.recurringTransactions?.[0]?.description).toBe("Monthly hosting")
      expect(updatedGroup.recurringTransactions?.[0]?.frequency).toBe("monthly")
    })
  }, 30000)

  it("processes due recurring transactions and advances the next run date", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const groupStore = await import("../../lib/group-store")

      const group = await groupStore.createGroup(
        {
          name: "Recurring Engine",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1500,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      await groupStore.addTransaction(
        group.id,
        {
          description: "Monthly hosting",
          amount: 95,
          type: "expense",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Software",
          recurrence: {
            frequency: "monthly",
            nextRunDate: "2026-04-01",
          },
        } as AddTransactionInput,
        "owner@example.com"
      )

      const result = await groupStore.processDueRecurringTransactions(
        group.id,
        "owner@example.com",
        "2026-04-01"
      )

      expect(result.processedCount).toBe(1)
      expect(result.generatedTransactionIds).toHaveLength(1)
      expect(result.group.transactions[0]?.description).toBe("Monthly hosting")
      expect(result.group.recurringTransactions?.[0]?.nextRunDate).toBe("2026-05-01")
    })
  }, 30000)

  it("can pause and remove recurring plans", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const groupStore = await import("../../lib/group-store")

      const group = await groupStore.createGroup(
        {
          name: "Recurring Controls",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1500,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      const created = await groupStore.addTransaction(
        group.id,
        {
          description: "Weekly dues",
          amount: 25,
          type: "contribution",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Contribution",
          recurrence: {
            frequency: "weekly",
            nextRunDate: "2026-04-07",
          },
        } as AddTransactionInput,
        "owner@example.com"
      )

      const planId = created.recurringTransactions?.[0]?.id
      expect(planId).toBeDefined()

      const paused = await groupStore.updateRecurringPlanState(
        group.id,
        planId!,
        "owner@example.com",
        false
      )
      expect(paused.recurringTransactions?.[0]?.active).toBe(false)

      const removed = await groupStore.deleteRecurringPlan(
        group.id,
        planId!,
        "owner@example.com"
      )
      expect(removed.recurringTransactions).toHaveLength(0)
    })
  }, 30000)
})
