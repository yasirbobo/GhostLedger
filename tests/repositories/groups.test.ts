import { describe, expect, it, vi } from "vitest"
import { withTemporaryWorkspace } from "../utils/workspace"
import type { AddTransactionInput, CreateGroupInput } from "../../lib/types"

describe("group repository", () => {
  it("creates groups through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Launch Team",
          memberNames: ["Ada Lovelace", "Grace Hopper"],
          budgetMonthly: 2400,
        } as CreateGroupInput,
        "owner@example.com"
      )

      expect(group.name).toBe("Launch Team")
      expect(group.isOwner).toBe(true)
      expect(group.memberEmails).toContain("owner@example.com")
      expect(group.members).toHaveLength(2)
    })
  }, 15000)

  it("adds and deletes transactions through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Ops Team",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      const updatedGroup = await groupsRepository.addTransaction(
        group.id,
        {
          description: "Seed contribution",
          amount: 300,
          type: "contribution",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Contribution",
        } as AddTransactionInput,
        "owner@example.com"
      )

      expect(updatedGroup.totalBalance).toBe(300)
      expect(updatedGroup.members[0]?.contribution).toBe(300)

      const transactionId = updatedGroup.transactions[0]?.id
      expect(transactionId).toBeDefined()

      const afterDelete = await groupsRepository.deleteTransaction(
        group.id,
        transactionId!,
        "owner@example.com"
      )

      expect(afterDelete.totalBalance).toBe(0)
      expect(afterDelete.members[0]?.contribution).toBe(0)
      expect(afterDelete.transactions).toHaveLength(0)
    })
  }, 30000)

  it("updates transactions through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Finance Team",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      const createdGroup = await groupsRepository.addTransaction(
        group.id,
        {
          description: "Office lunch",
          amount: 120,
          type: "expense",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Food",
        } as AddTransactionInput,
        "owner@example.com"
      )

      const transactionId = createdGroup.transactions[0]!.id
      const updatedGroup = await groupsRepository.updateTransaction(
        group.id,
        transactionId,
        {
          description: "Quarterly contribution",
          amount: 400,
          type: "contribution",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Contribution",
        } as AddTransactionInput,
        "owner@example.com"
      )

      expect(updatedGroup.totalBalance).toBe(400)
      expect(updatedGroup.members[0]?.contribution).toBe(400)
      expect(updatedGroup.transactions[0]?.description).toBe("Quarterly contribution")
    })
  }, 30000)

  it("adds member access through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Access Team",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const updatedGroup = await groupsRepository.addMemberToGroup(
        group.id,
        "newmember@example.com",
        "owner@example.com"
      )

      expect(updatedGroup.memberEmails).toContain("newmember@example.com")
      expect(updatedGroup.isOwner).toBe(true)
    })
  }, 15000)

  it("updates and removes member access through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Admin Team",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      await groupsRepository.addMemberToGroup(
        group.id,
        "member@example.com",
        "owner@example.com"
      )

      const updatedGroup = await groupsRepository.updateMemberAccess(
        group.id,
        "member@example.com",
        "owner@example.com",
        "admin"
      )

      expect(updatedGroup.invites?.find((entry) => entry.email === "member@example.com")?.role).toBe(
        "admin"
      )

      const removedGroup = await groupsRepository.removeMemberAccess(
        group.id,
        "member@example.com",
        "owner@example.com"
      )

      expect(removedGroup.memberEmails).not.toContain("member@example.com")
    })
  }, 15000)

  it("persists recurring schedules through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Recurring Team",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      const updatedGroup = await groupsRepository.addTransaction(
        group.id,
        {
          description: "Monthly treasury top-up",
          amount: 250,
          type: "contribution",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Contribution",
          recurrence: {
            frequency: "monthly",
            nextRunDate: "2026-04-05",
          },
        } as AddTransactionInput,
        "owner@example.com"
      )

      expect(updatedGroup.recurringTransactions).toHaveLength(1)
      expect(updatedGroup.recurringTransactions?.[0]?.nextRunDate).toBe("2026-04-05")
    })
  }, 15000)

  it("updates workspace settings through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Original Team",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const updatedGroup = await groupsRepository.updateGroup(
        group.id,
        {
          name: "Updated Team",
          budgetMonthly: 1800,
        },
        "owner@example.com"
      )

      expect(updatedGroup.name).toBe("Updated Team")
      expect(updatedGroup.budgetMonthly).toBe(1800)
    })
  }, 15000)

  it("processes recurring plans through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Recurring Processor",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      await groupsRepository.addTransaction(
        group.id,
        {
          description: "Weekly treasury top-up",
          amount: 75,
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

      const result = await groupsRepository.processDueRecurringTransactions(
        group.id,
        "owner@example.com",
        "2026-04-07"
      )

      expect(result.processedCount).toBe(1)
      expect(result.group.totalBalance).toBe(150)
    })
  }, 15000)

  it("updates recurring plan state through the repository facade in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Recurring Admin",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1000,
        } as CreateGroupInput,
        "owner@example.com"
      )

      const member = group.members[0]
      const created = await groupsRepository.addTransaction(
        group.id,
        {
          description: "Weekly treasury top-up",
          amount: 75,
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

      const paused = await groupsRepository.updateRecurringPlanState(
        group.id,
        planId!,
        "owner@example.com",
        false
      )
      expect(paused.recurringTransactions?.[0]?.active).toBe(false)

      const removed = await groupsRepository.deleteRecurringPlan(
        group.id,
        planId!,
        "owner@example.com"
      )
      expect(removed.recurringTransactions).toHaveLength(0)
    })
  }, 30000)
})
