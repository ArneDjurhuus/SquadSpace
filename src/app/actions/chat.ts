'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendMessageSchema, searchMessagesSchema, paginationSchema } from '@/lib/validation'
import {
  successResponse,
  errorResponse,
  handleActionError,
  ErrorCode,
  type ActionResponse,
} from '@/lib/errors'
import { log } from '@/lib/logger'

export async function getChannels(squadId: string) {
  const supabase = await createClient()
  
  const { data: channels, error } = await supabase
    .from('channels')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: true })

  if (error) {
    log.error('Error fetching channels', error, { squadId })
    return []
  }

  return channels
}

export async function createChannel(squadId: string, name: string): Promise<ActionResponse<any>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('channels')
      .insert({
        squad_id: squadId,
        name: name,
        type: 'TEXT'
      })
      .select()
      .single()

    if (error) {
      log.error('Failed to create channel', error, { squadId, name })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to create channel')
    }

    revalidatePath(`/squads/${squadId}`)
    return successResponse(data)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function getMessages(channelId: string, cursor?: string, limit: number = 50) {
  const supabase = await createClient()
  
  let query = supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(*),
      reactions(*)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false }) // Newest first for pagination
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: messages, error } = await query

  if (error) {
    log.error('Error fetching messages', error, { channelId })
    return []
  }

  // Reverse to show oldest first in chat window
  return messages.reverse()
}

export async function addReaction(messageId: string, emoji: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { error } = await supabase
      .from('reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji: emoji
      })

    if (error) {
      // Ignore duplicate key error (user already reacted with this emoji)
      if (error.code === '23505') return successResponse(undefined)
      
      log.error('Failed to add reaction', error, { messageId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to add reaction')
    }

    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function sendMessage(channelId: string, content: string, imageUrl?: string): Promise<ActionResponse<any>> {
  try {
    const validatedData = sendMessageSchema.parse({
      channelId,
      content,
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        channel_id: validatedData.channelId,
        content: validatedData.content,
        image_url: imageUrl,
        sender_id: user.id
      })
      .select('*, sender:profiles!sender_id(*)')
      .single()

    if (error) {
      log.error('Failed to send message', error, { channelId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to send message')
    }

    return successResponse(data)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function deleteChannel(channelId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    
    // Get squad_id for revalidation
    const { data: channel } = await supabase
      .from('channels')
      .select('squad_id')
      .eq('id', channelId)
      .single()

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)

    if (error) {
      log.error('Failed to delete channel', error, { channelId })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to delete channel')
    }

    if (channel) {
      revalidatePath(`/squads/${channel.squad_id}`)
    }
    
    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function deleteMessage(messageId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id) // Ensure user owns the message

    if (error) {
      log.error('Failed to delete message', error, { messageId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to delete message')
    }

    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function searchMessages(squadId: string, query: string, channelId?: string): Promise<ActionResponse<any[]>> {
  try {
    const validatedData = searchMessagesSchema.parse({
      squadId,
      query,
      channelId,
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // First get all channel IDs for this squad (that the user has access to)
    const { data: channels } = await supabase
      .from('channels')
      .select('id, name')
      .eq('squad_id', validatedData.squadId)

    if (!channels || channels.length === 0) {
      return successResponse([])
    }

    const channelIds = validatedData.channelId 
      ? [validatedData.channelId]
      : channels.map(c => c.id)

    // Search messages using ilike for partial matching
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, name, image),
        channel:channels!channel_id(id, name)
      `)
      .in('channel_id', channelIds)
      .ilike('content', `%${validatedData.query}%`)
      .order('created_at', { ascending: false })
      .limit(validatedData.limit)

    if (error) {
      log.error('Error searching messages', error, { squadId, query })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to search messages')
    }

    return successResponse(messages || [])
  } catch (error) {
    return handleActionError(error)
  }
}
