'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionResponse, handleActionError, createSuccessResponse } from '@/lib/errors'

const updateAppearanceSchema = z.object({
  squadId: z.string().uuid(),
  bannerUrl: z.string().url(),
  primaryColor: z.string()
})

export async function updateSquadAppearance(data: z.infer<typeof updateAppearanceSchema>): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const { squadId, bannerUrl, primaryColor } = updateAppearanceSchema.parse(data)
    const supabase = await createClient()
    
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

    if (error) throw error

    revalidatePath(`/dashboard/squads/${squadId}`)
    return createSuccessResponse(undefined)
  })
}
