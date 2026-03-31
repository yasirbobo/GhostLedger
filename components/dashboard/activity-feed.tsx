"use client"

import { Activity, ArrowRightLeft, Shield, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGroup } from "@/components/providers/group-provider"

function formatActivityDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getActivityIcon(type: string) {
  switch (type) {
    case "invite":
      return Users
    case "transaction":
      return ArrowRightLeft
    default:
      return Shield
  }
}

export function ActivityFeed() {
  const { group } = useGroup()
  const activity = group.activity ?? []

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Activity className="h-4 w-4 text-primary" />
          Activity Feed
        </CardTitle>
        <CardDescription>
          Recent access and ledger updates inside this workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((event) => {
              const Icon = getActivityIcon(event.type)

              return (
                <div
                  key={event.id}
                  className="flex gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatActivityDate(event.occurredAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Activity will appear here as your team adds transactions and manages access.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
