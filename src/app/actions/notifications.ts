'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { ActionResponse, handleActionError, createSuccessResponse } from '@/lib/errors'

export async function markNotificationAsRead(id: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard')
    return createSuccessResponse(undefined)
  })
}

export async function markAllNotificationsAsRead(): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) throw error

    revalidatePath('/dashboard')
    return createSuccessResponse(undefined)
  })
}
