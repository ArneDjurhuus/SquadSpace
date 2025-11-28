'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
    console.error('Error fetching events:', JSON.stringify(error, null, 2))
    return []
  }

  return data
}

export async function createEvent(squadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const location = formData.get('location') as string
  const meetingUrl = formData.get('meetingUrl') as string
  const category = formData.get('category') as string
  const maxParticipants = formData.get('maxParticipants') ? parseInt(formData.get('maxParticipants') as string) : null

  const { error } = await supabase
    .from('events')
    .insert({
      squad_id: squadId,
      created_by: user.id,
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      location,
      meeting_url: meetingUrl,
      category,
      max_participants: maxParticipants,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/squads/${squadId}`)
  return { success: true }
}

export async function rsvpToEvent(eventId: string, status: 'going' | 'maybe' | 'not_going') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get event details for max_participants check
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('max_participants, squad_id')
    .eq('id', eventId)
    .single()
    
  if (eventError || !eventData) {
      return { error: 'Event not found' }
  }

  let finalStatus: string = status

  // Check capacity if trying to go
  if (status === 'going' && eventData.max_participants) {
      const { count } = await supabase
          .from('event_participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('status', 'going')
      
      if (count !== null && count >= eventData.max_participants) {
          finalStatus = 'waitlist'
      }
  }

  // Check if already RSVPed
  const { data: existing } = await supabase
    .from('event_participants')
    .select('id')
    .eq('event_id', eventId)
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
    const result = await supabase
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: finalStatus,
      })
    error = result.error
  }

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/squads/${eventData.squad_id}`)
  
  return { success: true, status: finalStatus }
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  
  const { data: event } = await supabase.from('events').select('squad_id').eq('id', eventId).single()
  
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    return { error: error.message }
  }

  if (event) {
    revalidatePath(`/squads/${event.squad_id}`)
  }
  
  return { success: true }
}
