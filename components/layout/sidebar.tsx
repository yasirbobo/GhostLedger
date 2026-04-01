"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronRight,
  CreditCard,
  Ghost,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useGroup } from "@/components/providers/group-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { group } = useGroup()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/auth")
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 border border-border/70 bg-card/85 backdrop-blur lg:hidden"
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-background/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "glass-panel fixed inset-y-3 left-3 z-40 flex w-[calc(100%-1.5rem)] max-w-[18.5rem] flex-col overflow-hidden rounded-[1.75rem] transition-transform lg:inset-y-4 lg:left-4 lg:w-72 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(111,227,182,0.22),_transparent_72%)]" />

        <div className="relative border-b border-sidebar-border/70 px-6 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-[0_10px_30px_rgba(111,227,182,0.35)]">
              <Ghost className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold text-sidebar-foreground">GhostLedger</p>
              <p className="text-xs text-sidebar-foreground/65">Private finance workspace</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
                  Active workspace
                </p>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-sidebar-foreground">
                  {group?.name ?? "Workspace"}
                </p>
              </div>
              <div className="rounded-full border border-primary/30 bg-primary/10 p-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/6 bg-black/10 px-3 py-2">
              <div>
                <p className="text-xs text-sidebar-foreground/55">Secure session</p>
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user?.name ?? "Signed in"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-sidebar-foreground/35" />
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/[0.06] text-sidebar-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-sidebar-foreground/70 hover:bg-white/[0.04] hover:text-sidebar-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border border-transparent",
                    isActive ? "bg-primary/12 text-primary" : "bg-white/[0.03] text-sidebar-foreground/65"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive ? <ChevronRight className="h-4 w-4 text-sidebar-foreground/35" /> : null}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border/70 p-4">
          <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/8 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/12 p-2">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground">Start a new workspace</p>
                <p className="mt-1 text-xs leading-5 text-sidebar-foreground/60">
                  Spin up another ledger for a team, cohort, or operating budget.
                </p>
              </div>
            </div>
          </div>

          <p className="mb-3 truncate text-xs text-sidebar-foreground/55">{user?.email}</p>

          <Link href="/create-group">
            <Button className="w-full gap-2 rounded-xl" onClick={() => setMobileOpen(false)}>
              <Users className="h-4 w-4" />
              New workspace
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="mt-2 w-full justify-start rounded-xl text-sidebar-foreground/70 hover:bg-white/[0.04] hover:text-sidebar-foreground"
            onClick={() => {
              setMobileOpen(false)
              void handleLogout()
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>
    </>
  )
}
