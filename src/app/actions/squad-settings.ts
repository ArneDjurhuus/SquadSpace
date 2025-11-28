'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSquadAppearance(squadId: string, formData: FormData) {
  const supabase = await createClient()
  
  const bannerUrl = formData.get('bannerUrl') as string
  const primaryColor = formData.get('primaryColor') as string // HSL string

  // Get current settings first to merge
  const { data: squad } = await supabase
    .from('squads')
    .select('settings')
    .eq('id', squadId)
    .single()

  const currentSettings = squad?.settings || {}
  const newSettings = {
    ...currentSettings,
    theme: {
      ...currentSettings.theme,
      primary: primaryColor
    }
  }

  const { error } = await supabase
    .from('squads')
    .update({ 
      banner_url: bannerUrl,
      settings: newSettings,
      updated_at: new Date().toISOString() 
    })
    .eq('id', squadId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}
