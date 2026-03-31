"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Ghost, Mail, Users, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InvitePageClientProps {
  token: string
  invite: {
    email: string
    role: string
    status: string
    expiresAt: string
    group: {
      id: string
      name: string
    }
    invitedBy: {
      name: string
      email: string
    }
  } | null
  currentUserEmail?: string | null
}

function formatExpiryDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function InvitePageClient({
  token,
  invite,
  currentUserEmail,
}: InvitePageClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!invite) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Ghost className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-foreground">
                GhostLedger
              </span>
            </Link>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-4 py-12">
          <Card className="w-full border-border bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">
                Invite unavailable
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This invite may have expired, been revoked, or is not available in the current storage mode.
              </p>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/">
                <Button>Back to home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const requiresAuth = !currentUserEmail
  const emailMismatch =
    currentUserEmail &&
    currentUserEmail.trim().toLowerCase() !== invite.email.trim().toLowerCase()
  const inviteIsAccepted = invite.status === "accepted"

  const handleAccept = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/invites/${token}`, {
        method: "POST",
      })
      const payload = (await response.json()) as { error?: string; group?: { id: string } }

      if (!response.ok || !payload.group) {
        throw new Error(payload.error ?? "Unable to accept invite.")
      }

      window.localStorage.setItem("ghost-ledger-active-group-id", payload.group.id)
      router.push("/dashboard")
      router.refresh()
    } catch (inviteError) {
      setError(
        inviteError instanceof Error ? inviteError.message : "Unable to accept invite."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Ghost className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              GhostLedger
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-4 py-12">
        <Card className="w-full border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              You&apos;re invited to {invite.group.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {invite.invitedBy.name} invited <span className="font-medium text-foreground">{invite.email}</span> to join as a {invite.role}.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">Invite details</p>
                  <p className="text-muted-foreground">
                    Sent by {invite.invitedBy.email}
                  </p>
                  <p className="text-muted-foreground">
                    Expires on {formatExpiryDate(invite.expiresAt)}
                  </p>
                </div>
              </div>
            </div>

            {inviteIsAccepted ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  This invite has already been accepted.
                </div>
              </div>
            ) : requiresAuth ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sign in or create an account with <span className="font-medium text-foreground">{invite.email}</span> to accept this invite.
                </p>
                <Link href={`/auth?next=${encodeURIComponent(`/invite/${token}`)}`}>
                  <Button className="w-full gap-2">
                    Continue to sign in
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : emailMismatch ? (
              <div className="space-y-4">
                <p className="text-sm text-destructive">
                  You&apos;re signed in as {currentUserEmail}, but this invite is for {invite.email}.
                </p>
                <Link href={`/auth?next=${encodeURIComponent(`/invite/${token}`)}`}>
                  <Button variant="outline" className="w-full">
                    Switch account
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You&apos;re signed in as the invited account and can accept access now.
                </p>
                <Button
                  onClick={() => void handleAccept()}
                  disabled={isSubmitting}
                  className="w-full gap-2"
                >
                  {isSubmitting ? "Accepting..." : "Accept invite"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
