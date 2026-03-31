import { afterEach, describe, expect, it, vi } from "vitest"
import { withTemporaryWorkspace } from "../utils/workspace"

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  delete process.env.GHOSTLEDGER_STORAGE_MODE
})

describe("email client", () => {
  it("stores sent messages in the local outbox", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const emailClient = await import("../../lib/email/client")

      const sent = await emailClient.sendEmail({
        to: "owner@example.com",
        subject: "GhostLedger test",
        body: "This is a test delivery.",
      })

      const outbox = await emailClient.listEmails()

      expect(sent.id).toBeDefined()
      expect(outbox[0]?.subject).toBe("GhostLedger test")
      expect(outbox[0]?.to).toBe("owner@example.com")
    })
  })

  it("stores sent messages in prisma-backed mode", async () => {
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const createMock = vi.fn(async ({ data }) => ({
      ...data,
      createdAt: new Date("2026-03-30T00:00:00.000Z"),
    }))
    const findManyMock = vi.fn(async () => [
      {
        id: "mail-db-1",
        to: "owner@example.com",
        subject: "GhostLedger db test",
        body: "Database-backed outbox",
        createdAt: new Date("2026-03-30T00:00:00.000Z"),
      },
    ])

    vi.doMock("../../lib/db/client", () => ({
      getPrismaClient: () => ({
        emailOutboxMessage: {
          create: createMock,
          findMany: findManyMock,
        },
      }),
    }))

    const emailClient = await import("../../lib/email/client")

    const sent = await emailClient.sendEmail({
      to: "owner@example.com",
      subject: "GhostLedger db test",
      body: "Database-backed outbox",
    })

    const outbox = await emailClient.listEmails()

    expect(sent.subject).toBe("GhostLedger db test")
    expect(outbox[0]?.subject).toBe("GhostLedger db test")
    expect(createMock).toHaveBeenCalled()
    expect(findManyMock).toHaveBeenCalled()
  })
})
