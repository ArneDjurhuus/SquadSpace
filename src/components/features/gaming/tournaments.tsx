'use client'

import { useState } from "react"
import { format } from "date-fns"
import { Trophy, Calendar, Users, Plus, Swords, UserPlus, UserMinus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createTournament, joinTournament, leaveTournament, deleteTournament } from "@/app/actions/tournaments"

interface Participant {
  user_id: string
  status: string
  score: number
  profiles: {
    name: string | null
    avatar_url: string | null
  }
}

interface Tournament {
  id: string
  name: string
  description: string | null
  start_date: string
  status: 'upcoming' | 'ongoing' | 'completed'
  format: 'single_elimination' | 'round_robin' | 'points'
  created_by: string
  created_by_user: {
    name: string | null
    email: string | null
    avatar_url: string | null
  } | null
  participants: Participant[]
}

interface TournamentsProps {
  squadId: string
  tournaments: Tournament[]
  currentUserId: string
}

export function Tournaments({ squadId, tournaments, currentUserId }: TournamentsProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await createTournament(squadId, formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Tournament created")
        setIsCreateOpen(false)
      }
    } catch {
      toast.error("Failed to create tournament")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoin = async (tournamentId: string) => {
    try {
      const result = await joinTournament(tournamentId, squadId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Joined tournament")
      }
    } catch {
      toast.error("Failed to join tournament")
    }
  }

  const handleLeave = async (tournamentId: string) => {
    try {
      const result = await leaveTournament(tournamentId, squadId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Left tournament")
      }
    } catch {
      toast.error("Failed to leave tournament")
    }
  }

  const handleDelete = async (tournamentId: string) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return

    try {
      const result = await deleteTournament(tournamentId, squadId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Tournament deleted")
      }
    } catch {
      toast.error("Failed to delete tournament")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      case 'ongoing': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'completed': return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getFormatLabel = (format: string) => {
    return format.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tournaments</h2>
          <p className="text-muted-foreground">Compete with your squad members</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tournament</DialogTitle>
              <DialogDescription>
                Set up a new tournament for your squad.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input id="name" name="name" placeholder="e.g. Weekly Showdown" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Rules, prizes, etc." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" name="startDate" type="datetime-local" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="format">Format</Label>
                    <Select name="format" defaultValue="single_elimination">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_elimination">Single Elimination</SelectItem>
                        <SelectItem value="round_robin">Round Robin</SelectItem>
                        <SelectItem value="points">Points Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Tournament"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mb-4 opacity-20" />
            <p>No tournaments scheduled.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => {
            const isParticipant = tournament.participants.some(p => p.user_id === currentUserId)
            const isCreator = tournament.created_by === currentUserId

            return (
              <Card key={tournament.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className={getStatusColor(tournament.status)}>
                      {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                    </Badge>
                    {isCreator && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(tournament.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="mt-2">{tournament.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {tournament.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(tournament.start_date), "PPP p")}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Swords className="mr-2 h-4 w-4" />
                    {getFormatLabel(tournament.format)}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    {tournament.participants.length} Participants
                  </div>
                  
                  <div className="flex -space-x-2 overflow-hidden pt-2">
                    {tournament.participants.slice(0, 5).map((participant) => (
                      <div key={participant.user_id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-xs font-medium" title={participant.profiles.name || 'User'}>
                        {participant.profiles.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={participant.profiles.avatar_url} alt={participant.profiles.name || ''} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          (participant.profiles.name?.[0] || 'U')
                        )}
                      </div>
                    ))}
                    {tournament.participants.length > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-background bg-muted text-xs font-medium">
                        +{tournament.participants.length - 5}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {isParticipant ? (
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={() => handleLeave(tournament.id)}>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Leave Tournament
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => handleJoin(tournament.id)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join Tournament
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
