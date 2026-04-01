"use client"

import { Suspense, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Ghost, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function AuthPageFallback() {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="section-card min-h-[80vh] animate-pulse rounded-[2rem]" />
      </div>
    </div>
  )
}

function AuthPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") ?? "/dashboard"
  const { login, signup } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")
  const [signUpName, setSignUpName] = useState("")
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ email: signInEmail, password: signInPassword })
      router.push(nextPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signup({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
      })
      router.push(nextPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <Link href="/">
            <Button variant="ghost" className="rounded-xl">
              Back home
            </Button>
          </Link>
        </header>

        <main className="grid min-h-[calc(100vh-5rem)] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="section-card relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(111,227,182,0.22),_transparent_70%)]" />
            <div className="relative max-w-xl">
              <span className="page-header-eyebrow">
                <ShieldCheck className="h-3.5 w-3.5" />
                Professional team finance access
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                Sign in to the workspace your team can actually trust.
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                Contributions, expenses, recurring plans, billing controls, and AI analysis all stay
                inside one private, structured ledger.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <LockKeyhole className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-sm font-medium text-foreground">Secure sessions</p>
                  <p className="mt-2 text-sm text-muted-foreground">Cookie-based auth with protected routes.</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-sm font-medium text-foreground">AI-ready workspace</p>
                  <p className="mt-2 text-sm text-muted-foreground">Ask questions grounded in live ledger data.</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-sm font-medium text-foreground">Role-based access</p>
                  <p className="mt-2 text-sm text-muted-foreground">Owner, admin, member, and viewer support.</p>
                </div>
              </div>
            </div>
          </section>

          <Card className="section-card border-0 bg-transparent shadow-none">
            <CardContent className="p-0">
              <div className="rounded-[1.75rem] border border-border/70 bg-card/85 p-6 backdrop-blur-xl sm:p-8">
                <div className="mb-6">
                  <p className="page-header-eyebrow">Account access</p>
                  <h2 className="mt-4 text-2xl font-semibold text-foreground">Welcome back</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Sign in to your finance workspace or create a new account to launch one.
                  </p>
                </div>

                <Tabs defaultValue="signin" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/70 p-1">
                    <TabsTrigger value="signin" className="rounded-lg">
                      Sign in
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg">
                      Create account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sign-in-email">Work email</Label>
                        <Input
                          id="sign-in-email"
                          type="email"
                          value={signInEmail}
                          onChange={(event) => setSignInEmail(event.target.value)}
                          placeholder="team@company.com"
                          required
                          className="h-12 rounded-xl bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sign-in-password">Password</Label>
                          <span className="text-xs text-muted-foreground">Session protected</span>
                        </div>
                        <Input
                          id="sign-in-password"
                          type="password"
                          value={signInPassword}
                          onChange={(event) => setSignInPassword(event.target.value)}
                          placeholder="Enter your password"
                          required
                          className="h-12 rounded-xl bg-background/70"
                        />
                      </div>
                      <Button type="submit" className="h-12 w-full gap-2 rounded-xl" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Sign in to workspace"}
                        {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="sign-up-name">Full name</Label>
                        <Input
                          id="sign-up-name"
                          value={signUpName}
                          onChange={(event) => setSignUpName(event.target.value)}
                          placeholder="Grace A."
                          required
                          className="h-12 rounded-xl bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sign-up-email">Work email</Label>
                        <Input
                          id="sign-up-email"
                          type="email"
                          value={signUpEmail}
                          onChange={(event) => setSignUpEmail(event.target.value)}
                          placeholder="team@company.com"
                          required
                          className="h-12 rounded-xl bg-background/70"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sign-up-password">Password</Label>
                          <span className="text-xs text-muted-foreground">Use 8+ characters</span>
                        </div>
                        <Input
                          id="sign-up-password"
                          type="password"
                          value={signUpPassword}
                          onChange={(event) => setSignUpPassword(event.target.value)}
                          placeholder="Create a secure password"
                          required
                          minLength={8}
                          className="h-12 rounded-xl bg-background/70"
                        />
                      </div>
                      <Button type="submit" className="h-12 w-full gap-2 rounded-xl" disabled={isSubmitting}>
                        {isSubmitting ? "Creating account..." : "Create account"}
                        {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {error ? (
                  <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPageClient />
    </Suspense>
  )
}
