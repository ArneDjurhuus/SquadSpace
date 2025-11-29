'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { loginSchema, registerSchema, updateProfileSchema } from '@/lib/validation'
import {
  successResponse,
  errorResponse,
  handleActionError,
  ErrorCode,
  type ActionResponse,
} from '@/lib/errors'
import { log } from '@/lib/logger'

export async function login(formData: FormData): Promise<ActionResponse<{ redirectTo: string }>> {
  try {
    // Validate input
    const validatedData = loginSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      log.warn('Login failed', { email: validatedData.email, error: error.message })
      
      // Map Supabase auth errors to our error codes
      if (error.message.includes('Invalid login credentials')) {
        return errorResponse(ErrorCode.AUTH_INVALID_CREDENTIALS)
      }
      
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED, error.message)
    }

    log.info('User logged in successfully', { userId: data.user?.id })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    return handleActionError(error)
  }
}

export async function signup(formData: FormData): Promise<ActionResponse<{ redirectTo: string }>> {
  try {
    // Validate input
    const validatedData = registerSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      fullName: formData.get('name'),
      username: formData.get('username'),
    })

    const supabase = await createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', validatedData.username)
      .single()

    if (existingUser) {
      return errorResponse(
        ErrorCode.RESOURCE_ALREADY_EXISTS,
        'This username is already taken'
      )
    }

    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.fullName,
          username: validatedData.username,
        },
      },
    })

    if (error) {
      log.error('Signup failed', error, { email: validatedData.email })
      
      // Map Supabase auth errors
      if (error.message.includes('User already registered')) {
        return errorResponse(ErrorCode.AUTH_USER_EXISTS)
      }
      
      if (error.message.includes('Password')) {
        return errorResponse(ErrorCode.AUTH_WEAK_PASSWORD, error.message)
      }
      
      return errorResponse(ErrorCode.SERVER_ERROR, error.message)
    }

    log.info('User signed up successfully', { userId: data.user?.id })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    return handleActionError(error)
  }
}

export async function signOut(): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      log.error('Sign out failed', error)
      return errorResponse(ErrorCode.SERVER_ERROR, 'Failed to sign out')
    }

    log.info('User signed out successfully')

    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    return handleActionError(error)
  }
}

export async function updateProfile(formData: FormData): Promise<ActionResponse<void>> {
  try {
    const validatedData = updateProfileSchema.parse({
      fullName: formData.get('fullName'),
      bio: formData.get('bio'),
      avatar: formData.get('avatar'),
      status: formData.get('status'),
      statusEmoji: formData.get('statusEmoji'),
      statusExpiresAt: formData.get('statusExpiresAt'),
    })

    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const updateData: Record<string, unknown> = {}
    if (validatedData.fullName !== undefined) updateData.full_name = validatedData.fullName
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio
    if (validatedData.avatar !== undefined) updateData.avatar_url = validatedData.avatar
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.statusEmoji !== undefined) updateData.status_emoji = validatedData.statusEmoji
    if (validatedData.statusExpiresAt !== undefined) updateData.status_expires_at = validatedData.statusExpiresAt

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      log.error('Profile update failed', error, { userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, 'Failed to update profile')
    }

    log.info('Profile updated successfully', { userId: user.id })

    revalidatePath('/dashboard/settings')
    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}
