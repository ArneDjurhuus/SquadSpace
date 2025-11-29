"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateStatus, clearStatus } from "@/app/actions/user"
import { toast } from "sonner"
import { Smile, X } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_EMOJIS = [
  { emoji: "🟢", label: "Available" },
  { emoji: "🔴", label: "Busy" },
  { emoji: "🟡", label: "Away" },
  { emoji: "💼", label: "In a meeting" },
  { emoji: "🏠", label: "Working from home" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "📚", label: "Studying" },
  { emoji: "🎧", label: "Listening to music" },
  { emoji: "☕", label: "On a break" },
  { emoji: "🌙", label: "Do not disturb" },
  { emoji: "✈️", label: "Traveling" },
  { emoji: "🏃", label: "Exercising" },
]

const EXPIRY_OPTIONS = [
  { value: "never", label: "Don't clear" },
  { value: "30min", label: "30 minutes" },
  { value: "1hour", label: "1 hour" },
  { value: "4hours", label: "4 hours" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
]

interface StatusEditorProps {
  currentEmoji?: string | null
  currentText?: string | null
  trigger?: React.ReactNode
}

export function StatusEditor({ currentEmoji, currentText, trigger }: StatusEditorProps) {
  const [open, setOpen] = useState(false)
  const [emoji, setEmoji] = useState(currentEmoji || "")
  const [text, setText] = useState(currentText || "")
  const [expiry, setExpiry] = useState("never")
  const [isLoading, setIsLoading] = useState(false)

  const calculateExpiryTime = (option: string): string | null => {
    const now = new Date()
    switch (option) {
      case "30min":
        return new Date(now.getTime() + 30 * 60 * 1000).toISOString()
      case "1hour":
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      case "4hours":
        return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString()
      case "today":
        const endOfDay = new Date(now)
        endOfDay.setHours(23, 59, 59, 999)
        return endOfDay.toISOString()
      case "tomorrow":
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(23, 59, 59, 999)
        return tomorrow.toISOString()
      default:
        return null
    }
  }

  const handleSave = async () => {
    if (!emoji && !text) {
      toast.error("Please add an emoji or status message")
      return
    }

    setIsLoading(true)
    const expiryTime = calculateExpiryTime(expiry)
    const result = await updateStatus(emoji || null, text || null, expiryTime)
    
    if (!result.success) {
      toast.error(result.error.message)
    } else {
      toast.success("Status updated!")
      setOpen(false)
    }
    setIsLoading(false)
  }

  const handleClear = async () => {
    setIsLoading(true)
    const result = await clearStatus()
    
    if (!result.success) {
      toast.error(result.error.message)
    } else {
      toast.success("Status cleared")
      setEmoji("")
      setText("")
      setOpen(false)
    }
    setIsLoading(false)
  }

  const handleEmojiSelect = (selectedEmoji: string, label: string) => {
    setEmoji(selectedEmoji)
    if (!text) {
      setText(label)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Smile className="mr-2 h-4 w-4" />
            Set status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set your status</DialogTitle>
          <DialogDescription>
            Let others know what you&apos;re up to
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Status Preview */}
          {(emoji || text) && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              {emoji && <span className="text-xl">{emoji}</span>}
              {text && <span className="text-sm">{text}</span>}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-auto"
                onClick={() => { setEmoji(""); setText(""); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Emoji Grid */}
          <div>
            <Label className="text-sm font-medium">Quick select</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {STATUS_EMOJIS.map(({ emoji: e, label }) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => handleEmojiSelect(e, label)}
                  className={cn(
                    "h-10 w-10 rounded-lg text-xl hover:bg-muted transition-colors",
                    emoji === e && "bg-primary/20 ring-2 ring-primary"
                  )}
                  title={label}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Status Text */}
          <div className="space-y-2">
            <Label htmlFor="status-text">What&apos;s your status?</Label>
            <Input
              id="status-text"
              placeholder="e.g., In a meeting until 3pm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label>Clear status after</Label>
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          {(currentEmoji || currentText) && (
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Clear status
            </Button>
          )}
          <Button 
            onClick={handleSave}
            disabled={isLoading || (!emoji && !text)}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
