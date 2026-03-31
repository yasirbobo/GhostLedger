import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  delete process.env.GHOSTLEDGER_STORAGE_MODE
})

describe("invite repository database mode", () => {
  it("delegates invite lookup and acceptance to the database repository", async () => {
    process.env.GHOSTLEDGER_STORAGE_MODE = "database"

    const getInviteMock = vi.fn(async () => ({
      id: "invite-1",
      token: "token-1",
      email: "member@example.com",
      role: "member",
      status: "pending",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      group: {
        id: "group-1",
        name: "DB Group",
      },
      invitedBy: {
        id: "user-1",
        name: "Owner",
        email: "owner@example.com",
      },
      acceptedBy: null,
    }))
    const acceptInviteMock = vi.fn(async () => ({
      id: "group-1",
      name: "DB Group",
      budgetMonthly: 0,
      totalBalance: 0,
      members: [],
      transactions: [],
      ownerEmail: "owner@example.com",
      memberEmails: ["owner@example.com", "member@example.com"],
      isOwner: false,
    }))

    vi.doMock("../../lib/db/repositories/group-repository", () => ({
      acceptInvite: acceptInviteMock,
      addMemberAccessToWorkspace: vi.fn(),
      addTransactionToWorkspace: vi.fn(),
      createGroupWorkspace: vi.fn(),
      deleteTransactionFromWorkspace: vi.fn(),
      findGroupWorkspace: vi.fn(),
      findInviteByToken: getInviteMock,
    }))

    const invitesRepository = await import("../../lib/repositories/invites")

    const invite = await invitesRepository.getInvite("token-1")
    const group = await invitesRepository.acceptInvite("token-1", "member@example.com")

    expect(getInviteMock).toHaveBeenCalledWith("token-1")
    expect(acceptInviteMock).toHaveBeenCalledWith("token-1", "member@example.com")
    expect(invite?.token).toBe("token-1")
    expect(group.memberEmails).toContain("member@example.com")
  })
})
