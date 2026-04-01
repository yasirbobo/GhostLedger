import { afterEach, describe, expect, it } from "vitest"
import { validateAppEnv } from "../../lib/security/env"

const mutableEnv = process.env as Record<string, string | undefined>

afterEach(() => {
  delete mutableEnv.NODE_ENV
  delete mutableEnv.GHOSTLEDGER_STORAGE_MODE
  delete mutableEnv.DATABASE_URL
  delete mutableEnv.OPENAI_API_KEY
  delete mutableEnv.OPENAI_MODEL
})

describe("environment validation", () => {
  it("fails database mode without DATABASE_URL", () => {
    mutableEnv.GHOSTLEDGER_STORAGE_MODE = "database"

    const result = validateAppEnv()

    expect(result.isValid).toBe(false)
    expect(result.issues).toContain(
      "DATABASE_URL is required when GHOSTLEDGER_STORAGE_MODE=database."
    )
  })

  it("warns when production uses file mode", () => {
    mutableEnv.NODE_ENV = "production"
    mutableEnv.GHOSTLEDGER_STORAGE_MODE = "file"

    const result = validateAppEnv()

    expect(result.isValid).toBe(true)
    expect(result.warnings).toContain(
      "Production is running in file storage mode. Use database mode for launch."
    )
  })

  it("warns when OPENAI_API_KEY is missing", () => {
    const result = validateAppEnv()

    expect(result.warnings).toContain(
      "OPENAI_API_KEY is not configured. AI responses will use deterministic fallback."
    )
  })
})
