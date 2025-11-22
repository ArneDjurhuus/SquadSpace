"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Event, Profile } from "@/types"
import { EventCard } from "./event-card"
import { isSameDay } from "date-fns"

interface SquadCalendarProps {
  events: Event[]
  currentUser: Profile | null
}

export function SquadCalendar({ events, currentUser }: SquadCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const eventsOnSelectedDate = events.filter((event) => 
    date && isSameDay(new Date(event.start_time), date)
  )

  const datesWithEvents = events.map(event => new Date(event.start_time))

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <div className="border rounded-md p-4 flex justify-center bg-card">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            modifiers={{
              hasEvent: datesWithEvents
            }}
            modifiersClassNames={{
              hasEvent: "font-bold text-primary underline decoration-wavy decoration-primary/50"
            }}
          />
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <h3 className="text-lg font-semibold">
          Events for {date?.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h3>
        {eventsOnSelectedDate.length > 0 ? (
          <div className="space-y-4">
            {eventsOnSelectedDate.map((event) => (
              <EventCard key={event.id} event={event} currentUser={currentUser} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No events scheduled for this day.</p>
        )}
      </div>
    </div>
  )
}
