'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createTournamentSchema } from "@/lib/validation"
import { ActionResponse, handleActionError, createSuccessResponse } from "@/lib/errors"

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

export async function createTournament(data: z.infer<typeof createTournamentSchema>): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const validatedData = createTournamentSchema.parse(data)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('tournaments')
      .insert({
        squad_id: validatedData.squadId,
        name: validatedData.name,
        description: validatedData.description,
        start_date: validatedData.startDate,
        format: validatedData.format,
        created_by: user.id
      })

    if (error) throw error

    revalidatePath(`/squads/${validatedData.squadId}`)
    return createSuccessResponse(undefined)
  })
}

export async function joinTournament(tournamentId: string, squadId: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('tournament_participants')
      .insert({
        tournament_id: tournamentId,
        user_id: user.id
      })

    if (error) throw error

    revalidatePath(`/squads/${squadId}`)
    return createSuccessResponse(undefined)
  })
}

export async function leaveTournament(tournamentId: string, squadId: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('tournament_participants')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath(`/squads/${squadId}`)
    return createSuccessResponse(undefined)
  })
}

export async function deleteTournament(tournamentId: string, squadId: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId)

    if (error) throw error

    revalidatePath(`/squads/${squadId}`)
    return createSuccessResponse(undefined)
  })
}
