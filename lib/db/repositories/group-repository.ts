import { InviteStatus, RecurringFrequency, TransactionType } from "@prisma/client"
import { getPrismaClient } from "../client"
import { mapGroup } from "../mappers"
import {
  canAssignRole,
  canChangeRole,
  canCreateTransactions,
  canModifyTransactions,
  canRemoveRole,
  normalizeGroupRole,
} from "../../authz/group-permissions"
import type {
  AddTransactionInput,
  CreateGroupInput,
  GroupRole,
  RecurringJobResult,
} from "../../types"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

function buildWalletAddress(index: number) {
  return `0xTEAM${(index + 1).toString().padStart(4, "0")}SAFE`
}

function buildEncryptedValue(amount: number) {
  const lowerBound = Math.floor(amount / 50) * 50
  const upperBound = lowerBound + 100
  return `$${lowerBound}-$${upperBound} encrypted`
}

function getTransactionBalanceDelta(type: TransactionType, amount: number) {
  return type === TransactionType.contribution ? amount : -amount
}

async function loadGroupWorkspace(groupId: string) {
  const prisma = getPrismaClient()
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: true,
      members: {
        orderBy: {
          joinedAt: "asc",
        },
      },
      invites: true,
      recurringPlans: {
        include: {
          member: true,
        },
        orderBy: {
          nextRunDate: "asc",
        },
      },
      transactions: {
        include: {
          member: true,
        },
        orderBy: {
          transactionAt: "desc",
        },
      },
    },
  })
}

function hasWorkspaceAccess(
  group: Awaited<ReturnType<typeof loadGroupWorkspace>>,
  requesterEmail?: string
) {
  if (!group || !requesterEmail) {
    return false
  }

  const normalizedRequesterEmail = requesterEmail.trim().toLowerCase()
  if (group.owner.email === normalizedRequesterEmail) {
    return true
  }

  return (
    group.members.some((member) => member.email === normalizedRequesterEmail) ||
    group.invites.some((invite) => invite.email === normalizedRequesterEmail)
  )
}

function getWorkspaceRole(
  group: Awaited<ReturnType<typeof loadGroupWorkspace>>,
  requesterEmail: string
): GroupRole {
  const normalizedRequesterEmail = requesterEmail.trim().toLowerCase()

  if (group?.owner.email === normalizedRequesterEmail) {
    return "owner"
  }

  return normalizeGroupRole(
    group?.members.find((member) => member.email === normalizedRequesterEmail)?.role ??
      group?.invites.find((invite) => invite.email === normalizedRequesterEmail)?.role ??
      "member"
  )
}

function getWorkspaceAccessRole(
  group: Awaited<ReturnType<typeof loadGroupWorkspace>>,
  memberEmail: string
): GroupRole {
  const normalizedMemberEmail = memberEmail.trim().toLowerCase()

  if (group?.owner.email === normalizedMemberEmail) {
    return "owner"
  }

  return normalizeGroupRole(
    group?.members.find((member) => member.email === normalizedMemberEmail)?.role ??
      group?.invites.find((invite) => invite.email === normalizedMemberEmail)?.role
  )
}

export async function findGroupWorkspace(groupId: string, requesterEmail?: string) {
  const group = await loadGroupWorkspace(groupId)

  if (!group || !hasWorkspaceAccess(group, requesterEmail)) {
    return null
  }

  return mapGroup({
    group,
    members: group.members,
    invites: group.invites,
    recurringPlans: group.recurringPlans,
    transactions: group.transactions,
    ownerEmail: group.owner.email,
    requesterEmail,
  })
}

