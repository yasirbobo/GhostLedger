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
import { useAuth } from "@/components/providers/auth-provider"
import { mockGroup } from "@/lib/mock-data"
import type { AddTransactionInput, CreateGroupInput, Group } from "@/lib/types"

interface GroupContextValue {
  group: Group
  isLoading: boolean
  createGroup: (input: CreateGroupInput) => Promise<Group>
  addTransaction: (transaction: AddTransactionInput) => Promise<Group>
  deleteTransaction: (transactionId: string) => Promise<Group>
  refreshGroup: () => Promise<void>
}

const STORAGE_KEY = "ghost-ledger-active-group-id"

const GroupContext = createContext<GroupContextValue | null>(null)

async function readGroup(groupId?: string) {
  const searchParams = new URLSearchParams()
  if (groupId) {
    searchParams.set("groupId", groupId)
  }

  const response = await fetch(`/api/group?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error("Failed to load group")
  }

  return (await response.json()) as { group: Group }
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [group, setGroup] = useState<Group>(mockGroup)
  const [isLoading, setIsLoading] = useState(true)

  const refreshGroup = useCallback(async () => {
    const groupId = window.localStorage.getItem(STORAGE_KEY) ?? undefined
    const { group: nextGroup } = await readGroup(groupId)
    window.localStorage.setItem(STORAGE_KEY, nextGroup.id)
    setGroup(nextGroup)
  }, [])

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!user) {
      setGroup(mockGroup)
      setIsLoading(false)
      return
    }

    let isMounted = true

    async function loadGroup() {
      try {
        const groupId = window.localStorage.getItem(STORAGE_KEY) ?? undefined
        const { group: nextGroup } = await readGroup(groupId)
        if (!isMounted) {
          return
        }

        window.localStorage.setItem(STORAGE_KEY, nextGroup.id)
        setGroup(nextGroup)
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadGroup()

    return () => {
      isMounted = false
    }
  }, [user, isAuthLoading, refreshGroup])

  const createGroup = useCallback(async (input: CreateGroupInput) => {
    const response = await fetch("/api/group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      throw new Error("Failed to create group")
    }

    const { group: nextGroup } = (await response.json()) as { group: Group }
    window.localStorage.setItem(STORAGE_KEY, nextGroup.id)
    setGroup(nextGroup)
    return nextGroup
  }, [])

  const addTransaction = useCallback(async (transaction: AddTransactionInput) => {
    const response = await fetch(`/api/group/${group.id}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    })

    if (!response.ok) {
      throw new Error("Failed to add transaction")
    }

    const { group: nextGroup } = (await response.json()) as { group: Group }
    setGroup(nextGroup)
    return nextGroup
  }, [group.id])

  const deleteTransaction = useCallback(async (transactionId: string) => {
    const response = await fetch(
      `/api/group/${group.id}/transactions/${transactionId}`,
      {
        method: "DELETE",
      }
    )

    if (!response.ok) {
      throw new Error("Failed to delete transaction")
    }

    const { group: nextGroup } = (await response.json()) as { group: Group }
    setGroup(nextGroup)
    return nextGroup
  }, [group.id])

  const value = useMemo(
    () => ({
      group,
      isLoading,
      createGroup,
      addTransaction,
      deleteTransaction,
      refreshGroup,
    }),
    [group, isLoading, createGroup, addTransaction, deleteTransaction, refreshGroup]
  )

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}

export function useGroup() {
  const context = useContext(GroupContext)
  if (!context) {
    throw new Error("useGroup must be used within GroupProvider")
  }
  return context
}
