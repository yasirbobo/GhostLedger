"use client"

import { useMemo, useState } from "react"
import { Copy, Mail, Shield, UserPlus, Users } from "lucide-react"
import { useGroup } from "@/components/providers/group-provider"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { canManageAccess } from "@/lib/authz/group-permissions"
import type { GroupRole, InviteSummary } from "@/lib/types"

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function getInviteTone(status: string) {
  switch (status) {
    case "pending":
      return {
        badge: "secondary" as const,
        label: "Pending invite",
      }
    case "accepted":
      return {
        badge: "outline" as const,
        label: "Access granted",
      }
    case "revoked":
      return {
        badge: "destructive" as const,
        label: "Invite revoked",
      }
    default:
      return {
        badge: "outline" as const,
        label: "Invite expired",
      }
  }
}

type AccessEntry = InviteSummary & {
  email: string
}

export function GroupAccessCard() {
  const { group, refreshGroup } = useGroup()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copyingToken, setCopyingToken] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const hasAccessManagement = group.ownerEmail ? canManageAccess(group) : false
  const ownerEmail = group.ownerEmail ?? "Demo group"
  const roleLabels: Record<GroupRole, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
    viewer: "Viewer",
  }

  const accessEntries = useMemo(() => {
    const seen = new Set<string>()
    const entries: AccessEntry[] = [
      ...(group.invites ?? []),
      ...(group.memberEmails ?? [])
        .filter(
          (memberEmail) =>
            !(group.invites ?? []).some(
              (invite) => normalizeEmail(invite.email) === normalizeEmail(memberEmail)
            )
        )
        .map((memberEmail) => ({
          email: memberEmail,
          token: undefined,
          role: (memberEmail === ownerEmail ? "owner" : "member") as GroupRole,
          status: "accepted" as const,
        })),
    ]
      .map((entry) => ({
        ...entry,
        email: normalizeEmail(entry.email),
      }))
      .filter((memberEmail) => {
        if (!memberEmail.email || seen.has(memberEmail.email)) {
          return false
        }

        seen.add(memberEmail.email)
        return true
      })

    return entries.sort((left, right) => {
      if (left.email === normalizeEmail(ownerEmail)) return -1
      if (right.email === normalizeEmail(ownerEmail)) return 1
      return left.email.localeCompare(right.email)
    })
  }, [group.invites, group.memberEmails, ownerEmail])

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/group/${group.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update access")
      }

      await refreshGroup()
      setEmail("")
      setRole("member")
      setMessage("Access updated successfully.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update access.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyInviteLink = async (token: string) => {
    setCopyingToken(token)
    setMessage(null)

    try {
      const inviteLink = new URL(`/invite/${token}`, window.location.origin).toString()
      await navigator.clipboard.writeText(inviteLink)
      setMessage("Invite link copied.")
    } catch {
      setMessage("Could not copy invite link.")
    } finally {
      setCopyingToken(null)
    }
  }

  const handleResendInvite = async (token: string) => {
    setCopyingToken(token)
    setMessage(null)

    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: "PATCH",
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not resend invite.")
      }

      await refreshGroup()
      setMessage("Invite resent and expiration refreshed.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not resend invite.")
    } finally {
      setCopyingToken(null)
    }
  }

  const handleRevokeInvite = async (token: string) => {
    setCopyingToken(token)
    setMessage(null)

    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: "DELETE",
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not revoke invite.")
      }

      await refreshGroup()
      setMessage("Invite revoked.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not revoke invite.")
    } finally {
      setCopyingToken(null)
    }
  }

  const handleUpdateAccess = async (
    memberEmail: string,
    nextRole: "admin" | "member" | "viewer"
  ) => {
    setCopyingToken(memberEmail)
    setMessage(null)

    try {
      const response = await fetch(`/api/group/${group.id}/members`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: memberEmail, role: nextRole }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update access.")
      }

      await refreshGroup()
      setMessage(`${memberEmail} is now ${roleLabels[nextRole]}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update access.")
    } finally {
      setCopyingToken(null)
    }
  }

  const handleRemoveAccess = async (memberEmail: string) => {
    setCopyingToken(memberEmail)
    setMessage(null)

    try {
      const response = await fetch(`/api/group/${group.id}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: memberEmail }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not remove access.")
      }

      await refreshGroup()
      setMessage(`${memberEmail} was removed from the workspace.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove access.")
    } finally {
      setCopyingToken(null)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Shield className="h-4 w-4 text-primary" />
          Group Access
        </CardTitle>
        <CardDescription>
          Manage who can view and collaborate inside this ledger workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Owner
              </p>
              <p className="text-sm font-medium text-foreground">{ownerEmail}</p>
            </div>
            <Badge variant="secondary">Full access</Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">Access directory</p>
            </div>
            <Badge variant="outline">{accessEntries.length || 0} entries</Badge>
          </div>

          <div className="space-y-2">
            {accessEntries.length > 0 ? (
              accessEntries.map((entry) => {
                const isOwner = entry.email === normalizeEmail(ownerEmail)
                const tone = getInviteTone(entry.status)
                const canCopyInviteLink = entry.status === "pending" && Boolean(entry.token)
                const canManagePendingInvite =
                  hasAccessManagement &&
                  !isOwner &&
                  Boolean(entry.token) &&
                  entry.status !== "accepted"
                const canManageAcceptedAccess =
                  hasAccessManagement && !isOwner && entry.status === "accepted"

                return (
                  <div
                    key={`${entry.email}-${entry.status}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {isOwner
                            ? "Workspace owner"
                            : entry.expiresAt && entry.status !== "accepted"
                              ? `${tone.label} until ${new Date(entry.expiresAt).toLocaleDateString()}`
                              : tone.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageAcceptedAccess ? (
                        <Select
                          value={entry.role}
                          onValueChange={(value: "admin" | "member" | "viewer") =>
                            void handleUpdateAccess(entry.email, value)
                          }
                          disabled={copyingToken === entry.email}
                        >
                          <SelectTrigger className="h-8 w-[132px] border-border bg-background text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-border bg-card">
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : null}
                      {canCopyInviteLink ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2"
                          onClick={() => handleCopyInviteLink(entry.token!)}
                          disabled={copyingToken === entry.token}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copyingToken === entry.token ? "Copying..." : "Copy link"}
                        </Button>
                      ) : null}
                      {canManagePendingInvite ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => void handleResendInvite(entry.token!)}
                          disabled={copyingToken === entry.token}
                        >
                          Resend
                        </Button>
                      ) : null}
                      {canManageAcceptedAccess ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-destructive"
                          onClick={() => void handleRemoveAccess(entry.email)}
                          disabled={copyingToken === entry.email}
                        >
                          Remove
                        </Button>
                      ) : null}
                      {canManagePendingInvite && entry.status === "pending" ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground hover:text-destructive"
                          onClick={() => void handleRevokeInvite(entry.token!)}
                          disabled={copyingToken === entry.token}
                        >
                          Revoke
                        </Button>
                      ) : null}
                      {!canManageAcceptedAccess ? (
                        <Badge variant={isOwner ? "default" : tone.badge}>
                          {entry.status === "pending"
                            ? `Pending ${roleLabels[entry.role]}`
                            : roleLabels[entry.role]}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                No shared access entries yet.
              </div>
            )}
          </div>
        </div>

        {hasAccessManagement ? (
          <div className="space-y-3 rounded-xl border border-border bg-secondary/20 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Invite teammate</p>
              <p className="text-xs text-muted-foreground">
                Add an email to grant access now. In database mode, this creates a tracked invite that the teammate can accept from their invite link.
              </p>
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Invite by email"
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Role
                  </Label>
                  <Select
                    value={role}
                    onValueChange={(value: "admin" | "member" | "viewer") => setRole(value)}
                  >
                    <SelectTrigger className="border-border bg-background text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={!email.trim() || isSubmitting}
                className="gap-2 sm:min-w-36"
              >
                <UserPlus className="h-4 w-4" />
                {isSubmitting ? "Inviting..." : "Send access"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
            Only workspace owners and admins can grant access or manage invites.
          </div>
        )}

        {message && (
          <p className="text-xs text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  )
}