export async function createGroupWorkspace(input: CreateGroupInput, ownerEmail: string) {
  const prisma = getPrismaClient()
  const normalizedOwnerEmail = ownerEmail.trim().toLowerCase()
  const owner = await prisma.user.findUnique({
    where: { email: normalizedOwnerEmail },
  })

  if (!owner) {
    throw new Error("You must be signed in to create a group.")
  }

  const group = await prisma.group.create({
    data: {
      name: input.name.trim(),
      budgetMonthly: input.budgetMonthly,
      ownerId: owner.id,
      members: {
        create: input.memberNames.map((memberName, index) => ({
          displayName: memberName.trim(),
          avatar: getInitials(memberName.trim()),
          walletAddress: buildWalletAddress(index),
          contribution: 0,
          role: "member",
        })),
      },
    },
    include: {
      owner: true,
      members: {
        orderBy: {
          joinedAt: "asc",
        },
      },
      invites: true,
      recurringPlans: {
        include: {
          member: true,
        },
      },
      transactions: {
        include: {
          member: true,
        },
        orderBy: {
          transactionAt: "desc",
        },
      },
    },
  })

  return mapGroup({
    group,
    members: group.members,
    invites: group.invites,
    recurringPlans: group.recurringPlans,
    transactions: group.transactions,
    ownerEmail: group.owner.email,
    requesterEmail: ownerEmail,
  })
}

