"use client"

import { useState } from "react"
import { ChannelList } from "@/components/chat/channel-list"
import { ChatWindow } from "@/components/chat/chat-window"
import { Channel, Profile } from "@/types"

interface ChatLayoutProps {
  squadId: string
  initialChannels: Channel[]
  currentUser: Profile
}

export function ChatLayout({ squadId, initialChannels, currentUser }: ChatLayoutProps) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(initialChannels[0] || null)

  const handleChannelCreated = (newChannel: Channel) => {
    setChannels([...channels, newChannel])
    setSelectedChannel(newChannel)
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-background">
      <div className="w-64 border-r bg-muted/10">
        <ChannelList 
          squadId={squadId}
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
          onChannelCreated={handleChannelCreated}
        />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <ChatWindow 
            channel={selectedChannel} 
            currentUser={currentUser}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No channels yet. Create one to start chatting!
          </div>
        )}
      </div>
    </div>
  )
}
