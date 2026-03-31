import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  delete process.env.GHOSTLEDGER_STORAGE_MODE
})

describe("auth repository database mode", () => {
  it("delegates user creation and session creation to the database repository", async () => {
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const createUserMock = vi.fn(async () => ({
      id: "user-db-1",
      name: "Database User",
      email: "db@example.com",
    }))
    const createSessionMock = vi.fn(async () => "session-db-1")

    vi.doMock("../../lib/db/repositories/auth-repository", () => ({
      authenticateUser: vi.fn(),
      createSession: createSessionMock,
      createUser: createUserMock,
      deleteSession: vi.fn(),
      findSessionWithUser: vi.fn(),
      findUserByEmail: vi.fn(),
    }))

    const authRepository = await import("../../lib/repositories/auth")

    const user = await authRepository.createUser({
      name: "Database User",
      email: "db@example.com",
      password: "Password9",
    })
    const sessionId = await authRepository.createSession(user.id)

    expect(createUserMock).toHaveBeenCalledOnce()
    expect(createSessionMock).toHaveBeenCalledWith("user-db-1")
    expect(sessionId).toBe("session-db-1")
  })

  it("resolves database sessions via the database repository", async () => {
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const findSessionWithUserMock = vi.fn(async () => ({
      id: "session-row",
      token: "session-db-1",
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: "user-db-1",
        name: "Database User",
        email: "db@example.com",
      },
    }))

    vi.doMock("../../lib/db/repositories/auth-repository", () => ({
      authenticateUser: vi.fn(),
      createSession: vi.fn(),
      createUser: vi.fn(),
      deleteSession: vi.fn(),
      findSessionWithUser: findSessionWithUserMock,
      findUserByEmail: vi.fn(),
    }))

    const authRepository = await import("../../lib/repositories/auth")
    const user = await authRepository.getUserBySession("session-db-1")

    expect(findSessionWithUserMock).toHaveBeenCalledWith("session-db-1")
    expect(user).toEqual({
      id: "user-db-1",
      name: "Database User",
      email: "db@example.com",
    })
  })

  it("returns null for expired database sessions", async () => {
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const findSessionWithUserMock = vi.fn(async () => ({
      id: "session-row",
      token: "session-db-1",
      expiresAt: new Date(Date.now() - 60_000),
      user: {
        id: "user-db-1",
        name: "Database User",
        email: "db@example.com",
      },
    }))

    vi.doMock("../../lib/db/repositories/auth-repository", () => ({
      authenticateUser: vi.fn(),
      createSession: vi.fn(),
      createUser: vi.fn(),
      deleteSession: vi.fn(),
      findSessionWithUser: findSessionWithUserMock,
      findUserByEmail: vi.fn(),
    }))

    const authRepository = await import("../../lib/repositories/auth")
    const user = await authRepository.getUserBySession("session-db-1")

    expect(findSessionWithUserMock).toHaveBeenCalledWith("session-db-1")
    expect(user).toBeNull()
  })
})
