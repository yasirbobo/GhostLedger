"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Send, Bot, User } from "lucide-react"
import type { AIMessage } from "@/lib/types"
import { useGroup } from "@/components/providers/group-provider"

export function AIAnalyst() {
  const { group } = useGroup()
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Hi! I'm your AI Financial Analyst. Ask me about your team's spending patterns, contributions, or any financial insights you need.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    void fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: input,
        groupId: group.id,
        previousResponseId,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to analyze finances")
        }
        return response.json() as Promise<{ answer: string; responseId: string | null }>
      })
      .then(({ answer, responseId }) => {
        const assistantMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: answer,
        }

        setPreviousResponseId(responseId)
        setMessages((prev) => [...prev, assistantMessage])
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "I couldn't analyze the ledger right now. Try again after adding more group data.",
          },
        ])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const applySuggestion = (suggestion: string) => {
    if (isLoading) return
    setInput(suggestion)
  }

  const suggestions = [
    "Where is our money going?",
    "Who contributed the most?",
    "Are we overspending?",
  ]

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Financial Analyst
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[240px] space-y-3 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-card-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="flex gap-1 rounded-lg border border-border bg-card px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            className="flex-1 border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => applySuggestion(suggestion)}
              className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
