"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { ChannelList } from "@/components/chat/channel-list"
import { ChatWindow } from "@/components/chat/chat-window"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Channel, Profile } from "@/types"

interface ChatLayoutProps {
  squadId: string
  initialChannels: Channel[]
  currentUser: Profile
}

export function ChatLayout({ squadId, initialChannels, currentUser }: ChatLayoutProps) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(initialChannels[0] || null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleChannelCreated = (newChannel: Channel) => {
    setChannels([...channels, newChannel])
    setSelectedChannel(newChannel)
    setIsMobileOpen(false)
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="hidden md:block w-64 border-r bg-muted/10">
        <ChannelList 
          squadId={squadId}
          channels={channels}
          selectedChannel={selectedChannel}
          onSelectChannel={setSelectedChannel}
          onChannelCreated={handleChannelCreated}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel ? (
          <ChatWindow 
            channel={selectedChannel} 
            currentUser={currentUser}
            mobileMenu={
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <ChannelList 
                    squadId={squadId}
                    channels={channels}
                    selectedChannel={selectedChannel}
                    onSelectChannel={(channel) => {
                      setSelectedChannel(channel)
                      setIsMobileOpen(false)
                    }}
                    onChannelCreated={handleChannelCreated}
                  />
                </SheetContent>
              </Sheet>
            }
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
             <div className="md:hidden w-full flex justify-start mb-4">
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-80">
                        <ChannelList 
                            squadId={squadId}
                            channels={channels}
                            selectedChannel={selectedChannel}
                            onSelectChannel={(channel) => {
                                setSelectedChannel(channel)
                                setIsMobileOpen(false)
                            }}
                            onChannelCreated={handleChannelCreated}
                        />
                    </SheetContent>
                </Sheet>
             </div>
            <p>Select a channel to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
