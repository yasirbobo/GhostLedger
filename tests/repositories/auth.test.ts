import { describe, expect, it, vi } from "vitest"
import { withTemporaryWorkspace } from "../utils/workspace"

describe("auth repository", () => {
  it("uses file mode to create, authenticate, and resolve a session", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const authRepository = await import("../../lib/repositories/auth")

      const user = await authRepository.createUser({
        name: "Sam",
        email: " SAM@example.com ",
        password: "Password9",
      })

      const authenticatedUser = await authRepository.authenticateUser(
        "sam@example.com",
        "Password9"
      )
      const sessionId = await authRepository.createSession(user.id)
      const sessionUser = await authRepository.getUserBySession(sessionId)

      expect(authenticatedUser.email).toBe("sam@example.com")
      expect(sessionUser?.id).toBe(user.id)
    })
  }, 15000)

  it("deletes file-mode sessions through the repository facade", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      process.env.GHOSTLEDGER_STORAGE_MODE = "file"
      const authRepository = await import("../../lib/repositories/auth")

      const user = await authRepository.createUser({
        name: "Mina",
        email: "mina@example.com",
        password: "Password9",
      })

      const sessionId = await authRepository.createSession(user.id)
      await authRepository.deleteSession(sessionId)

      const sessionUser = await authRepository.getUserBySession(sessionId)
      expect(sessionUser).toBeNull()
    })
  }, 15000)
})
