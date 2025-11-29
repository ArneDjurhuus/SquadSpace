'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ProfileState = {
  error?: string
  success?: boolean
  message?: string
}

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized', success: false }
  }

  const name = formData.get('name') as string
  const bio = formData.get('bio') as string
  const image = formData.get('image') as string

  const { error } = await supabase
    .from('profiles')
    .update({ 
      name, 
      bio, 
      image, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message, success: false }
  }

  // Update auth metadata so UserNav updates immediately
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: {
      full_name: name,
      avatar_url: image
    }
  })

  if (updateAuthError) {
    console.error('Error updating auth metadata:', updateAuthError)
    // We don't fail the whole request if this fails, as the profile table is the source of truth
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  
  return { success: true, message: 'Profile updated successfully', error: '' }
}

export type StatusState = {
  error?: string
  success?: boolean
}

export async function updateStatus(
  emoji: string | null, 
  text: string | null, 
  expiresAt: string | null
): Promise<StatusState> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized', success: false }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      status_emoji: emoji,
      status_text: text,
      status_expires_at: expiresAt,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function clearStatus(): Promise<StatusState> {
  return updateStatus(null, null, null)
}

export async function getProfile() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}