export async function updateGroupWorkspace(
  groupId: string,
  input: Pick<CreateGroupInput, "name" | "budgetMonthly">,
  requesterEmail: string
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Group not found")
  }

  await prisma.group.update({
    where: { id: groupId },
    data: {
      name: input.name.trim(),
      budgetMonthly: input.budgetMonthly,
    },
  })

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function addTransactionToWorkspace(
  groupId: string,
  input: AddTransactionInput,
  requesterEmail: string
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (!canCreateTransactions({ ...mapGroup({
    group: existingGroup,
    members: existingGroup.members,
    invites: existingGroup.invites,
    recurringPlans: existingGroup.recurringPlans,
    transactions: existingGroup.transactions,
    ownerEmail: existingGroup.owner.email,
    requesterEmail,
  }), currentUserRole: requesterRole })) {
    throw new Error("Insufficient permissions")
  }

  const member = existingGroup.members.find((candidate) => candidate.id === input.memberId)
  if (!member) {
    throw new Error("Group not found")
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        groupId,
        memberId: input.memberId,
        description: input.description.trim(),
        amount: input.amount,
        type:
          input.type === "contribution"
            ? TransactionType.contribution
            : TransactionType.expense,
        category: input.category,
        isPrivate: input.isPrivate,
        encryptedValue: input.isPrivate ? buildEncryptedValue(input.amount) : null,
      },
    })

    if (input.recurrence) {
      await tx.recurringTransactionPlan.create({
        data: {
          groupId,
          memberId: input.memberId,
          description: input.description.trim(),
          amount: input.amount,
          type:
            input.type === "contribution"
              ? TransactionType.contribution
              : TransactionType.expense,
          category: input.category,
          isPrivate: input.isPrivate,
          encryptedValue: input.isPrivate ? buildEncryptedValue(input.amount) : null,
          frequency:
            input.recurrence.frequency === "weekly"
              ? RecurringFrequency.weekly
              : RecurringFrequency.monthly,
          nextRunDate: new Date(`${input.recurrence.nextRunDate}T00:00:00.000Z`),
          active: true,
        },
      })
    }

    if (input.type === "contribution") {
      await tx.groupMember.update({
        where: { id: input.memberId },
        data: {
          contribution: {
            increment: input.amount,
          },
        },
      })
    }

    await tx.group.update({
      where: { id: groupId },
      data: {
        totalBalance: {
          [input.type === "contribution" ? "increment" : "decrement"]: input.amount,
        },
      },
    })
  })

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function deleteTransactionFromWorkspace(
  groupId: string,
  transactionId: string,
  requesterEmail: string
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (!canModifyTransactions({ ...mapGroup({
    group: existingGroup,
    members: existingGroup.members,
    invites: existingGroup.invites,
    recurringPlans: existingGroup.recurringPlans,
    transactions: existingGroup.transactions,
    ownerEmail: existingGroup.owner.email,
    requesterEmail,
  }), currentUserRole: requesterRole })) {
    throw new Error("Insufficient permissions")
  }

  const transaction = existingGroup.transactions.find((entry) => entry.id === transactionId)
  if (!transaction) {
    throw new Error("Transaction not found")
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.delete({
      where: { id: transactionId },
    })

    if (transaction.type === TransactionType.contribution) {
      await tx.groupMember.update({
        where: { id: transaction.memberId },
        data: {
          contribution: {
            decrement: transaction.amount,
          },
        },
      })
    }

    await tx.group.update({
      where: { id: groupId },
      data: {
        totalBalance: {
          [transaction.type === TransactionType.contribution ? "decrement" : "increment"]:
            transaction.amount,
        },
      },
    })
  })

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function updateTransactionInWorkspace(
  groupId: string,
  transactionId: string,
  input: AddTransactionInput,
  requesterEmail: string
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (!canModifyTransactions({ ...mapGroup({
    group: existingGroup,
    members: existingGroup.members,
    invites: existingGroup.invites,
    recurringPlans: existingGroup.recurringPlans,
    transactions: existingGroup.transactions,
    ownerEmail: existingGroup.owner.email,
    requesterEmail,
  }), currentUserRole: requesterRole })) {
    throw new Error("Insufficient permissions")
  }

  const existingTransaction = existingGroup.transactions.find(
    (entry) => entry.id === transactionId
  )
  if (!existingTransaction) {
    throw new Error("Transaction not found")
  }

  const nextMember = existingGroup.members.find((candidate) => candidate.id === input.memberId)
  if (!nextMember) {
    throw new Error("Group not found")
  }

  const nextType =
    input.type === "contribution" ? TransactionType.contribution : TransactionType.expense

  await prisma.$transaction(async (tx) => {
    if (existingTransaction.type === TransactionType.contribution) {
      await tx.groupMember.update({
        where: { id: existingTransaction.memberId },
        data: {
          contribution: {
            decrement: existingTransaction.amount,
          },
        },
      })
    }

    if (nextType === TransactionType.contribution) {
      await tx.groupMember.update({
        where: { id: input.memberId },
        data: {
          contribution: {
            increment: input.amount,
          },
        },
      })
    }

    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        memberId: input.memberId,
        description: input.description.trim(),
        amount: input.amount,
        type: nextType,
        category: input.category,
        isPrivate: input.isPrivate,
        encryptedValue: input.isPrivate ? buildEncryptedValue(input.amount) : null,
      },
    })

    await tx.group.update({
      where: { id: groupId },
      data: {
        totalBalance:
          existingGroup.totalBalance -
          getTransactionBalanceDelta(existingTransaction.type, existingTransaction.amount) +
          getTransactionBalanceDelta(nextType, input.amount),
      },
    })
  })

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function addMemberAccessToWorkspace(
  groupId: string,
  memberEmail: string,
  requesterEmail: string,
  role: "admin" | "member" | "viewer" = "member"
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)
  const normalizedMemberEmail = memberEmail.trim().toLowerCase()

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Group not found")
  }

  if (!canAssignRole(requesterRole, role)) {
    throw new Error("Insufficient permissions")
  }

  if (existingGroup.owner.email === normalizedMemberEmail) {
    throw new Error("Owner access cannot be changed.")
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedMemberEmail },
  })

  const normalizedRequesterEmail = requesterEmail.trim().toLowerCase()
  const inviterId =
    existingGroup.owner.email === normalizedRequesterEmail
      ? existingGroup.ownerId
      : existingGroup.members.find((member) => member.email === normalizedRequesterEmail)?.userId ??
        existingGroup.ownerId

  const existingInvite = existingGroup.invites.find(
    (invite) => invite.email === normalizedMemberEmail
  )

  if (existingInvite) {
    await prisma.groupInvite.update({
      where: { id: existingInvite.id },
      data: {
        status: InviteStatus.pending,
        role,
        acceptedById: existingUser?.id ?? existingInvite.acceptedById,
      },
    })
  } else {
    await prisma.groupInvite.create({
      data: {
        groupId,
        email: normalizedMemberEmail,
        token: `invite:${groupId}:${normalizedMemberEmail}`,
        status: InviteStatus.pending,
        role,
        invitedById: inviterId,
        acceptedById: existingUser?.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    })
  }

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function updateMemberAccessInWorkspace(
  groupId: string,
  memberEmail: string,
  requesterEmail: string,
  role: "admin" | "member" | "viewer"
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)
  const normalizedMemberEmail = memberEmail.trim().toLowerCase()

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Group not found")
  }

  const normalizedRequesterEmail = requesterEmail.trim().toLowerCase()
  if (normalizedRequesterEmail === normalizedMemberEmail) {
    throw new Error("You cannot change your own access.")
  }

  if (existingGroup.owner.email === normalizedMemberEmail) {
    throw new Error("Owner access cannot be changed.")
  }

  const existingMember = existingGroup.members.find(
    (member) => member.email === normalizedMemberEmail
  )
  const existingInvite = existingGroup.invites.find(
    (invite) => invite.email === normalizedMemberEmail
  )

  if (!existingMember && !existingInvite) {
    throw new Error("Access entry not found.")
  }

  const currentRole = getWorkspaceAccessRole(existingGroup, normalizedMemberEmail)
  if (!canChangeRole(requesterRole, currentRole, role)) {
    throw new Error("Insufficient permissions")
  }

  await prisma.$transaction(async (tx) => {
    if (existingMember) {
      await tx.groupMember.update({
        where: { id: existingMember.id },
        data: { role },
      })
    }

    await tx.groupInvite.updateMany({
      where: {
        groupId,
        email: normalizedMemberEmail,
      },
      data: { role },
    })
  })

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function removeMemberAccessFromWorkspace(
  groupId: string,
  memberEmail: string,
  requesterEmail: string
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)
  const normalizedRequesterEmail = requesterEmail.trim().toLowerCase()
  const normalizedMemberEmail = memberEmail.trim().toLowerCase()

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Group not found")
  }

  if (existingGroup.owner.email === normalizedMemberEmail) {
    throw new Error("Owner access cannot be removed.")
  }

  if (normalizedRequesterEmail === normalizedMemberEmail) {
    throw new Error("You cannot remove your own access.")
  }

  const existingMember = existingGroup.members.find(
    (member) => member.email === normalizedMemberEmail
  )
  const existingInvite = existingGroup.invites.find(
    (invite) => invite.email === normalizedMemberEmail
  )

  if (!existingMember && !existingInvite) {
    throw new Error("Access entry not found.")
  }

  const targetRole = getWorkspaceAccessRole(existingGroup, normalizedMemberEmail)
  if (!canRemoveRole(requesterRole, targetRole)) {
    throw new Error("Insufficient permissions")
  }

  await prisma.$transaction(async (tx) => {
    if (existingMember) {
      await tx.groupMember.update({
        where: { id: existingMember.id },
        data: {
          email: null,
          userId: null,
          role: "viewer",
        },
      })
    }

    await tx.groupInvite.updateMany({
      where: {
        groupId,
        email: normalizedMemberEmail,
      },
      data: {
        status: InviteStatus.revoked,
      },
    })
  })

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function updateRecurringPlanStateInWorkspace(
  groupId: string,
  planId: string,
  requesterEmail: string,
  active: boolean
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const existingPlan = existingGroup.recurringPlans.find((plan) => plan.id === planId)
  if (!existingPlan) {
    throw new Error("Recurring plan not found")
  }

  await prisma.recurringTransactionPlan.update({
    where: { id: planId },
    data: { active },
  })

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function deleteRecurringPlanFromWorkspace(
  groupId: string,
  planId: string,
  requesterEmail: string
) {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const existingPlan = existingGroup.recurringPlans.find((plan) => plan.id === planId)
  if (!existingPlan) {
    throw new Error("Recurring plan not found")
  }

  await prisma.recurringTransactionPlan.delete({
    where: { id: planId },
  })

  const updatedGroup = await loadGroupWorkspace(groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail,
  })
}

