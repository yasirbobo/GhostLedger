import type { Group, GroupRole } from "@/lib/types"

export function normalizeGroupRole(role?: string | null): GroupRole {
  if (role === "owner" || role === "admin" || role === "member" || role === "viewer") {
    return role
  }

  return "member"
}

export function getRole(group: Group): GroupRole {
  if (group.currentUserRole) {
    return normalizeGroupRole(group.currentUserRole)
  }

  return group.isOwner ? "owner" : "member"
}

export function canManageWorkspace(group: Group) {
  const role = getRole(group)
  return role === "owner" || role === "admin"
}

export function canManageAccess(group: Group) {
  const role = getRole(group)
  return role === "owner" || role === "admin"
}

export function canManageBilling(group: Group) {
  return getRole(group) === "owner"
}

export function canCreateTransactions(group: Group) {
  const role = getRole(group)
  return role === "owner" || role === "admin" || role === "member"
}

export function canModifyTransactions(group: Group) {
  const role = getRole(group)
  return role === "owner" || role === "admin"
}

export function canAssignRole(
  requesterRole: GroupRole,
  targetRole: Exclude<GroupRole, "owner">
) {
  if (requesterRole === "owner") {
    return true
  }

  if (requesterRole === "admin") {
    return targetRole === "member" || targetRole === "viewer"
  }

  return false
}

export function canChangeRole(
  requesterRole: GroupRole,
  currentRole: GroupRole,
  nextRole: Exclude<GroupRole, "owner">
) {
  if (currentRole === "owner") {
    return false
  }

  if (requesterRole === "owner") {
    return true
  }

  if (requesterRole === "admin") {
    const canManageCurrentRole = currentRole === "member" || currentRole === "viewer"
    const canAssignNextRole = nextRole === "member" || nextRole === "viewer"

    return canManageCurrentRole && canAssignNextRole
  }

  return false
}

export function canRemoveRole(requesterRole: GroupRole, targetRole: GroupRole) {
  if (targetRole === "owner") {
    return false
  }

  if (requesterRole === "owner") {
    return true
  }

  if (requesterRole === "admin") {
    return targetRole === "member" || targetRole === "viewer"
  }

  return false
}

export function canRunOperationalJobs(group: Group) {
  const role = getRole(group)
  return role === "owner" || role === "admin"
}
