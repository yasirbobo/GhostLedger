import { describe, expect, it } from "vitest"
import {
  canAssignRole,
  canChangeRole,
  canManageBilling,
  canModifyTransactions,
  canRemoveRole,
} from "../../lib/authz/group-permissions"
import type { Group } from "../../lib/types"

function buildGroup(currentUserRole: Group["currentUserRole"]): Group {
  return {
    id: "group-1",
    name: "GhostLedger",
    budgetMonthly: 1000,
    totalBalance: 0,
    members: [],
    transactions: [],
    currentUserRole,
  }
}

describe("group permissions", () => {
  it("restricts billing management to owners", () => {
    expect(canManageBilling(buildGroup("owner"))).toBe(true)
    expect(canManageBilling(buildGroup("admin"))).toBe(false)
    expect(canManageBilling(buildGroup("member"))).toBe(false)
  })

  it("restricts transaction edits to owners and admins", () => {
    expect(canModifyTransactions(buildGroup("owner"))).toBe(true)
    expect(canModifyTransactions(buildGroup("admin"))).toBe(true)
    expect(canModifyTransactions(buildGroup("member"))).toBe(false)
  })

  it("prevents admins from assigning or changing admin access", () => {
    expect(canAssignRole("admin", "admin")).toBe(false)
    expect(canAssignRole("admin", "member")).toBe(true)
    expect(canChangeRole("admin", "member", "admin")).toBe(false)
    expect(canChangeRole("admin", "member", "viewer")).toBe(true)
  })

  it("prevents admins from removing admin or owner access", () => {
    expect(canRemoveRole("admin", "viewer")).toBe(true)
    expect(canRemoveRole("admin", "member")).toBe(true)
    expect(canRemoveRole("admin", "admin")).toBe(false)
    expect(canRemoveRole("admin", "owner")).toBe(false)
  })
})
