import { describe, expect, it } from "vitest"
import { loginSchema, signupSchema } from "../../lib/validation/auth"

describe("auth validation", () => {
  it("accepts valid sign-in payloads", () => {
    const result = loginSchema.safeParse({
      email: " owner@example.com ",
      password: "secret123",
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data.email).toBe("owner@example.com")
  })

  it("rejects weak sign-up passwords", () => {
    const result = signupSchema.safeParse({
      name: "Yasir",
      email: "yasir@example.com",
      password: "password",
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(
      "Password must include at least one number."
    )
  })
})
