import {
  acceptInvite as acceptDatabaseInvite,
  findInviteByToken,
  resendInvite as resendDatabaseInvite,
  revokeInvite as revokeDatabaseInvite,
} from "../db/repositories/group-repository"
import { isDatabaseMode } from "../persistence/mode"

export async function getInvite(token: string) {
  if (!isDatabaseMode()) {
    return null
  }

  return findInviteByToken(token)
}

export async function acceptInvite(token: string, userEmail: string) {
  if (!isDatabaseMode()) {
    throw new Error("Invite acceptance is only available in database mode.")
  }

  return acceptDatabaseInvite(token, userEmail)
}

export async function resendInvite(token: string, userEmail: string) {
  if (!isDatabaseMode()) {
    throw new Error("Invite management is only available in database mode.")
  }

  return resendDatabaseInvite(token, userEmail)
}

export async function revokeInvite(token: string, userEmail: string) {
  if (!isDatabaseMode()) {
    throw new Error("Invite management is only available in database mode.")
  }

  return revokeDatabaseInvite(token, userEmail)
}
