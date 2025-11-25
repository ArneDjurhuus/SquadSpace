"use client"

import { useState } from "react"
import { Plus, Hash, Volume2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { createChannel, deleteChannel } from "@/app/actions/chat"
import { cn } from "@/lib/utils"
import { Channel } from "@/types"
import { toast } from "sonner"

interface ChannelListProps {
  squadId: string
  channels: Channel[]
  selectedChannel: Channel | null
  onSelectChannel: (channel: Channel) => void
  onChannelCreated: (channel: Channel) => void
  onChannelDeleted?: (channelId: string) => void
}

export function ChannelList({ 
  squadId, 
  channels, 
  selectedChannel, 
  onSelectChannel,
  onChannelCreated,
  onChannelDeleted
}: ChannelListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return

    setIsLoading(true)
    try {
      const result = await createChannel(squadId, newChannelName)
      if (result.data) {
        onChannelCreated(result.data)
        setNewChannelName("")
        setIsDialogOpen(false)
        toast.success("Channel created")
      }
    } catch (error) {
      console.error("Failed to create channel", error)
      toast.error("Failed to create channel")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChannel = async (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this channel?")) return

    try {
      const result = await deleteChannel(channelId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Channel deleted")
        if (onChannelDeleted) onChannelDeleted(channelId)
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete channel")
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Channels</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Channel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <Input
                placeholder="Channel name"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
              />
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Channel"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className={cn(
              "group w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
              selectedChannel?.id === channel.id
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onSelectChannel(channel)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {channel.type === 'VOICE' ? (
                <Volume2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Hash className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">{channel.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDeleteChannel(e, channel.id)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
