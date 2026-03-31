import { describe, expect, it, vi } from "vitest"
import { withTemporaryWorkspace } from "../utils/workspace"

describe("auth store", () => {
  it("creates users and authenticates with normalized email addresses", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const authStore = await import("../../lib/auth-store")

      const user = await authStore.createUser({
        name: "Yasir",
        email: " YASIR@example.com ",
        password: "Passcode9",
      })

      expect(user.email).toBe("yasir@example.com")

      const authenticatedUser = await authStore.authenticateUser(
        "yasir@example.com",
        "Passcode9"
      )

      expect(authenticatedUser.id).toBe(user.id)
    })
  })

  it("expires sessions that are already past their expiry time", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const authStore = await import("../../lib/auth-store")
      const fs = await import("node:fs/promises")
      const path = await import("node:path")

      const user = await authStore.createUser({
        name: "Ada",
        email: "ada@example.com",
        password: "Secure123",
      })

      const sessionId = await authStore.createSession(user.id)
      const storePath = path.join(process.env.GHOSTLEDGER_DATA_DIR!, "auth.json")
      const rawStore = JSON.parse(await fs.readFile(storePath, "utf8")) as {
        users: unknown[]
        sessions: Array<{ id: string; expiresAt: string }>
      }

      rawStore.sessions = rawStore.sessions.map((session) =>
        session.id === sessionId
          ? { ...session, expiresAt: new Date(Date.now() - 60_000).toISOString() }
          : session
      )

      await fs.writeFile(storePath, JSON.stringify(rawStore, null, 2), "utf8")

      const sessionUser = await authStore.getUserBySession(sessionId)
      expect(sessionUser).toBeNull()
    })
  })
})
