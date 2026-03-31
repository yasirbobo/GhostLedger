import {
  addTransaction as addFileTransaction,
  createGroup as createFileGroup,
  deleteTransaction as deleteFileTransaction,
  getGroup as getFileGroup,
  processDueRecurringTransactions as processFileDueRecurringTransactions,
} from "../group-store"
import {
  addMemberAccessToWorkspace,
  addTransactionToWorkspace,
  createGroupWorkspace,
  deleteRecurringPlanFromWorkspace,
  deleteTransactionFromWorkspace,
  findGroupWorkspace,
  removeMemberAccessFromWorkspace,
  processDueRecurringTransactionsInWorkspace,
  updateRecurringPlanStateInWorkspace,
  updateMemberAccessInWorkspace,
  updateGroupWorkspace,
  updateTransactionInWorkspace,
} from "../db/repositories/group-repository"
import {
  addMemberToGroup as addFileMemberToGroup,
  deleteRecurringPlan as deleteFileRecurringPlan,
  removeMemberAccess as removeFileMemberAccess,
  updateRecurringPlanState as updateFileRecurringPlanState,
  updateMemberAccess as updateFileMemberAccess,
  updateGroupDetails as updateFileGroupDetails,
  updateTransaction as updateFileTransaction,
} from "../group-store"
import { isDatabaseMode } from "../persistence/mode"
import type { AddTransactionInput, CreateGroupInput, GroupRole } from "../types"

export async function getGroup(groupId?: string, requesterEmail?: string) {
  if (!isDatabaseMode() || !groupId) {
    return getFileGroup(groupId, requesterEmail)
  }

  const group = await findGroupWorkspace(groupId, requesterEmail)
  return group ?? getFileGroup(groupId, requesterEmail)
}

export async function createGroup(input: CreateGroupInput, ownerEmail: string) {
  if (!isDatabaseMode()) {
    return createFileGroup(input, ownerEmail)
  }

  return createGroupWorkspace(input, ownerEmail)
}

export async function updateGroup(
  groupId: string,
  input: Pick<CreateGroupInput, "name" | "budgetMonthly">,
  requesterEmail: string
) {
  if (!isDatabaseMode()) {
    return updateFileGroupDetails(groupId, input, requesterEmail)
  }

  return updateGroupWorkspace(groupId, input, requesterEmail)
}

export async function addTransaction(
  groupId: string,
  input: AddTransactionInput,
  requesterEmail: string
) {
  if (!isDatabaseMode()) {
    return addFileTransaction(groupId, input, requesterEmail)
  }

  return addTransactionToWorkspace(groupId, input, requesterEmail)
}

export async function deleteTransaction(
  groupId: string,
  transactionId: string,
  requesterEmail: string
) {
  if (!isDatabaseMode()) {
    return deleteFileTransaction(groupId, transactionId, requesterEmail)
  }

  return deleteTransactionFromWorkspace(groupId, transactionId, requesterEmail)
}

export async function updateTransaction(
  groupId: string,
  transactionId: string,
  input: AddTransactionInput,
  requesterEmail: string
) {
  if (!isDatabaseMode()) {
    return updateFileTransaction(groupId, transactionId, input, requesterEmail)
  }

  return updateTransactionInWorkspace(groupId, transactionId, input, requesterEmail)
}

export async function addMemberToGroup(
  groupId: string,
  memberEmail: string,
  requesterEmail: string,
  role: "admin" | "member" | "viewer" = "member"
) {
  if (!isDatabaseMode()) {
    return addFileMemberToGroup(groupId, memberEmail, requesterEmail, role)
  }

  return addMemberAccessToWorkspace(groupId, memberEmail, requesterEmail, role)
}

export async function updateMemberAccess(
  groupId: string,
  memberEmail: string,
  requesterEmail: string,
  role: Exclude<GroupRole, "owner">
) {
  if (!isDatabaseMode()) {
    return updateFileMemberAccess(groupId, memberEmail, requesterEmail, role)
  }

  return updateMemberAccessInWorkspace(groupId, memberEmail, requesterEmail, role)
}

export async function removeMemberAccess(
  groupId: string,
  memberEmail: string,
  requesterEmail: string
) {
  if (!isDatabaseMode()) {
    return removeFileMemberAccess(groupId, memberEmail, requesterEmail)
  }

  return removeMemberAccessFromWorkspace(groupId, memberEmail, requesterEmail)
}

export async function processDueRecurringTransactions(
  groupId: string,
  requesterEmail: string,
  runDate?: string
) {
  if (!isDatabaseMode()) {
    return processFileDueRecurringTransactions(groupId, requesterEmail, runDate)
  }

  return processDueRecurringTransactionsInWorkspace(groupId, requesterEmail, runDate)
}

export async function updateRecurringPlanState(
  groupId: string,
  planId: string,
  requesterEmail: string,
  active: boolean
) {
  if (!isDatabaseMode()) {
    return updateFileRecurringPlanState(groupId, planId, requesterEmail, active)
  }

  return updateRecurringPlanStateInWorkspace(groupId, planId, requesterEmail, active)
}

export async function deleteRecurringPlan(
  groupId: string,
  planId: string,
  requesterEmail: string
) {
  if (!isDatabaseMode()) {
    return deleteFileRecurringPlan(groupId, planId, requesterEmail)
  }

  return deleteRecurringPlanFromWorkspace(groupId, planId, requesterEmail)
}
