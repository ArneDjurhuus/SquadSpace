'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function createDeck(squadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  const { error } = await supabase
    .from('flashcard_decks')
    .insert({
      squad_id: squadId,
      creator_id: user.id,
      title,
      description
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}

export async function deleteDeck(squadId: string, deckId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('flashcard_decks')
    .delete()
    .eq('id', deckId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
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

export async function createFlashcard(deckId: string, formData: FormData) {
  const supabase = await createClient()
  
  const front = formData.get('front') as string
  const back = formData.get('back') as string

  const { error } = await supabase
    .from('flashcards')
    .insert({
      deck_id: deckId,
      front,
      back
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function deleteFlashcard(cardId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
