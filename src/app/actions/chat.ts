'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getChannels(squadId: string) {
  const supabase = await createClient()
  
  const { data: channels, error } = await supabase
    .from('channels')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching channels:', error)
    return []
  }

  return channels
}

export async function createChannel(squadId: string, name: string) {
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
    return { error: error.message }
  }

  revalidatePath(`/squads/${squadId}`)
  return { data }
}

export async function getMessages(channelId: string) {
  const supabase = await createClient()
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id(*),
      reactions(*)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return messages
}

export async function addReaction(messageId: string, emoji: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
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
    if (error.code === '23505') return { success: true }
    return { error: error.message }
  }

  return { success: true }
}

export async function sendMessage(channelId: string, content: string, imageUrl?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      content: content,
      image_url: imageUrl,
      sender_id: user.id
    })
    .select('*, sender:profiles!sender_id(*)')
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}

export async function deleteChannel(channelId: string) {
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
    return { error: error.message }
  }

  if (channel) {
    revalidatePath(`/squads/${channel.squad_id}`)
  }
  
  return { success: true }
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id) // Ensure user owns the message

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function searchMessages(squadId: string, query: string, channelId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', data: [] }
  }

  if (!query.trim()) {
    return { data: [] }
  }

  // First get all channel IDs for this squad (that the user has access to)
  const { data: channels } = await supabase
    .from('channels')
    .select('id, name')
    .eq('squad_id', squadId)

  if (!channels || channels.length === 0) {
    return { data: [] }
  }

  const channelIds = channelId 
    ? [channelId]
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
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error searching messages:', error)
    return { error: error.message, data: [] }
  }

  return { data: messages || [] }
}
