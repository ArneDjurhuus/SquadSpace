'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createFlashcardSetSchema, createFlashcardSchema } from '@/lib/validation'
import { ActionResponse, handleActionError, createSuccessResponse } from '@/lib/errors'

export async function getDecks(squadId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('flashcard_decks')
    .select(`
      *,
      creator:creator_id (
        name,
        image
      ),
      cards:flashcards (count)
    `)
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching decks:', error)
    return []
  }

  return data.map(deck => ({
    ...deck,
    cardCount: deck.cards[0]?.count || 0
  }))
}

export async function createDeck(data: z.infer<typeof createFlashcardSetSchema>): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const validated = createFlashcardSetSchema.parse(data)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('flashcard_decks')
      .insert({
        squad_id: validated.squadId,
        creator_id: user.id,
        title: validated.title,
        description: validated.description
      })

    if (error) throw error

    revalidatePath(`/dashboard/squads/${validated.squadId}`)
    return createSuccessResponse(undefined)
  })
}

export async function deleteDeck(squadId: string, deckId: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('flashcard_decks')
      .delete()
      .eq('id', deckId)

    if (error) throw error

    revalidatePath(`/dashboard/squads/${squadId}`)
    return createSuccessResponse(undefined)
  })
}

export async function getFlashcards(deckId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching flashcards:', error)
    return []
  }

  return data
}

export async function createFlashcard(data: z.infer<typeof createFlashcardSchema>): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const validated = createFlashcardSchema.parse(data)
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('flashcards')
      .insert({
        deck_id: validated.setId, // Schema uses setId, DB uses deck_id
        front: validated.front,
        back: validated.back
      })

    if (error) throw error

    return createSuccessResponse(undefined)
  })
}

export async function deleteFlashcard(cardId: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId)

    if (error) throw error

    return createSuccessResponse(undefined)
  })
}
