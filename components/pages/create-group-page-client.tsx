"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Ghost, Plus, Users, Wallet, X } from "lucide-react"
import { useGroup } from "@/components/providers/group-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CreateGroupPageClient() {
  const router = useRouter()
  const { createGroup } = useGroup()
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState<string[]>([""])
  const [budgetMonthly, setBudgetMonthly] = useState("2500")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddMember = () => {
    setMembers((current) => [...current, ""])
  }

  const handleRemoveMember = (index: number) => {
    setMembers((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current))
  }

  const handleMemberChange = (index: number, value: string) => {
    setMembers((current) => current.map((member, i) => (i === index ? value : member)))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await createGroup({
        name: groupName.trim(),
        memberNames: members.map((member) => member.trim()).filter(Boolean),
        budgetMonthly: Number.parseFloat(budgetMonthly) || 0,
      })
      router.push("/dashboard")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = groupName.trim() && members.some((member) => member.trim())

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-[0_10px_30px_rgba(111,227,182,0.32)]">
              <Ghost className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">GhostLedger</p>
              <p className="text-xs text-muted-foreground">Private finance workspace</p>
            </div>
          </Link>

          <Link href="/auth">
            <Button variant="ghost" className="rounded-xl">
              Sign in
            </Button>
          </Link>
        </header>

        <main className="grid gap-8 py-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:py-10">
          <section className="section-card relative overflow-hidden px-6 py-8 sm:px-8">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(111,227,182,0.22),_transparent_70%)]" />
            <div className="relative">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>

              <span className="page-header-eyebrow mt-6">Workspace setup</span>
              <h1 className="mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
                Create a shared ledger that already feels production-ready.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Start with your workspace name, seed the first team members, set a monthly operating
                target, and move directly into a polished dashboard.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/12 p-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Invite-ready structure</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Seed the core members now and expand access later from inside the workspace.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-primary/12 p-3">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Budget-aware from day one</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Set a target now so reporting, alerts, and recurring controls have context.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Card className="section-card border-0 bg-transparent shadow-none">
            <CardContent className="p-0">
              <form
                onSubmit={handleSubmit}
                className="rounded-[1.75rem] border border-border/70 bg-card/85 p-6 backdrop-blur-xl sm:p-8"
              >
                <div className="mb-6">
                  <p className="page-header-eyebrow">Workspace details</p>
                  <h2 className="mt-4 text-2xl font-semibold text-foreground">Launch your first ledger</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This creates the shared workspace your dashboard, reports, and AI analysis will use.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Workspace name</Label>
                    <Input
                      id="groupName"
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      placeholder="Core Operations Fund"
                      required
                      className="h-12 rounded-xl bg-background/70"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMonthly">Monthly budget target</Label>
                    <Input
                      id="budgetMonthly"
                      type="number"
                      min="0"
                      step="0.01"
                      value={budgetMonthly}
                      onChange={(event) => setBudgetMonthly(event.target.value)}
                      placeholder="2500"
                      className="h-12 rounded-xl bg-background/70"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Initial team members</Label>
                      <span className="text-xs text-muted-foreground">Add at least one name</span>
                    </div>
                    {members.map((member, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={member}
                          onChange={(event) => handleMemberChange(index, event.target.value)}
                          placeholder={`Team member ${index + 1}`}
                          className="h-12 rounded-xl bg-background/70"
                        />
                        {members.length > 1 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-xl"
                            onClick={() => handleRemoveMember(index)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove member</span>
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full gap-2 rounded-xl border-dashed"
                      onClick={handleAddMember}
                    >
                      <Plus className="h-4 w-4" />
                      Add another member
                    </Button>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="h-12 flex-1 gap-2 rounded-xl"
                  >
                    {isSubmitting ? "Creating workspace..." : "Create workspace"}
                    {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                  </Button>
                  <Link href="/auth" className="sm:flex-1">
                    <Button variant="outline" className="h-12 w-full rounded-xl">
                      Use existing account
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
