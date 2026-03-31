import { afterEach, describe, expect, it, vi } from "vitest"
import type { AddTransactionInput, CreateGroupInput } from "../../lib/types"
import { withTemporaryWorkspace } from "../utils/workspace"

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  delete process.env.GHOSTLEDGER_STORAGE_MODE
})

describe("group repository database mode", () => {
  it("delegates group loading and creation to the database repository", async () => {
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const findGroupWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 0,
      members: [],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))
    const createGroupWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 0,
      members: [],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))
    const updateGroupWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "Updated DB Group",
      budgetMonthly: 3200,
      totalBalance: 0,
      members: [],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))
    const processDueRecurringTransactionsInWorkspaceMock = vi.fn(async () => ({
      group: {
        id: "group-db-1",
        name: "Updated DB Group",
        budgetMonthly: 3200,
        totalBalance: 0,
        members: [],
        transactions: [],
        ownerEmail: "owner@example.com",
        memberEmails: ["owner@example.com"],
        isOwner: true,
      },
      processedCount: 0,
      generatedTransactionIds: [],
    }))

    vi.doMock("../../lib/db/repositories/group-repository", () => ({
      addMemberAccessToWorkspace: vi.fn(),
      addTransactionToWorkspace: vi.fn(),
      createGroupWorkspace: createGroupWorkspaceMock,
      deleteTransactionFromWorkspace: vi.fn(),
      findGroupWorkspace: findGroupWorkspaceMock,
      removeMemberAccessFromWorkspace: vi.fn(),
      processDueRecurringTransactionsInWorkspace: processDueRecurringTransactionsInWorkspaceMock,
      updateMemberAccessInWorkspace: vi.fn(),
      updateGroupWorkspace: updateGroupWorkspaceMock,
    }))

    const groupsRepository = await import("../../lib/repositories/groups")

    const createdGroup = await groupsRepository.createGroup(
      {
        name: "DB Group",
        memberNames: [],
        budgetMonthly: 2500,
      } as CreateGroupInput,
      "owner@example.com"
    )
    const loadedGroup = await groupsRepository.getGroup("group-db-1", "owner@example.com")
    const updatedGroup = await groupsRepository.updateGroup(
      "group-db-1",
      {
        name: "Updated DB Group",
        budgetMonthly: 3200,
      },
      "owner@example.com"
    )
    const recurringResult = await groupsRepository.processDueRecurringTransactions(
      "group-db-1",
      "owner@example.com",
      "2026-04-01"
    )

    expect(createGroupWorkspaceMock).toHaveBeenCalledOnce()
    expect(findGroupWorkspaceMock).toHaveBeenCalledWith("group-db-1", "owner@example.com")
    expect(createdGroup.id).toBe("group-db-1")
    expect(loadedGroup?.id).toBe("group-db-1")
    expect(updatedGroup.name).toBe("Updated DB Group")
    expect(recurringResult.processedCount).toBe(0)
  })

  it("falls back when the database repository returns no group", async () => {
    await withTemporaryWorkspace(async () => {
      process.env.GHOSTLEDGER_STORAGE_MODE = "database"

      const findGroupWorkspaceMock = vi.fn(async () => null)

      vi.doMock("../../lib/db/repositories/group-repository", () => ({
        addMemberAccessToWorkspace: vi.fn(),
        addTransactionToWorkspace: vi.fn(),
        createGroupWorkspace: vi.fn(),
        deleteTransactionFromWorkspace: vi.fn(),
        findGroupWorkspace: findGroupWorkspaceMock,
        processDueRecurringTransactionsInWorkspace: vi.fn(async () => ({
          group: null,
          processedCount: 0,
          generatedTransactionIds: [],
        })),
        updateGroupWorkspace: vi.fn(),
      }))

      const groupsRepository = await import("../../lib/repositories/groups")
      const group = await groupsRepository.getGroup("missing-db-group", "owner@example.com")

      expect(findGroupWorkspaceMock).toHaveBeenCalledWith(
        "missing-db-group",
        "owner@example.com"
      )
      expect(group).toBeDefined()
    })
  })

  it("delegates transaction and member access mutations to the database repository", async () => {
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const addTransactionToWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 300,
      members: [{ id: "m-1", name: "Taylor", avatar: "T", walletAddress: "0x1", contribution: 300 }],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))
    const deleteTransactionFromWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 0,
      members: [{ id: "m-1", name: "Taylor", avatar: "T", walletAddress: "0x1", contribution: 0 }],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))
    const updateTransactionInWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 450,
      members: [{ id: "m-1", name: "Taylor", avatar: "T", walletAddress: "0x1", contribution: 450 }],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))
    const addMemberAccessToWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 0,
      members: [],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com", "newmember@example.com"],
      isOwner: true,
    }))
    const updateMemberAccessInWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 0,
      members: [],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com", "newmember@example.com"],
      isOwner: true,
    }))
    const removeMemberAccessFromWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 0,
      members: [],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))
    const updateRecurringPlanStateInWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 0,
      members: [],
      transactions: [],
      recurringTransactions: [{ id: "plan-1", active: false }],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))
    const deleteRecurringPlanFromWorkspaceMock = vi.fn(async () => ({
      id: "group-db-1",
      name: "DB Group",
      budgetMonthly: 2500,
      totalBalance: 0,
      members: [],
      transactions: [],
      recurringTransactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com"],
      isOwner: true,
    }))

    vi.doMock("../../lib/db/repositories/group-repository", () => ({
      addMemberAccessToWorkspace: addMemberAccessToWorkspaceMock,
      addTransactionToWorkspace: addTransactionToWorkspaceMock,
      createGroupWorkspace: vi.fn(),
      deleteRecurringPlanFromWorkspace: deleteRecurringPlanFromWorkspaceMock,
      deleteTransactionFromWorkspace: deleteTransactionFromWorkspaceMock,
      findGroupWorkspace: vi.fn(),
      removeMemberAccessFromWorkspace: removeMemberAccessFromWorkspaceMock,
      processDueRecurringTransactionsInWorkspace: vi.fn(),
      updateRecurringPlanStateInWorkspace: updateRecurringPlanStateInWorkspaceMock,
      updateGroupWorkspace: vi.fn(),
      updateMemberAccessInWorkspace: updateMemberAccessInWorkspaceMock,
      updateTransactionInWorkspace: updateTransactionInWorkspaceMock,
    }))

    const groupsRepository = await import("../../lib/repositories/groups")

    await groupsRepository.addTransaction(
      "group-db-1",
      {
        description: "Seed contribution",
        amount: 300,
        type: "contribution",
        memberId: "m-1",
        memberName: "Taylor",
        isPrivate: false,
        category: "Contribution",
      } as AddTransactionInput,
      "owner@example.com"
    )
    await groupsRepository.deleteTransaction("group-db-1", "tx-1", "owner@example.com")
    await groupsRepository.updateTransaction(
      "group-db-1",
      "tx-1",
      {
        description: "Revised contribution",
        amount: 450,
        type: "contribution",
        memberId: "m-1",
        memberName: "Taylor",
        isPrivate: false,
        category: "Contribution",
      } as AddTransactionInput,
      "owner@example.com"
    )
    const updatedGroup = await groupsRepository.addMemberToGroup(
      "group-db-1",
      "newmember@example.com",
      "owner@example.com"
    )
    await groupsRepository.updateMemberAccess(
      "group-db-1",
      "newmember@example.com",
      "owner@example.com",
      "admin"
    )
    await groupsRepository.removeMemberAccess(
      "group-db-1",
      "newmember@example.com",
      "owner@example.com"
    )
    await groupsRepository.updateRecurringPlanState(
      "group-db-1",
      "plan-1",
      "owner@example.com",
      false
    )
    await groupsRepository.deleteRecurringPlan(
      "group-db-1",
      "plan-1",
      "owner@example.com"
    )

    expect(addTransactionToWorkspaceMock).toHaveBeenCalledOnce()
    expect(deleteTransactionFromWorkspaceMock).toHaveBeenCalledWith(
      "group-db-1",
      "tx-1",
      "owner@example.com"
    )
    expect(updateTransactionInWorkspaceMock).toHaveBeenCalledWith(
      "group-db-1",
      "tx-1",
      expect.objectContaining({ amount: 450, description: "Revised contribution" }),
      "owner@example.com"
    )
    expect(addMemberAccessToWorkspaceMock).toHaveBeenCalledWith(
      "group-db-1",
      "newmember@example.com",
      "owner@example.com",
      "member"
    )
    expect(updateMemberAccessInWorkspaceMock).toHaveBeenCalledWith(
      "group-db-1",
      "newmember@example.com",
      "owner@example.com",
      "admin"
    )
    expect(removeMemberAccessFromWorkspaceMock).toHaveBeenCalledWith(
      "group-db-1",
      "newmember@example.com",
      "owner@example.com"
    )
    expect(updateRecurringPlanStateInWorkspaceMock).toHaveBeenCalledWith(
      "group-db-1",
      "plan-1",
      "owner@example.com",
      false
    )
    expect(deleteRecurringPlanFromWorkspaceMock).toHaveBeenCalledWith(
      "group-db-1",
      "plan-1",
      "owner@example.com"
    )
    expect(updatedGroup.memberEmails).toContain("newmember@example.com")
  })
})
