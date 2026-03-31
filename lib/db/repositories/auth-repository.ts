import { randomUUID } from "node:crypto"
import { getPrismaClient } from "../client"
import { mapUserToAuthUser } from "../mappers"
import {
  createPasswordSalt,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "../../auth/password"
import { getSessionExpiryDate } from "../../auth/session"

export async function findUserByEmail(email: string) {
  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(email),
    },
  })

  return user ? mapUserToAuthUser(user) : null
}

export async function createUser(input: {
  name: string
  email: string
  password: string
}) {
  const prisma = getPrismaClient()
  const email = normalizeEmail(input.email)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error("An account with this email already exists.")
  }

  const passwordSalt = createPasswordSalt()
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      passwordSalt,
      passwordHash: hashPassword(input.password, passwordSalt),
    },
  })

  return mapUserToAuthUser(user)
}

export async function authenticateUser(emailInput: string, password: string) {
  const prisma = getPrismaClient()
  const user = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(emailInput),
    },
  })

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    throw new Error("Invalid email or password.")
  }

  return mapUserToAuthUser(user)
}

export async function createSession(userId: string) {
  const prisma = getPrismaClient()
  const session = await prisma.session.create({
    data: {
      token: `s-${randomUUID()}`,
      userId,
      expiresAt: new Date(getSessionExpiryDate()),
    },
  })

  return session.token
}

export async function findSessionWithUser(token: string) {
  const prisma = getPrismaClient()
  return prisma.session.findUnique({
    where: { token },
    include: {
      user: true,
    },
  })
}

export async function deleteSession(token: string) {
  const prisma = getPrismaClient()
  await prisma.session.deleteMany({
    where: { token },
  })
}
