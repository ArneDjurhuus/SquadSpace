'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { createDocumentRecord } from "@/app/actions/documents"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

interface UploadDocumentDialogProps {
  squadId: string
}

export function UploadDocumentDialog({ squadId }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const supabase = createClient()

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `${squadId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('squad-documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Create Database Record
      const result = await createDocumentRecord({
        squadId,
        name: file.name,
        filePath,
        size: file.size,
        type: file.type
      })

      if (result.error) throw new Error(result.error)

      toast.success("Document uploaded successfully")
      setOpen(false)
      setFile(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a file to share with your squad.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="document">File</Label>
            <Input id="document" type="file" onChange={handleFileChange} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
