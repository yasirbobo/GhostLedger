"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Lock, Repeat } from "lucide-react"
import type { AddTransactionInput, Member } from "@/lib/types"

interface AddTransactionModalProps {
  members: Member[]
  onAdd: (transaction: AddTransactionInput) => Promise<unknown>
}

export function AddTransactionModal({ members, onAdd }: AddTransactionModalProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"contribution" | "expense">("expense")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [memberId, setMemberId] = useState("")
  const [category, setCategory] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly")
  const [nextRunDate, setNextRunDate] = useState(
    new Date().toISOString().split("T")[0] ?? ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const member = members.find((m) => m.id === memberId)
    const parsedAmount = Number.parseFloat(amount)
    if (!member || Number.isNaN(parsedAmount) || parsedAmount <= 0) return

    setIsSubmitting(true)
    try {
      await onAdd({
        description: description.trim(),
        amount: parsedAmount,
        type,
        memberId,
        memberName: member.name,
        isPrivate,
        category: type === "contribution" ? "Contribution" : category,
        recurrence: isRecurring
          ? {
              frequency,
              nextRunDate,
            }
          : undefined,
      })

      setDescription("")
      setAmount("")
      setMemberId("")
      setCategory("")
      setIsPrivate(false)
      setIsRecurring(false)
      setFrequency("monthly")
      setNextRunDate(new Date().toISOString().split("T")[0] ?? "")
      setOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = ["Food", "Software", "Office", "Events", "Travel", "Other"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-card text-card-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "contribution" ? "default" : "outline"}
              className={`flex-1 ${
                type === "contribution"
                  ? "bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setType("contribution")}
            >
              Contribution
            </Button>
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              className={`flex-1 ${
                type === "expense"
                  ? "bg-destructive text-destructive-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setType("expense")}
            >
              Expense
            </Button>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              required
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Member */}
          <div className="space-y-2">
            <Label htmlFor="member" className="text-foreground">
              Team Member
            </Label>
            <Select value={memberId} onValueChange={setMemberId} required>
              <SelectTrigger className="border-border bg-secondary/50 text-foreground">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card">
                {members.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={member.id}
                    className="text-foreground focus:bg-secondary focus:text-foreground"
                  >
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category (for expenses only) */}
          {type === "expense" && (
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="border-border bg-secondary/50 text-foreground">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-foreground focus:bg-secondary focus:text-foreground"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Private toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Private Mode</p>
                <p className="text-xs text-muted-foreground">
                  Hide exact amount from others
                </p>
              </div>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              disabled={isSubmitting}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Repeat className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Recurring schedule</p>
                  <p className="text-xs text-muted-foreground">
                    Save this as a repeating transaction plan.
                  </p>
                </div>
              </div>
              <Switch
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
                disabled={isSubmitting}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {isRecurring ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Frequency</Label>
                  <Select
                    value={frequency}
                    onValueChange={(value: "weekly" | "monthly") => setFrequency(value)}
                  >
                    <SelectTrigger className="border-border bg-secondary/50 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextRunDate" className="text-foreground">
                    Next run date
                  </Label>
                  <Input
                    id="nextRunDate"
                    type="date"
                    value={nextRunDate}
                    onChange={(event) => setNextRunDate(event.target.value)}
                    className="border-border bg-secondary/50 text-foreground"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={
              isSubmitting ||
              !description.trim() ||
              !amount ||
              Number.parseFloat(amount) <= 0 ||
              !memberId ||
              (isRecurring && !nextRunDate) ||
              (type === "expense" && !category)
            }
          >
            {isSubmitting
              ? "Saving..."
              : `Add ${type === "contribution" ? "Contribution" : "Expense"}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
