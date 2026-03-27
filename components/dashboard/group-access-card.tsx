"use client"

import { useState } from "react"
import { Shield, UserPlus } from "lucide-react"
import { useGroup } from "@/components/providers/group-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function GroupAccessCard() {
  const { group, refreshGroup } = useGroup()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const canManageAccess = group.isOwner && group.ownerEmail

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
        body: JSON.stringify({ email }),
      })

      const payload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update access")
      }

      await refreshGroup()
      setEmail("")
      setMessage("Access updated.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update access.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Shield className="h-4 w-4 text-primary" />
          Group Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-foreground">
            Owner: <span className="font-medium">{group.ownerEmail ?? "Demo group"}</span>
          </p>
          <div className="space-y-2">
            {(group.memberEmails ?? []).map((memberEmail) => (
              <div
                key={memberEmail}
                className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground"
              >
                {memberEmail}
              </div>
            ))}
          </div>
        </div>

        {canManageAccess ? (
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Invite by email"
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Inviting..." : "Invite"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only the group owner can grant access.
          </p>
        )}

        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  )
}
