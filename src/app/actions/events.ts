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
      .update({ status })
      .eq('id', existing.id)
    error = result.error
  } else {
    const result = await supabase
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status,
      })
    error = result.error
  }

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/squads/[squadId]`) // Note: We might not know the squadId here easily without passing it or fetching it. 
  // Ideally we should revalidate the specific path where events are shown.
  // For now, we'll rely on client-side updates or broad revalidation if possible, 
  // but since we don't have squadId, we might need to pass it or fetch it.
  // Let's fetch the event to get the squad_id for proper revalidation.
  
  const { data: event } = await supabase.from('events').select('squad_id').eq('id', eventId).single()
  if (event) {
    revalidatePath(`/squads/${event.squad_id}`)
  }
  
  return { success: true }
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
