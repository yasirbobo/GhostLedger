import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function createPasswordSalt() {
  return randomBytes(16).toString("hex")
}

export function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex")
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actualBuffer = Buffer.from(hashPassword(password, salt), "hex")
  const expectedBuffer = Buffer.from(expectedHash, "hex")
  return timingSafeEqual(actualBuffer, expectedBuffer)
}
