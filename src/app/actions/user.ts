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
