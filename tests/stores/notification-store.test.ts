import { describe, expect, it, vi } from "vitest"
import { withTemporaryWorkspace } from "../utils/workspace"

describe("notification store", () => {
  it("returns defaults and persists updated preferences", async () => {
    await withTemporaryWorkspace(async () => {
      vi.resetModules()
      const notificationStore = await import("../../lib/notification-store")

      const initial = await notificationStore.getNotificationPreferences("owner@example.com")
      expect(initial.monthlySummary).toBe(true)
      expect(initial.budgetAlerts).toBe(true)

      const updated = await notificationStore.updateNotificationPreferences(
        "owner@example.com",
        {
          monthlySummary: false,
          budgetAlerts: true,
          recurringReminders: false,
          inviteUpdates: true,
        }
      )

      expect(updated.monthlySummary).toBe(false)

      const reloaded = await notificationStore.getNotificationPreferences("owner@example.com")
      expect(reloaded.monthlySummary).toBe(false)
      expect(reloaded.recurringReminders).toBe(false)
    })
  })

  it("returns defaults in database mode when no preference exists", async () => {
    vi.resetModules()
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const findUnique = vi.fn(async () => ({
      notificationPreference: null,
    }))

    vi.doMock("../../lib/db/client", () => ({
      getPrismaClient: () => ({
        user: {
          findUnique,
        },
      }),
    }))

    const notificationStore = await import("../../lib/notification-store")
    const preferences = await notificationStore.getNotificationPreferences("owner@example.com")

    expect(findUnique).toHaveBeenCalled()
    expect(preferences.monthlySummary).toBe(true)
    expect(preferences.recurringReminders).toBe(true)
  })

  it("persists preferences in database mode", async () => {
    vi.resetModules()
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const findUnique = vi.fn(async () => ({
      id: "user-1",
      email: "owner@example.com",
    }))
    const upsert = vi.fn(async () => ({}))

    vi.doMock("../../lib/db/client", () => ({
      getPrismaClient: () => ({
        user: {
          findUnique,
        },
        notificationPreference: {
          upsert,
        },
      }),
    }))

    const notificationStore = await import("../../lib/notification-store")
    const preferences = await notificationStore.updateNotificationPreferences(
      "owner@example.com",
      {
        monthlySummary: false,
        budgetAlerts: true,
        recurringReminders: false,
        inviteUpdates: true,
      }
    )

    expect(findUnique).toHaveBeenCalled()
    expect(upsert).toHaveBeenCalled()
    expect(preferences.monthlySummary).toBe(false)
  })
})
