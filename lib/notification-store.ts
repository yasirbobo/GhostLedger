import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { getPrismaClient } from "./db/client"
import { isDatabaseMode } from "./persistence/mode"
import type { NotificationPreferences } from "./types"

interface NotificationStore {
  preferencesByEmail: Record<string, NotificationPreferences>
}

const DATA_DIR = process.env.GHOSTLEDGER_DATA_DIR ?? path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "notifications.json")

const defaultPreferences: NotificationPreferences = {
  monthlySummary: true,
  budgetAlerts: true,
  recurringReminders: true,
  inviteUpdates: true,
}

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await readFile(STORE_PATH, "utf8")
  } catch {
    const initialStore: NotificationStore = {
      preferencesByEmail: {},
    }
    await writeFile(STORE_PATH, JSON.stringify(initialStore, null, 2), "utf8")
  }
}

async function readStore() {
  await ensureStore()
  return JSON.parse(await readFile(STORE_PATH, "utf8")) as NotificationStore
}

async function writeStore(store: NotificationStore) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8")
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function getNotificationPreferences(email: string) {
  if (isDatabaseMode()) {
    const prisma = getPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      include: {
        notificationPreference: true,
      },
    })

    if (!user?.notificationPreference) {
      return defaultPreferences
    }

    return {
      monthlySummary: user.notificationPreference.monthlySummary,
      budgetAlerts: user.notificationPreference.budgetAlerts,
      recurringReminders: user.notificationPreference.recurringReminders,
      inviteUpdates: user.notificationPreference.inviteUpdates,
    }
  }

  const store = await readStore()
  return store.preferencesByEmail[normalizeEmail(email)] ?? defaultPreferences
}

export async function updateNotificationPreferences(
  email: string,
  preferences: NotificationPreferences
) {
  if (isDatabaseMode()) {
    const prisma = getPrismaClient()
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    })

    if (!user) {
      throw new Error("User not found")
    }

    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: preferences,
      create: {
        userId: user.id,
        ...preferences,
      },
    })

    return preferences
  }

  const store = await readStore()
  store.preferencesByEmail[normalizeEmail(email)] = preferences
  await writeStore(store)
  return preferences
}
