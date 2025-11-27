"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Star } from "lucide-react"

interface LeaderboardEntry {
  id: string
  rank: number
  username: string
  avatar?: string
  score: number
  winRate: string
  matches: number
}

// Mock data - in a real app this would come from the database
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', rank: 1, username: 'ProGamer123', score: 2500, winRate: '68%', matches: 142 },
  { id: '2', rank: 2, username: 'StreamQueen', score: 2350, winRate: '62%', matches: 98 },
  { id: '3', rank: 3, username: 'NoobMaster', score: 2100, winRate: '55%', matches: 215 },
  { id: '4', rank: 4, username: 'TacticalOps', score: 1950, winRate: '51%', matches: 87 },
  { id: '5', rank: 5, username: 'CasualDave', score: 1800, winRate: '48%', matches: 45 },
]

export function Leaderboard({ squadId }: { squadId: string }) {
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
          {MOCK_LEADERBOARD.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 font-bold text-lg text-muted-foreground">
                  {entry.rank === 1 && <Medal className="h-6 w-6 text-yellow-500" />}
                  {entry.rank === 2 && <Medal className="h-6 w-6 text-gray-400" />}
                  {entry.rank === 3 && <Medal className="h-6 w-6 text-amber-600" />}
                  {entry.rank > 3 && `#${entry.rank}`}
                </div>
                <Avatar>
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback>{entry.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{entry.username}</p>
                  <p className="text-xs text-muted-foreground">{entry.matches} matches played</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                  <p className="font-bold">{entry.winRate}</p>
                </div>
                <div className="w-24">
                  <p className="text-sm font-medium text-muted-foreground">Score</p>
                  <div className="flex items-center justify-end gap-1 text-primary">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="font-bold text-lg">{entry.score}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
