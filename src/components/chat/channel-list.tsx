"use client"

import { useState } from "react"
import { Plus, Hash, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { createChannel } from "@/app/actions/chat"
import { cn } from "@/lib/utils"
import { Channel } from "@/types"

interface ChannelListProps {
  squadId: string
  channels: Channel[]
  selectedChannel: Channel | null
  onSelectChannel: (channel: Channel) => void
  onChannelCreated: (channel: Channel) => void
}

export function ChannelList({ 
  squadId, 
  channels, 
  selectedChannel, 
  onSelectChannel,
  onChannelCreated 
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
      }
    } catch (error) {
      console.error("Failed to create channel", error)
    } finally {
      setIsLoading(false)
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
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              selectedChannel?.id === channel.id
                ? "bg-secondary text-secondary-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {channel.type === 'VOICE' ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <Hash className="h-4 w-4" />
            )}
            <span className="truncate">{channel.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
