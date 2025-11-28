'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMilestone(squadId: string, formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string
  const dateStr = formData.get('date') as string
  const quarter = formData.get('quarter') as string

  const { error } = await supabase
    .from('milestones')
    .insert({
      squad_id: squadId,
      title,
      description,
      status,
      target_date: dateStr ? new Date(dateStr).toISOString() : null,
      quarter
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}

export async function deleteMilestone(squadId: string, milestoneId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', milestoneId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}

export async function updateMilestoneStatus(squadId: string, milestoneId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('milestones')
    .update({ status })
    .eq('id', milestoneId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/squads/${squadId}`)
  return { success: true }
}
