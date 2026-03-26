"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Ghost,
  Sparkles,
  Lock,
  Users,
  ArrowRight,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Ghost className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              GhostLedger
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Button>
            </Link>
            <Link href="/create-group">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              Private by design
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Private AI-powered financial assistant for{" "}
              <span className="text-primary">teams</span>
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground lg:text-xl">
              Manage your team{"'"}s finances with privacy-first design. Track contributions, 
              expenses, and get AI-powered insights while keeping sensitive data encrypted.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/create-group">
                <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Create a Group
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-secondary/30 py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need for team finance
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Built for modern teams who value both transparency and privacy.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: AI Insights */}
            <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                AI-Powered Insights
              </h3>
              <p className="mt-2 text-muted-foreground">
                Get intelligent analysis of your spending patterns, contribution fairness, 
                and budget recommendations from your AI financial analyst.
              </p>
            </div>

            {/* Feature 2: Privacy Mode */}
            <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Private Mode
              </h3>
              <p className="mt-2 text-muted-foreground">
                Hide exact transaction amounts with encrypted ranges. 
                Perfect for sensitive expenses that need privacy while maintaining accountability.
              </p>
            </div>

            {/* Feature 3: Team Finance */}
            <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Team Finance
              </h3>
              <p className="mt-2 text-muted-foreground">
                Track contributions from each team member, manage shared expenses, 
                and maintain a transparent record of your group{"'"}s financial health.
              </p>
            </div>

            {/* Feature 4: Smart Alerts */}
            <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Smart Alerts
              </h3>
              <p className="mt-2 text-muted-foreground">
                Automatic warnings for budget overruns, contribution imbalances, 
                and savings goal progress to keep your team on track.
              </p>
            </div>

            {/* Feature 5: Spending Analytics */}
            <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Spending Analytics
              </h3>
              <p className="mt-2 text-muted-foreground">
                Visual breakdown of expenses by category with month-over-month trends 
                and detailed transaction history.
              </p>
            </div>

            {/* Feature 6: Ghost Mode */}
            <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Ghost className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Ghost Mode
              </h3>
              <p className="mt-2 text-muted-foreground">
                Seamlessly blend transparency with privacy. Your financial data stays 
                visible to the team while sensitive details remain encrypted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
            <div className="relative px-8 py-16 text-center lg:px-16 lg:py-24">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ready to manage your team{"'"}s finances?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Start with a free group and upgrade as your team grows. 
                No credit card required.
              </p>
              <div className="mt-8">
                <Link href="/create-group">
                  <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Users className="h-4 w-4" />
                    Create a Group
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Ghost className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">GhostLedger</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with privacy in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
