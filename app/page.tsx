"use client"

import Link from "next/link"
import {
  ArrowRight,
  Bot,
  Ghost,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const proofPoints = [
  {
    title: "Shared visibility without noise",
    description:
      "Give every team member a clean view of budgets, contributions, and operating spend.",
    icon: Users,
  },
  {
    title: "AI that stays inside the ledger",
    description:
      "Ask direct questions about spend, runway, and fairness with grounded workspace answers.",
    icon: Bot,
  },
  {
    title: "Controls built for trust",
    description:
      "Private transactions, role-based access, exports, billing limits, and operational checks are already in the product.",
    icon: ShieldCheck,
  },
]

const metrics = [
  { label: "Private workspaces", value: "Role-based" },
  { label: "Recurring controls", value: "Built in" },
  { label: "Team reporting", value: "CSV + monthly" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-[0_10px_30px_rgba(111,227,182,0.3)]">
              <Ghost className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">GhostLedger</p>
              <p className="text-xs text-muted-foreground">Private team finance</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" className="rounded-xl px-4">
                Sign in
              </Button>
            </Link>
            <Link href="/create-group">
              <Button className="rounded-xl px-4">
                Create workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-18">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="page-header-eyebrow">
                <LockKeyhole className="h-3.5 w-3.5" />
                Finance operations for modern teams
              </span>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight text-foreground sm:text-6xl">
                Professional shared-finance software that feels calm, private, and in control.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                GhostLedger helps teams manage pooled budgets, contributions, expenses, recurring plans,
                and AI-backed analysis in one secure workspace built for real operating rhythm.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/create-group">
                  <Button size="lg" className="w-full gap-2 rounded-xl sm:w-auto">
                    Launch your workspace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="w-full rounded-xl sm:w-auto">
                    Explore dashboard
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="section-card px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card relative overflow-hidden px-6 py-6 sm:px-8">
              <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(111,227,182,0.22),_transparent_68%)]" />
              <div className="relative">
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Workspace snapshot
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">Core Operations Fund</p>
                  </div>
                  <div className="rounded-2xl bg-primary/12 p-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                    <p className="text-sm text-muted-foreground">Available balance</p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">$42,800</p>
                    <p className="mt-2 text-sm text-primary">Within monthly target</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/10 p-4">
                    <p className="text-sm text-muted-foreground">Recurring plans due</p>
                    <p className="mt-3 text-3xl font-semibold text-foreground">3</p>
                    <p className="mt-2 text-sm text-muted-foreground">Next run in 2 days</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">AI analyst</span>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      Ready
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-foreground">
                    “Spending is concentrated in tooling and contractor payouts. You still have 28% of
                    the budget available this month.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <span className="page-header-eyebrow">Why teams adopt it</span>
            <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
              A product surface designed to feel operational, not experimental.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {proofPoints.map((item) => (
              <div key={item.title} className="section-card px-6 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
