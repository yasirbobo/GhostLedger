import { describe, expect, it } from "vitest"
import { consumeRateLimit } from "../../lib/security/rate-limit"

describe("rate limiting", () => {
  it("allows requests until the configured limit is reached", () => {
    const first = consumeRateLimit({
      key: "test:limit",
      limit: 2,
      windowMs: 60_000,
    })
    const second = consumeRateLimit({
      key: "test:limit",
      limit: 2,
      windowMs: 60_000,
    })
    const third = consumeRateLimit({
      key: "test:limit",
      limit: 2,
      windowMs: 60_000,
    })

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
  })
})
