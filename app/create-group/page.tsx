"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RequireAuth } from "@/components/auth/require-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGroup } from "@/components/providers/group-provider"
import { Ghost, Users, Plus, X, ArrowLeft, ArrowRight } from "lucide-react"

export default function CreateGroupPage() {
  const router = useRouter()
  const { createGroup } = useGroup()
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState<string[]>([""])
  const [budgetMonthly, setBudgetMonthly] = useState("2500")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddMember = () => {
    setMembers([...members, ""])
  }

  const handleRemoveMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index))
    }
  }

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members]
    newMembers[index] = value
    setMembers(newMembers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const cleanMembers = members.map((member) => member.trim()).filter(Boolean)
    try {
      await createGroup({
        name: groupName.trim(),
        memberNames: cleanMembers,
        budgetMonthly: Number.parseFloat(budgetMonthly) || 0,
      })
      router.push("/dashboard")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = groupName.trim() && members.some((m) => m.trim())

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
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

        <main className="mx-auto max-w-lg px-4 py-12 lg:py-16">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <Card className="border-border bg-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Create Your Group
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Set up a new team finance group to start tracking contributions and expenses.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="groupName" className="text-foreground">
                    Group Name
                  </Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Startup Team Fund"
                    required
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetMonthly" className="text-foreground">
                    Monthly Budget
                  </Label>
                  <Input
                    id="budgetMonthly"
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetMonthly}
                    onChange={(e) => setBudgetMonthly(e.target.value)}
                    placeholder="2500"
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-foreground">Team Members</Label>
                  <div className="space-y-2">
                    {members.map((member, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={member}
                          onChange={(e) => handleMemberChange(index, e.target.value)}
                          placeholder={`Member ${index + 1} name`}
                          className="flex-1 border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
                        />
                        {members.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveMember(index)}
                            className="shrink-0 border-border text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove member</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddMember}
                    className="w-full gap-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add Member
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Group"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            You can always add access later from the dashboard.
          </p>
        </main>
      </div>
    </RequireAuth>
  )
}