export async function findInviteByToken(token: string) {
  const prisma = getPrismaClient()
  const invite = await prisma.groupInvite.findUnique({
    where: { token },
    include: {
      group: true,
      invitedBy: true,
      acceptedBy: true,
    },
  })

  if (!invite) {
    return null
  }

  return {
    id: invite.id,
    token: invite.token,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    group: {
      id: invite.group.id,
      name: invite.group.name,
    },
    invitedBy: {
      id: invite.invitedBy.id,
      name: invite.invitedBy.name,
      email: invite.invitedBy.email,
    },
    acceptedBy: invite.acceptedBy
      ? {
          id: invite.acceptedBy.id,
          name: invite.acceptedBy.name,
          email: invite.acceptedBy.email,
        }
      : null,
  }
}

async function loadInviteWorkspace(token: string) {
  const prisma = getPrismaClient()
  return prisma.groupInvite.findUnique({
    where: { token },
    include: {
      group: {
        include: {
          owner: true,
          members: true,
        },
      },
      invitedBy: true,
      acceptedBy: true,
    },
  })
}

function canManageInvite(
  invite: Awaited<ReturnType<typeof loadInviteWorkspace>>,
  requesterEmail: string
) {
  if (!invite) {
    return false
  }

  const normalizedRequesterEmail = requesterEmail.trim().toLowerCase()
  const requesterRole =
    invite.group.owner.email === normalizedRequesterEmail
      ? "owner"
      : normalizeGroupRole(
          invite.group.members.find((member) => member.email === normalizedRequesterEmail)?.role
        )
  const targetRole = normalizeGroupRole(invite.role)

  return canRemoveRole(requesterRole, targetRole)
}

