"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { AuthUser } from "@/lib/types"

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (input: { email: string; password: string }) => Promise<AuthUser>
  signup: (input: { name: string; email: string; password: string }) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function readSession() {
  const response = await fetch("/api/auth/session")
  if (!response.ok) {
    throw new Error("Failed to load session")
  }

  return (await response.json()) as { user: AuthUser | null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    const { user } = await readSession()
    setUser(user)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      try {
        const { user } = await readSession()
        if (isMounted) {
          setUser(user)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (input: { email: string; password: string }) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })

    const payload = (await response.json()) as { user?: AuthUser; error?: string }
    if (!response.ok || !payload.user) {
      throw new Error(payload.error ?? "Failed to sign in")
    }

    setUser(payload.user)
    return payload.user
  }, [])

  const signup = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      const payload = (await response.json()) as { user?: AuthUser; error?: string }
      if (!response.ok || !payload.user) {
        throw new Error(payload.error ?? "Failed to create account")
      }

      setUser(payload.user)
      return payload.user
    },
    []
  )

  const logout = useCallback(async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error("Failed to sign out")
    }

    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      signup,
      logout,
      refreshSession,
    }),
    [user, isLoading, login, signup, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}
