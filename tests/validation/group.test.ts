import { describe, expect, it } from "vitest"
import {
  addTransactionSchema,
  createGroupSchema,
  inviteMemberSchema,
} from "../../lib/validation/group"

describe("group validation", () => {
  it("normalizes contribution categories", () => {
    const result = addTransactionSchema.safeParse({
      description: " Initial funding ",
      amount: 500,
      type: "contribution",
      memberId: "m-1",
      memberName: "Taylor",
      isPrivate: true,
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data.category).toBe("Contribution")
  })

  it("requires a category for expenses", () => {
    const result = addTransactionSchema.safeParse({
      description: "Lunch",
      amount: 40,
      type: "expense",
      memberId: "m-1",
      memberName: "Taylor",
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Category is required for expenses.")
  })

  it("rejects empty group members and bad invite emails", () => {
    const groupResult = createGroupSchema.safeParse({
      name: "Ops",
      memberNames: [],
      budgetMonthly: 0,
    })
    const inviteResult = inviteMemberSchema.safeParse({
      email: "bad-email",
    })

    expect(groupResult.success).toBe(false)
    expect(groupResult.error?.issues[0]?.message).toBe("Add at least one team member.")
    expect(inviteResult.success).toBe(false)
    expect(inviteResult.error?.issues[0]?.message).toBe("Enter a valid invite email.")
  })
})
