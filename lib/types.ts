export interface Member {
  id: string
  name: string
  avatar: string
  walletAddress: string
  contribution: number
}

export interface Transaction {
  id: string
  description: string
  amount: number
  type: "contribution" | "expense"
  memberId: string
  memberName: string
  date: string
  isPrivate: boolean
  category: string
  encryptedValue?: string
}

export interface Group {
  id: string
  name: string
  budgetMonthly: number
  totalBalance: number
  members: Member[]
  transactions: Transaction[]
}

export interface Insight {
  id: string
  type: "warning" | "info" | "success"
  title: string
  message: string
}

export interface SpendingCategory {
  name: string
  amount: number
  percentage: number
  color: string
}

export interface AIMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export interface AddTransactionInput {
  description: string
  amount: number
  type: "contribution" | "expense"
  memberId: string
  memberName: string
  isPrivate: boolean
  category: string
}
