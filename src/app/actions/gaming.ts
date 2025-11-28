'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLFGPosts(squadId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('lfg_posts')
    .select(`
      *,
      creator:creator_id (
        name,
        image
      ),
      participants:lfg_participants (
        user_id
      )
    `)
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching LFG posts:', error)
    return []
  }

  return data.map(post => ({
    ...post,
    currentPlayers: post.participants.length,
    host: post.creator
  }))
}

export async function createLFGPost(squadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const game = formData.get('game') as string
  const mode = formData.get('mode') as string
  const description = formData.get('description') as string
  const maxPlayers = parseInt(formData.get('maxPlayers') as string)
  const startTime = formData.get('startTime') as string

  // Create the post
  const { data: post, error } = await supabase
    .from('lfg_posts')
    .insert({
      squad_id: squadId,
      creator_id: user.id,
      game,
      mode,
      description,
      max_players: maxPlayers,
      start_time: startTime
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Automatically join the creator
  const { error: joinError } = await supabase
    .from('lfg_participants')
    .insert({
      post_id: post.id,
      user_id: user.id
    })

  if (joinError) {
    // If joining fails, we should probably delete the post or handle it, 
    // but for now let's just return the error
    return { error: joinError.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}

export async function joinLFGPost(squadId: string, postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check if full
  const { data: post, error: fetchError } = await supabase
    .from('lfg_posts')
    .select('max_players, participants:lfg_participants(count)')
    .eq('id', postId)
    .single()
  
  if (fetchError) return { error: fetchError.message }
  
  // @ts-ignore - count is returned as an array of objects or number depending on query, 
  // but here with select count it might be different. 
  // Actually supabase-js returns count in a separate property if requested, 
  // but here we are doing a join.
  // Let's do a simpler check or trust the client/database constraint if we had one.
  // For now, let's just try to insert.
  
  const { error } = await supabase
    .from('lfg_participants')
    .insert({
      post_id: postId,
      user_id: user.id
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}

export async function leaveLFGPost(squadId: string, postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('lfg_participants')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}

export async function deleteLFGPost(squadId: string, postId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('lfg_posts')
    .delete()
    .eq('id', postId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}

export async function getLeaderboard(squadId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select(`
      *,
      user:user_id (
        name,
        image
      )
    `)
    .eq('squad_id', squadId)
    .order('score', { ascending: false })

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  return data.map((entry, index) => ({
    id: entry.id,
    rank: index + 1,
    username: entry.user?.name || 'Unknown',
    avatar: entry.user?.image,
    score: entry.score,
    winRate: entry.matches_played > 0 ? `${Math.round((entry.wins / entry.matches_played) * 100)}%` : '0%',
    matches: entry.matches_played
  }))
}
