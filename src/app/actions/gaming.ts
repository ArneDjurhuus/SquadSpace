'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createLFGSchema, joinLFGSchema } from '@/lib/validation'
import {
  successResponse,
  errorResponse,
  handleActionError,
  ErrorCode,
  type ActionResponse,
} from '@/lib/errors'
import { log } from '@/lib/logger'

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
    log.error('Error fetching LFG posts', error, { squadId })
    return []
  }

  return data.map(post => ({
    ...post,
    currentPlayers: post.participants.length,
    host: post.creator
  }))
}

export async function createLFGPost(formData: FormData): Promise<ActionResponse<{ postId: string }>> {
  try {
    const validatedData = createLFGSchema.parse({
      squadId: formData.get('squadId'),
      game: formData.get('game'),
      mode: formData.get('mode'),
      description: formData.get('description'),
      maxPlayers: formData.get('maxPlayers') ? parseInt(formData.get('maxPlayers') as string) : undefined,
      scheduledFor: formData.get('startTime'),
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // Use a transaction-like approach: create post and join in sequence
    // If join fails, we'll delete the post
    let postId: string | null = null

    try {
      // Create the post
      const { data: post, error: postError } = await supabase
        .from('lfg_posts')
        .insert({
          squad_id: validatedData.squadId,
          creator_id: user.id,
          game: validatedData.game,
          mode: validatedData.mode,
          description: validatedData.description,
          max_players: validatedData.maxPlayers,
          start_time: validatedData.scheduledFor
        })
        .select('id')
        .single()

      if (postError) {
        throw postError
      }

      postId = post.id

      // Automatically join the creator
      const { error: joinError } = await supabase
        .from('lfg_participants')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      if (joinError) {
        // Rollback: delete the post if join fails
        await supabase
          .from('lfg_posts')
          .delete()
          .eq('id', postId)
        
        log.error('Failed to join creator to LFG post, rolled back', joinError, { postId, userId: user.id })
        return errorResponse(ErrorCode.TRANSACTION_FAILED, 'Failed to create LFG post')
      }

      log.info('LFG post created successfully', { postId, userId: user.id })

      revalidatePath(`/dashboard/squads/${validatedData.squadId}`)
      return successResponse({ postId })
    } catch (innerError) {
      // Clean up orphaned post if it was created
      if (postId) {
        await supabase
          .from('lfg_posts')
          .delete()
          .eq('id', postId)
      }
      throw innerError
    }
  } catch (error) {
    return handleActionError(error)
  }
}

export async function joinLFGPost(formData: FormData): Promise<ActionResponse<void>> {
  try {
    const validatedData = joinLFGSchema.parse({
      postId: formData.get('postId'),
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // Check capacity before joining
    const { data: post, error: fetchError } = await supabase
      .from('lfg_posts')
      .select('max_players, participants:lfg_participants(count)')
      .eq('id', validatedData.postId)
      .single()
    
    if (fetchError) {
      return errorResponse(ErrorCode.RESOURCE_NOT_FOUND, 'LFG post not found')
    }

    const currentCount = (post.participants as unknown as { count: number }[])[0]?.count || 0
    
    if (currentCount >= post.max_players) {
      return errorResponse(ErrorCode.LFG_FULL)
    }

    // Check if already joined
    const { data: existingParticipant } = await supabase
      .from('lfg_participants')
      .select('id')
      .eq('post_id', validatedData.postId)
      .eq('user_id', user.id)
      .single()

    if (existingParticipant) {
      return errorResponse(ErrorCode.RESOURCE_ALREADY_EXISTS, 'Already joined this group')
    }

    const { error } = await supabase
      .from('lfg_participants')
      .insert({
        post_id: validatedData.postId,
        user_id: user.id
      })

    if (error) {
      // Check if it's a capacity error (unique constraint or duplicate)
      if (error.code === '23505') {
        return errorResponse(ErrorCode.RESOURCE_ALREADY_EXISTS, 'Already joined this group')
      }
      log.error('Failed to join LFG post', error, { postId: validatedData.postId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to join group')
    }

    log.info('User joined LFG post', { postId: validatedData.postId, userId: user.id })

    revalidatePath(`/dashboard/squads`)
    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function leaveLFGPost(postId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { error } = await supabase
      .from('lfg_participants')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)

    if (error) {
      log.error('Failed to leave LFG post', error, { postId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to leave group')
    }

    log.info('User left LFG post', { postId, userId: user.id })

    revalidatePath(`/dashboard/squads`)
    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function deleteLFGPost(postId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // Verify user is the creator
    const { data: post, error: fetchError } = await supabase
      .from('lfg_posts')
      .select('creator_id')
      .eq('id', postId)
      .single()

    if (fetchError) {
      return errorResponse(ErrorCode.RESOURCE_NOT_FOUND, 'LFG post not found')
    }

    if (post.creator_id !== user.id) {
      return errorResponse(ErrorCode.PERMISSION_DENIED, 'Only the creator can delete this post')
    }

    const { error } = await supabase
      .from('lfg_posts')
      .delete()
      .eq('id', postId)

    if (error) {
      log.error('Failed to delete LFG post', error, { postId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to delete post')
    }

    log.info('LFG post deleted', { postId, userId: user.id })

    revalidatePath(`/dashboard/squads`)
    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
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
    log.error('Error fetching leaderboard', error, { squadId })
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
