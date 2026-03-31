import { randomUUID } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import type { AuthUser } from "./types"
import { getSessionExpiryDate } from "./auth/session"
import {
  createPasswordSalt,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "./auth/password"

interface StoredUser extends AuthUser {
  passwordHash: string
  passwordSalt: string
}

interface StoredSession {
  id: string
  userId: string
  createdAt: string
  expiresAt: string
}

interface AuthStore {
  users: StoredUser[]
  sessions: StoredSession[]
}

const DATA_DIR = process.env.GHOSTLEDGER_DATA_DIR ?? path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "auth.json")

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

function buildInitialStore(): AuthStore {
  return {
    users: [],
    sessions: [],
  }
}

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await readFile(STORE_PATH, "utf8")
  } catch {
    await writeFile(STORE_PATH, JSON.stringify(buildInitialStore(), null, 2), "utf8")
  }
}

async function readStore() {
  await ensureStore()
  const store = JSON.parse(await readFile(STORE_PATH, "utf8")) as AuthStore
  const now = Date.now()
  const activeSessions = store.sessions.filter((session) => {
    const expiresAt = Date.parse(session.expiresAt ?? session.createdAt)
    return Number.isNaN(expiresAt) || expiresAt > now
  })

  if (activeSessions.length !== store.sessions.length) {
    store.sessions = activeSessions
    await writeStore(store)
  }

  return store
}

async function writeStore(store: AuthStore) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8")
}

export function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(normalizeEmail(email))
}

export async function createUser(input: {
  name: string
  email: string
  password: string
}) {
  const store = await readStore()
  const email = normalizeEmail(input.email)

  if (store.users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.")
  }

  const passwordSalt = createPasswordSalt()
  const user: StoredUser = {
    id: `u-${randomUUID()}`,
    name: input.name.trim(),
    email,
    passwordSalt,
    passwordHash: hashPassword(input.password, passwordSalt),
  }

  store.users.push(user)
  await writeStore(store)

  return toAuthUser(user)
}

export async function authenticateUser(emailInput: string, password: string) {
  const store = await readStore()
  const email = normalizeEmail(emailInput)
  const user = store.users.find((entry) => entry.email === email)

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error("Invalid email or password.")
  }

  return toAuthUser(user)
}

export async function createSession(userId: string) {
  const store = await readStore()
  const sessionId = `s-${randomUUID()}`
  store.sessions.push({
    id: sessionId,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: getSessionExpiryDate(),
  })
  await writeStore(store)
  return sessionId
}

export async function deleteSession(sessionId: string) {
  const store = await readStore()
  store.sessions = store.sessions.filter((session) => session.id !== sessionId)
  await writeStore(store)
}

export async function getUserBySession(sessionId?: string | null) {
  if (!sessionId) {
    return null
  }

  const store = await readStore()
  const session = store.sessions.find((entry) => entry.id === sessionId)
  if (!session) {
    return null
  }

  const expiresAt = Date.parse(session.expiresAt)
  if (!Number.isNaN(expiresAt) && expiresAt <= Date.now()) {
    store.sessions = store.sessions.filter((entry) => entry.id !== sessionId)
    await writeStore(store)
    return null
  }

  const user = store.users.find((entry) => entry.id === session.userId)
  return user ? toAuthUser(user) : null
}
