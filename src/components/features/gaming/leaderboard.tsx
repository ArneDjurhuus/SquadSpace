"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Star } from "lucide-react"
import { getLeaderboard } from "@/app/actions/gaming"

interface LeaderboardEntry {
  id: string
  rank: number
  username: string
  avatar?: string
  score: number
  winRate: string
  matches: number
}

export function Leaderboard({ squadId }: { squadId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const data = await getLeaderboard(squadId)
      setEntries(data as any)
      setIsLoading(false)
    }
    fetchLeaderboard()
  }, [squadId])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Squad Leaderboard
            </CardTitle>
            <CardDescription>Top performers this season</CardDescription>
          </div>
          <Badge variant="secondary">Season 1</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 font-bold text-lg text-muted-foreground">
                  {entry.rank === 1 && <Trophy className="h-6 w-6 text-yellow-500" />}
                  {entry.rank === 2 && <Medal className="h-6 w-6 text-gray-400" />}
                  {entry.rank === 3 && <Medal className="h-6 w-6 text-amber-600" />}
                  {entry.rank > 3 && `#${entry.rank}`}
                </div>
                <Avatar>
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback>{entry.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium leading-none">{entry.username}</p>
                  <p className="text-sm text-muted-foreground mt-1">{entry.matches} matches played</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                  <p className="font-bold">{entry.winRate}</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-medium text-muted-foreground">Score</p>
                  <div className="flex items-center justify-end gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-bold text-foreground">{entry.score}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {entries.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No leaderboard entries yet. Play some games to get ranked!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
