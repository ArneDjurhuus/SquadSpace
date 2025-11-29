'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { updateProfileSchema } from '@/lib/validation'
import { ActionResponse, handleActionError, createSuccessResponse, errorResponse, ErrorCode } from '@/lib/errors'

// Schema for status update
const updateStatusSchema = z.object({
  emoji: z.string().nullable(),
  text: z.string().max(100).nullable(),
  expiresAt: z.string().datetime().nullable()
})

export async function updateProfile(prevState: ActionResponse | null, formData: FormData): Promise<ActionResponse> {
  return handleActionError(async () => {
    // Map form data to schema fields
    const rawData = {
      fullName: formData.get('name'), // Form uses 'name'
      bio: formData.get('bio'),
      avatar: formData.get('image'), // Form uses 'image'
    }

    const validated = updateProfileSchema.parse(rawData)
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // Map schema fields to DB columns
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    if (validated.fullName !== undefined) updateData.name = validated.fullName
    if (validated.bio !== undefined) updateData.bio = validated.bio
    if (validated.avatar !== undefined) updateData.image = validated.avatar

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) throw error

    // Update auth metadata so UserNav updates immediately
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: {
        full_name: validated.fullName,
        avatar_url: validated.avatar
      }
    })

    if (updateAuthError) {
      console.error('Error updating auth metadata:', updateAuthError)
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard')
    
    return createSuccessResponse(undefined)
  })
}

export async function updateStatus(
  emoji: string | null, 
  text: string | null, 
  expiresAt: string | null
): Promise<ActionResponse> {
  return handleActionError(async () => {
    const validated = updateStatusSchema.parse({ emoji, text, expiresAt })
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        status_emoji: validated.emoji,
        status_text: validated.text,
        status_expires_at: validated.expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/dashboard')
    return createSuccessResponse(undefined)
  })
}

export async function clearStatus(): Promise<ActionResponse> {
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