export async function resendInvite(token: string, requesterEmail: string) {
  const prisma = getPrismaClient()
  const invite = await loadInviteWorkspace(token)

  if (!invite) {
    throw new Error("Invite not found")
  }

  if (!canManageInvite(invite, requesterEmail)) {
    throw new Error("Insufficient permissions")
  }

  if (invite.status === InviteStatus.accepted) {
    throw new Error("Accepted invites cannot be resent.")
  }

  await prisma.groupInvite.update({
    where: { id: invite.id },
    data: {
      status: InviteStatus.pending,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  })

  const updatedInvite = await findInviteByToken(token)
  if (!updatedInvite) {
    throw new Error("Invite not found")
  }

  return updatedInvite
}

export async function revokeInvite(token: string, requesterEmail: string) {
  const prisma = getPrismaClient()
  const invite = await loadInviteWorkspace(token)

  if (!invite) {
    throw new Error("Invite not found")
  }

  if (!canManageInvite(invite, requesterEmail)) {
    throw new Error("Insufficient permissions")
  }

  if (invite.status === InviteStatus.accepted) {
    throw new Error("Accepted invites cannot be revoked.")
  }

  await prisma.groupInvite.update({
    where: { id: invite.id },
    data: {
      status: InviteStatus.revoked,
    },
  })

  const updatedInvite = await findInviteByToken(token)
  if (!updatedInvite) {
    throw new Error("Invite not found")
  }

  return updatedInvite
}

export async function acceptInvite(token: string, userEmail: string) {
  const prisma = getPrismaClient()
  const normalizedUserEmail = userEmail.trim().toLowerCase()

  const invite = await prisma.groupInvite.findUnique({
    where: { token },
    include: {
      group: {
        include: {
          owner: true,
        },
      },
    },
  })

  if (!invite || invite.email !== normalizedUserEmail) {
    throw new Error("Invite not found")
  }

  if (invite.status !== InviteStatus.pending) {
    throw new Error("Invite is no longer active.")
  }

  if (invite.expiresAt.getTime() <= Date.now()) {
    throw new Error("Invite has expired.")
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedUserEmail },
  })

  if (!user) {
    throw new Error("You must be signed in to accept an invite.")
  }

  await prisma.$transaction(async (tx) => {
    const existingMembership = await tx.groupMember.findFirst({
      where: {
        groupId: invite.groupId,
        email: normalizedUserEmail,
      },
    })

    if (existingMembership) {
      await tx.groupMember.update({
        where: { id: existingMembership.id },
        data: {
          userId: user.id,
          email: normalizedUserEmail,
          role: invite.role,
        },
      })
    } else {
      await tx.groupMember.create({
        data: {
          groupId: invite.groupId,
          userId: user.id,
          email: normalizedUserEmail,
          displayName: user.name,
          avatar: getInitials(user.name),
          walletAddress: buildWalletAddress(999),
          contribution: 0,
          role: invite.role,
        },
      })
    }

    await tx.groupInvite.update({
      where: { id: invite.id },
      data: {
        status: InviteStatus.accepted,
        acceptedById: user.id,
      },
    })
  })

  const updatedGroup = await loadGroupWorkspace(invite.groupId)
  if (!updatedGroup) {
    throw new Error("Group not found")
  }

  return mapGroup({
    group: updatedGroup,
    members: updatedGroup.members,
    invites: updatedGroup.invites,
    recurringPlans: updatedGroup.recurringPlans,
    transactions: updatedGroup.transactions,
    ownerEmail: updatedGroup.owner.email,
    requesterEmail: normalizedUserEmail,
  })
}

