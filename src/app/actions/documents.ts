'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createDocumentRecordSchema } from "@/lib/validation"
import { ActionResponse, handleActionError, createSuccessResponse } from "@/lib/errors"

export async function getDocuments(squadId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:uploader_id (
        name,
        email,
        avatar_url
      )
    `)
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return data
}

export async function createDocumentRecord(data: z.infer<typeof createDocumentRecordSchema>): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const validatedData = createDocumentRecordSchema.parse(data)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('documents')
      .insert({
        squad_id: validatedData.squadId,
        uploader_id: user.id,
        name: validatedData.name,
        file_path: validatedData.filePath,
        size: validatedData.size,
        type: validatedData.type
      })

    if (error) throw error

    revalidatePath(`/squads/${validatedData.squadId}`)
    return createSuccessResponse(undefined)
  })
}

export async function deleteDocument(documentId: string, filePath: string, squadId: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    // 1. Delete from Storage
    const { error: storageError } = await supabase
      .storage
      .from('squad-documents')
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      throw new Error('Failed to delete file from storage')
    }

    // 2. Delete from Database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (dbError) throw dbError

    revalidatePath(`/squads/${squadId}`)
    return createSuccessResponse(undefined)
  })
}
