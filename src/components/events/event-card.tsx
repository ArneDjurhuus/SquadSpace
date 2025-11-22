"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { Event, Profile } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { rsvpToEvent, deleteEvent } from "@/app/actions/events"

interface EventCardProps {
  event: Event
  currentUser: Profile | null
}

export function EventCard({ event, currentUser }: EventCardProps) {
  const [isRsvping, setIsRsvping] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const userRsvp = event.participants?.find(p => p.user_id === currentUser?.id)?.status
  const goingCount = event.participants?.filter(p => p.status === 'going').length || 0
  const maybeCount = event.participants?.filter(p => p.status === 'maybe').length || 0

  const handleRsvp = async (status: 'going' | 'maybe' | 'not_going') => {
    if (!currentUser) return
    setIsRsvping(true)
    try {
      await rsvpToEvent(event.id, status)
    } finally {
      setIsRsvping(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return
    setIsDeleting(true)
    try {
      await deleteEvent(event.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const isCreator = currentUser?.id === event.created_by

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{event.title}</CardTitle>
          {isCreator && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete
            </Button>
          )}
        </div>
        <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            {format(new Date(event.start_time), "EEEE, MMMM d, yyyy")}
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
          </div>
          {event.location && (
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              {event.location}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{event.description}</p>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span className="font-semibold mr-1">{goingCount}</span> going
          </div>
          <div className="text-muted-foreground">
            <span className="font-semibold mr-1">{maybeCount}</span> maybe
          </div>
        </div>

        <div className="mt-4 flex -space-x-2 overflow-hidden">
          {event.participants?.filter(p => p.status === 'going').slice(0, 5).map((participant) => (
            <Avatar key={participant.id} className="inline-block border-2 border-background h-8 w-8">
              <AvatarImage src={participant.user?.image || ""} />
              <AvatarFallback>{participant.user?.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
          ))}
          {(event.participants?.filter(p => p.status === 'going').length || 0) > 5 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
              +{(event.participants?.filter(p => p.status === 'going').length || 0) - 5}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="flex space-x-2 w-full">
          <Button 
            variant={userRsvp === 'going' ? "default" : "outline"} 
            className="flex-1"
            onClick={() => handleRsvp('going')}
            disabled={isRsvping}
          >
            Going
          </Button>
          <Button 
            variant={userRsvp === 'maybe' ? "default" : "outline"} 
            className="flex-1"
            onClick={() => handleRsvp('maybe')}
            disabled={isRsvping}
          >
            Maybe
          </Button>
          <Button 
            variant={userRsvp === 'not_going' ? "default" : "outline"} 
            className="flex-1"
            onClick={() => handleRsvp('not_going')}
            disabled={isRsvping}
          >
            Can&apos;t Go
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