export async function processDueRecurringTransactionsInWorkspace(
  groupId: string,
  requesterEmail: string,
  runDate?: string
): Promise<RecurringJobResult> {
  const prisma = getPrismaClient()
  const existingGroup = await loadGroupWorkspace(groupId)

  if (!existingGroup || !hasWorkspaceAccess(existingGroup, requesterEmail)) {
    throw new Error("Group not found")
  }

  const requesterRole = getWorkspaceRole(existingGroup, requesterEmail)
  if (requesterRole !== "owner" && requesterRole !== "admin") {
    throw new Error("Insufficient permissions")
  }

  const effectiveRunDate = runDate
    ? new Date(`${runDate}T00:00:00.000Z`)
    : new Date(`${new Date().toISOString().split("T")[0]}T00:00:00.000Z`)

  const duePlans = existingGroup.recurringPlans.filter(
    (plan) => plan.active && plan.nextRunDate.getTime() <= effectiveRunDate.getTime()
  )

  if (duePlans.length === 0) {
    const group = await findGroupWorkspace(groupId, requesterEmail)
    if (!group) {
      throw new Error("Group not found")
    }

    return {
      group,
      processedCount: 0,
      generatedTransactionIds: [],
    }
  }

  const generatedTransactionIds: string[] = []

  await prisma.$transaction(async (tx) => {
    for (const plan of duePlans) {
      const createdTransaction = await tx.transaction.create({
        data: {
          groupId,
          memberId: plan.memberId,
          description: plan.description,
          amount: plan.amount,
          type: plan.type,
          category: plan.category,
          isPrivate: plan.isPrivate,
          encryptedValue: plan.encryptedValue,
        },
      })

      generatedTransactionIds.push(createdTransaction.id)

      if (plan.type === TransactionType.contribution) {
        await tx.groupMember.update({
          where: { id: plan.memberId },
          data: {
            contribution: {
              increment: plan.amount,
            },
          },
        })
      }

      const nextRunDate =
        plan.frequency === RecurringFrequency.weekly
          ? new Date(plan.nextRunDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          : new Date(
              Date.UTC(
                plan.nextRunDate.getUTCFullYear(),
                plan.nextRunDate.getUTCMonth() + 1,
                plan.nextRunDate.getUTCDate()
              )
            )

      await tx.recurringTransactionPlan.update({
        where: { id: plan.id },
        data: {
          nextRunDate,
        },
      })
    }

    const balanceDelta = duePlans.reduce((sum, plan) => {
      return sum + (plan.type === TransactionType.contribution ? plan.amount : -plan.amount)
    }, 0)

    await tx.group.update({
      where: { id: groupId },
      data: {
        totalBalance: existingGroup.totalBalance + balanceDelta,
      },
    })
  })

  const group = await findGroupWorkspace(groupId, requesterEmail)
  if (!group) {
    throw new Error("Group not found")
  }

  return {
    group,
    processedCount: duePlans.length,
    generatedTransactionIds,
  }
}
