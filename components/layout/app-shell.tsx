"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar />
      <main className="min-h-screen lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {children}
        </div>
      </main>
    </div>
  )
}
