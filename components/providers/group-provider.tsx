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
import { buildEncryptedValue } from "@/lib/group-analytics"
import { mockGroup } from "@/lib/mock-data"
import type { AddTransactionInput, Group, Member, Transaction } from "@/lib/types"

interface CreateGroupInput {
  name: string
  memberNames: string[]
  budgetMonthly: number
}

interface GroupContextValue {
  group: Group
  createGroup: (input: CreateGroupInput) => void
  addTransaction: (transaction: AddTransactionInput) => void
}

const STORAGE_KEY = "ghost-ledger-group"

const GroupContext = createContext<GroupContextValue | null>(null)

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)
}

function buildWalletAddress(index: number) {
  return `0xTEAM${(index + 1).toString().padStart(4, "0")}SAFE`
}

function buildMember(name: string, index: number): Member {
  return {
    id: `m${Date.now()}-${index}`,
    name,
    avatar: getInitials(name),
    walletAddress: buildWalletAddress(index),
    contribution: 0,
  }
}

function withEncryptedValue(transaction: Transaction): Transaction {
  if (!transaction.isPrivate) return transaction

  return {
    ...transaction,
    encryptedValue: buildEncryptedValue(transaction.amount),
  }
}

export function GroupProvider({ children }: { children: ReactNode }) {
  const [group, setGroup] = useState<Group>(mockGroup)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setIsHydrated(true)
      return
    }

    try {
      setGroup(JSON.parse(stored) as Group)
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(group))
  }, [group, isHydrated])

  const createGroup = useCallback((input: CreateGroupInput) => {
    const members = input.memberNames.map((memberName, index) =>
      buildMember(memberName, index)
    )

    setGroup({
      id: `g${Date.now()}`,
      name: input.name,
      budgetMonthly: input.budgetMonthly,
      totalBalance: 0,
      members,
      transactions: [],
    })
  }, [])

  const addTransaction = useCallback((transaction: AddTransactionInput) => {
    setGroup((currentGroup) => {
      const nextTransaction: Transaction = withEncryptedValue({
        ...transaction,
        id: `t${Date.now()}`,
        date: new Date().toISOString().split("T")[0] ?? "",
      })

      const members = currentGroup.members.map((member) => {
        if (member.id !== transaction.memberId) return member
        if (transaction.type !== "contribution") return member

        return {
          ...member,
          contribution: member.contribution + transaction.amount,
        }
      })

      return {
        ...currentGroup,
        totalBalance:
          transaction.type === "contribution"
            ? currentGroup.totalBalance + transaction.amount
            : currentGroup.totalBalance - transaction.amount,
        members,
        transactions: [nextTransaction, ...currentGroup.transactions],
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      group,
      createGroup,
      addTransaction,
    }),
    [group, createGroup, addTransaction]
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
