import type { Group, GroupRole } from "@/lib/types"

function getRole(group: Group): GroupRole {
  if (group.currentUserRole) {
    return group.currentUserRole
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

export function canEditTransactions(group: Group) {
  const role = getRole(group)
  return role === "owner" || role === "admin" || role === "member"
}

export function canRunOperationalJobs(group: Group) {
  const role = getRole(group)
  return role === "owner" || role === "admin"
}
