"use client"

import { useEffect, useState } from "react"
import { Lock, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { AddTransactionInput, Member, Transaction } from "@/lib/types"

interface EditTransactionModalProps {
  members: Member[]
  transaction: Transaction
  onSave: (transactionId: string, input: AddTransactionInput) => Promise<unknown>
}

const categories = ["Food", "Software", "Office", "Events", "Travel", "Other"]

export function EditTransactionModal({
  members,
  transaction,
  onSave,
}: EditTransactionModalProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"contribution" | "expense">(transaction.type)
  const [description, setDescription] = useState(transaction.description)
  const [amount, setAmount] = useState(String(transaction.amount))
  const [memberId, setMemberId] = useState(transaction.memberId)
  const [category, setCategory] = useState(
    transaction.type === "contribution" ? "Contribution" : transaction.category
  )
  const [isPrivate, setIsPrivate] = useState(transaction.isPrivate)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setType(transaction.type)
      setDescription(transaction.description)
      setAmount(String(transaction.amount))
      setMemberId(transaction.memberId)
      setCategory(transaction.type === "contribution" ? "Contribution" : transaction.category)
      setIsPrivate(transaction.isPrivate)
    }
  }, [open, transaction])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const member = members.find((candidate) => candidate.id === memberId)
    const parsedAmount = Number.parseFloat(amount)

    if (!member || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(transaction.id, {
        description: description.trim(),
        amount: parsedAmount,
        type,
        memberId: member.id,
        memberName: member.name,
        isPrivate,
        category: type === "contribution" ? "Contribution" : category,
      })
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit transaction</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "contribution" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setType("contribution")}
            >
              Contribution
            </Button>
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setType("expense")}
            >
              Expense
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-description-${transaction.id}`}>Description</Label>
            <Input
              id={`edit-description-${transaction.id}`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="border-border bg-secondary/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-amount-${transaction.id}`}>Amount</Label>
            <Input
              id={`edit-amount-${transaction.id}`}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="border-border bg-secondary/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Team Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger className="border-border bg-secondary/50">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "expense" ? (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-border bg-secondary/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {categories.map((entry) => (
                    <SelectItem key={entry} value={entry}>
                      {entry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Private Mode</p>
                <p className="text-xs text-muted-foreground">Hide exact amount from others</p>
              </div>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              disabled={isSubmitting}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting ||
              !description.trim() ||
              !amount ||
              Number.parseFloat(amount) <= 0 ||
              !memberId ||
              (type === "expense" && !category)
            }
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
