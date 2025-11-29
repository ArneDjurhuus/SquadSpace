'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

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

export async function createDocumentRecord(data: {
  squadId: string
  name: string
  filePath: string
  size: number
  type: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('documents')
    .insert({
      squad_id: data.squadId,
      uploader_id: user.id,
      name: data.name,
      file_path: data.filePath,
      size: data.size,
      type: data.type
    })

  if (error) return { error: error.message }

  revalidatePath(`/squads/${data.squadId}`)
  return { success: true }
}

export async function deleteDocument(documentId: string, filePath: string, squadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // 1. Delete from Storage
  const { error: storageError } = await supabase
    .storage
    .from('squad-documents')
    .remove([filePath])

  if (storageError) {
    console.error('Storage delete error:', storageError)
    // We continue to delete the record even if storage fails, to keep DB clean? 
    // Or maybe return error. Let's return error to be safe.
    return { error: 'Failed to delete file from storage' }
  }

  // 2. Delete from Database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (dbError) return { error: dbError.message }

  revalidatePath(`/squads/${squadId}`)
  return { success: true }
}
