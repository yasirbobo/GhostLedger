"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import type { Member } from "@/lib/types"

interface MembersListProps {
  members: Member[]
  totalContributions: number
}

export function MembersList({ members, totalContributions }: MembersListProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Users className="h-4 w-4 text-primary" />
          Team Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => {
          const percentage =
            totalContributions > 0
              ? Math.round((member.contribution / totalContributions) * 100)
              : 0
          return (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    ${member.contribution.toLocaleString()}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {member.walletAddress}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
