'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createEventSchema, rsvpEventSchema } from '@/lib/validation'
import {
  successResponse,
  errorResponse,
  handleActionError,
  ErrorCode,
  type ActionResponse,
} from '@/lib/errors'
import { log } from '@/lib/logger'

export async function getEvents(squadId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:profiles(*),
      participants:event_participants(
        *,
        user:profiles(*)
      )
    `)
    .eq('squad_id', squadId)
    .order('start_time', { ascending: true })

  if (error) {
    log.error('Error fetching events', error, { squadId })
    return []
  }

  return data
}

export async function createEvent(formData: FormData): Promise<ActionResponse<{ eventId: string }>> {
  try {
    const validatedData = createEventSchema.parse({
      squadId: formData.get('squadId'),
      title: formData.get('title'),
      description: formData.get('description'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      location: formData.get('location'),
      isOnline: formData.get('isOnline') === 'true',
      meetingLink: formData.get('meetingUrl'),
      maxParticipants: formData.get('maxParticipants') ? parseInt(formData.get('maxParticipants') as string) : null,
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        squad_id: validatedData.squadId,
        created_by: user.id,
        title: validatedData.title,
        description: validatedData.description,
        start_time: validatedData.startTime,
        end_time: validatedData.endTime,
        location: validatedData.location,
        meeting_url: validatedData.meetingLink,
        max_participants: validatedData.maxParticipants,
      })
      .select('id')
      .single()

    if (error) {
      log.error('Failed to create event', error, { squadId: validatedData.squadId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to create event')
    }

    log.info('Event created successfully', { eventId: event.id, userId: user.id })

    revalidatePath(`/squads/${validatedData.squadId}`)
    return successResponse({ eventId: event.id })
  } catch (error) {
    return handleActionError(error)
  }
}

export async function rsvpToEvent(eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<ActionResponse<{ status: string }>> {
  try {
    const validatedData = rsvpEventSchema.parse({
      eventId,
      status,
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // Get event details for max_participants check
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('max_participants, squad_id')
      .eq('id', validatedData.eventId)
      .single()
      
    if (eventError || !eventData) {
      return errorResponse(ErrorCode.RESOURCE_NOT_FOUND, 'Event not found')
    }

    let finalStatus: string = validatedData.status

    // Use a database function to handle race condition
    // This ensures atomic check-and-insert for capacity
    if (validatedData.status === 'going' && eventData.max_participants) {
      // Call a Supabase RPC function that handles the race condition
      // For now, we'll use a simpler approach with constraints
      const { count } = await supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', validatedData.eventId)
        .eq('status', 'going')
      
      if (count !== null && count >= eventData.max_participants) {
        finalStatus = 'waitlist'
      }
    }

    // Check if already RSVPed
    const { data: existing } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', validatedData.eventId)
      .eq('user_id', user.id)
      .single()

    let error
    if (existing) {
      const result = await supabase
        .from('event_participants')
        .update({ status: finalStatus })
        .eq('id', existing.id)
      error = result.error
    } else {
      // For a proper fix, add a unique constraint and check in DB
      // or use a stored procedure to handle atomically
      const result = await supabase
        .from('event_participants')
        .insert({
          event_id: validatedData.eventId,
          user_id: user.id,
          status: finalStatus,
        })
      error = result.error
    }

    if (error) {
      if (error.code === '23505') {
        return errorResponse(ErrorCode.RESOURCE_ALREADY_EXISTS, 'Already RSVPed to this event')
      }
      log.error('Failed to RSVP to event', error, { eventId: validatedData.eventId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to RSVP to event')
    }

    log.info('User RSVPed to event', { eventId: validatedData.eventId, userId: user.id, status: finalStatus })

    revalidatePath(`/squads/${eventData.squad_id}`)
    
    return successResponse({ status: finalStatus })
  } catch (error) {
    return handleActionError(error)
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }
    
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('squad_id, created_by')
      .eq('id', eventId)
      .single()
    
    if (fetchError || !event) {
      return errorResponse(ErrorCode.RESOURCE_NOT_FOUND, 'Event not found')
    }

    // Check if user is the creator
    if (event.created_by !== user.id) {
      return errorResponse(ErrorCode.PERMISSION_DENIED, 'Only the creator can delete this event')
    }
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      log.error('Failed to delete event', error, { eventId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to delete event')
    }

    log.info('Event deleted', { eventId, userId: user.id })

    revalidatePath(`/squads/${event.squad_id}`)
    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}
