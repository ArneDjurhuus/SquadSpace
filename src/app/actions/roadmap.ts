'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionResponse, handleActionError, createSuccessResponse } from '@/lib/errors'

const createMilestoneSchema = z.object({
  squadId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string(),
  date: z.string().optional().nullable(),
  quarter: z.string().optional()
})

export async function createMilestone(data: z.infer<typeof createMilestoneSchema>): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const validated = createMilestoneSchema.parse(data)
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('milestones')
      .insert({
        squad_id: validated.squadId,
        title: validated.title,
        description: validated.description,
        status: validated.status,
        target_date: validated.date ? new Date(validated.date).toISOString() : null,
        quarter: validated.quarter
      })

    if (error) throw error

    revalidatePath(`/dashboard/squads/${validated.squadId}`)
    return createSuccessResponse(undefined)
  })
}

export async function deleteMilestone(squadId: string, milestoneId: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()

    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)

    if (error) throw error

    revalidatePath(`/dashboard/squads/${squadId}`)
    return createSuccessResponse(undefined)
  })
}

export async function updateMilestoneStatus(squadId: string, milestoneId: string, status: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()

    const { error } = await supabase
      .from('milestones')
      .update({ status })
      .eq('id', milestoneId)

    if (error) throw error

    revalidatePath(`/dashboard/squads/${squadId}`)
    return createSuccessResponse(undefined)
  })
}
