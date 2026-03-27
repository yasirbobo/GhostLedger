"use client"

import { RequireAuth } from "@/components/auth/require-auth"
import { Sidebar } from "./sidebar"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:pl-64">
          <div className="mx-auto max-w-6xl px-4 py-6 pt-16 lg:px-8 lg:py-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
