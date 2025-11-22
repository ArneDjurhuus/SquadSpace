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
      sender:profiles(*)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return messages
}

export async function sendMessage(channelId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      content: content,
      sender_id: user.id
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
