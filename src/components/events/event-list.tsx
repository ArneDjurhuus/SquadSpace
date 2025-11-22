"use client"

import { Event, Profile } from "@/types"
import { EventCard } from "./event-card"

interface EventListProps {
  events: Event[]
  currentUser: Profile | null
}

export function EventList({ events, currentUser }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No upcoming events. Create one to get started!
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} currentUser={currentUser} />
      ))}
    </div>
  )
}
