import {
  authenticateUser as authenticateFileUser,
  createSession as createFileSession,
  createUser as createFileUser,
  deleteSession as deleteFileSession,
  getUserBySession as getFileUserBySession,
} from "../auth-store"
import {
  authenticateUser as authenticateDatabaseUser,
  createSession as createDatabaseSession,
  createUser as createDatabaseUser,
  deleteSession as deleteDatabaseSession,
  findSessionWithUser,
  findUserByEmail,
} from "../db/repositories/auth-repository"
import { isDatabaseMode } from "../persistence/mode"
import type { AuthUser } from "../types"

export async function getUserBySession(sessionId?: string | null): Promise<AuthUser | null> {
  if (!isDatabaseMode()) {
    return getFileUserBySession(sessionId)
  }

  if (!sessionId) {
    return null
  }

  const session = await findSessionWithUser(sessionId)
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  }
}

export async function findUserByEmailAddress(email: string) {
  return findUserByEmail(email)
}

export async function createUser(input: {
  name: string
  email: string
  password: string
}) {
  if (!isDatabaseMode()) {
    return createFileUser(input)
  }

  return createDatabaseUser(input)
}

export async function authenticateUser(email: string, password: string) {
  if (!isDatabaseMode()) {
    return authenticateFileUser(email, password)
  }

  return authenticateDatabaseUser(email, password)
}

export async function createSession(userId: string) {
  if (!isDatabaseMode()) {
    return createFileSession(userId)
  }

  return createDatabaseSession(userId)
}

export async function deleteSession(sessionId: string) {
  if (!isDatabaseMode()) {
    return deleteFileSession(sessionId)
  }

  return deleteDatabaseSession(sessionId)
}
