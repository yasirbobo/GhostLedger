export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function getErrorStatus(error: unknown) {
  if (!(error instanceof Error)) {
    return 500
  }

  if (
    error.message === "Group not found" ||
    error.message === "Transaction not found" ||
    error.message === "Recurring plan not found"
  ) {
    return 404
  }

  if (
    error.message === "Invite email is invalid." ||
    error.message === "An account with this email already exists." ||
    error.message === "Invalid email or password." ||
    error.message === "Invite has expired." ||
    error.message === "Invite is no longer active." ||
    error.message === "Accepted invites cannot be resent." ||
    error.message === "Accepted invites cannot be revoked." ||
    error.message === "Owner access cannot be changed." ||
    error.message === "Owner access cannot be removed." ||
    error.message === "You cannot change your own access." ||
    error.message === "You cannot remove your own access."
  ) {
    return 400
  }

  if (error.message === "Access entry not found.") {
    return 404
  }

  if (error.message === "Insufficient permissions") {
    return 403
  }

  return 500
}
