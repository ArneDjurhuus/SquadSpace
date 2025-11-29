'use client'

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { FileText, Download, Trash2, File as FileIcon, Image as ImageIcon, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteDocument } from "@/app/actions/documents"
import { toast } from "sonner"
import { UploadDocumentDialog } from "./upload-document-dialog"

interface Document {
  id: string
  name: string
  file_path: string
  size: number
  type: string
  created_at: string
  uploader_id: string
  uploader: {
    name: string | null
    email: string | null
    avatar_url: string | null
  }
}

interface DocumentListProps {
  squadId: string
  documents: Document[]
  currentUserId: string
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-500" />
  if (type.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />
  if (type.includes('code') || type.includes('javascript') || type.includes('html')) return <FileCode className="h-8 w-8 text-yellow-500" />
  return <FileIcon className="h-8 w-8 text-gray-500" />
}

export function DocumentList({ squadId, documents, currentUserId }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (doc: Document) => {
    setDeletingId(doc.id)
    try {
      const result = await deleteDocument(doc.id, doc.file_path, squadId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Document deleted")
      }
    } catch (error) {
      toast.error("Failed to delete document")
    } finally {
      setDeletingId(null)
    }
  }

  const getDownloadUrl = (filePath: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/squad-documents/${filePath}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
        <UploadDocumentDialog squadId={squadId} />
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileIcon className="h-12 w-12 mb-4 opacity-20" />
            <p>No documents uploaded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.type)}
                    <div className="space-y-1">
                      <p className="font-medium truncate max-w-[150px]" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.size)} • {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {doc.uploader.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={getDownloadUrl(doc.file_path)} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  
                  {currentUserId === doc.uploader_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the file.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(doc)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deletingId === doc.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
