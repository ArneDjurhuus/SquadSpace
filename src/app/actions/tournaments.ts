'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getTournaments(squadId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      created_by_user:created_by(name, email, avatar_url),
      participants:tournament_participants(
        user_id,
        status,
        score,
        profiles(name, avatar_url)
      )
    `)
    .eq('squad_id', squadId)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching tournaments:', error)
    return []
  }

  return data
}

export async function createTournament(squadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const startDate = formData.get('startDate') as string
  const format = formData.get('format') as string

  if (!name || !startDate || !format) {
    return { error: 'Missing required fields' }
  }

  const { error } = await supabase
    .from('tournaments')
    .insert({
      squad_id: squadId,
      name,
      description,
      start_date: new Date(startDate).toISOString(),
      format,
      created_by: user.id
    })

  if (error) {
    console.error('Error creating tournament:', error)
    return { error: 'Failed to create tournament' }
  }

  revalidatePath(`/squads/${squadId}`)
  return { success: true }
}

export async function joinTournament(tournamentId: string, squadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('tournament_participants')
    .insert({
      tournament_id: tournamentId,
      user_id: user.id
    })

  if (error) {
    console.error('Error joining tournament:', error)
    return { error: 'Failed to join tournament' }
  }

  revalidatePath(`/squads/${squadId}`)
  return { success: true }
}

export async function leaveTournament(tournamentId: string, squadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('tournament_participants')
    .delete()
    .eq('tournament_id', tournamentId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error leaving tournament:', error)
    return { error: 'Failed to leave tournament' }
  }

  revalidatePath(`/squads/${squadId}`)
  return { success: true }
}

export async function deleteTournament(tournamentId: string, squadId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', tournamentId)

  if (error) {
    console.error('Error deleting tournament:', error)
    return { error: 'Failed to delete tournament' }
  }

  revalidatePath(`/squads/${squadId}`)
  return { success: true }
}
