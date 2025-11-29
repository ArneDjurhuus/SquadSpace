"use client"

import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreatePollDialog } from "./create-poll-dialog"
import { PollCard } from "./poll-card"
import { Poll } from "@/types"

interface PollListProps {
  squadId: string
  polls: Poll[]
  currentUserId: string
}

export function PollList({ squadId, polls, currentUserId }: PollListProps) {
  // Separate active and closed polls
  const activePolls = polls.filter(poll => {
    const isEnded = poll.ends_at ? new Date(poll.ends_at) < new Date() : false
    return !poll.is_closed && !isEnded
  })
  
  const closedPolls = polls.filter(poll => {
    const isEnded = poll.ends_at ? new Date(poll.ends_at) < new Date() : false
    return poll.is_closed || isEnded
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Polls</h2>
          <p className="text-muted-foreground">
            Create polls to gather opinions from your squad
          </p>
        </div>
        <CreatePollDialog squadId={squadId} />
      </div>

      {/* Active Polls */}
      {activePolls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Polls</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activePolls.map((poll) => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                currentUserId={currentUserId} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Closed Polls */}
      {closedPolls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Closed Polls
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {closedPolls.map((poll) => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                currentUserId={currentUserId} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {polls.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No polls yet</CardTitle>
            <CardDescription>
              Create a poll to gather opinions from your squad members
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <CreatePollDialog squadId={squadId} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
