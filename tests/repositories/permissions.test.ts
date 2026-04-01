import { describe, expect, it, vi } from "vitest"
import type { AddTransactionInput, CreateGroupInput } from "../../lib/types"
import { withTemporaryWorkspace } from "../utils/workspace"

describe("repository permissions", () => {
  it("allows members to add transactions but not delete them in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Permissions Team",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1200,
        } as CreateGroupInput,
        "owner@example.com"
      )

      await groupsRepository.addMemberToGroup(
        group.id,
        "member@example.com",
        "owner@example.com",
        "member"
      )

      const member = group.members[0]
      const updatedGroup = await groupsRepository.addTransaction(
        group.id,
        {
          description: "Treasury top-up",
          amount: 150,
          type: "contribution",
          memberId: member.id,
          memberName: member.name,
          isPrivate: false,
          category: "Contribution",
        } as AddTransactionInput,
        "member@example.com"
      )

      expect(updatedGroup.totalBalance).toBe(150)

      await expect(
        groupsRepository.deleteTransaction(
          group.id,
          updatedGroup.transactions[0]!.id,
          "member@example.com"
        )
      ).rejects.toThrow("Insufficient permissions")
    })
  }, 30000)

  it("prevents admins from promoting another member to admin in file mode", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const groupsRepository = await import("../../lib/repositories/groups")

      const group = await groupsRepository.createGroup(
        {
          name: "Role Controls",
          memberNames: ["Taylor Swift"],
          budgetMonthly: 1200,
        } as CreateGroupInput,
        "owner@example.com"
      )

      await groupsRepository.addMemberToGroup(
        group.id,
        "admin@example.com",
        "owner@example.com",
        "admin"
      )
      await groupsRepository.addMemberToGroup(
        group.id,
        "member@example.com",
        "owner@example.com",
        "member"
      )

      await expect(
        groupsRepository.updateMemberAccess(
          group.id,
          "member@example.com",
          "admin@example.com",
          "admin"
        )
      ).rejects.toThrow("Insufficient permissions")
    })
  }, 30000)
})
