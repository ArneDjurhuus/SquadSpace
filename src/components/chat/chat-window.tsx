"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMessages, sendMessage } from "@/app/actions/chat"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { Channel, Message, Profile } from "@/types"

interface ChatWindowProps {
  channel: Channel
  currentUser: Profile
}

export function ChatWindow({ channel, currentUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getMessages(channel.id)
      // Cast the data to Message[] because the Supabase query return type might not match exactly with the join
      setMessages(data as unknown as Message[])
    }
    fetchMessages()

    const channelSubscription = supabase
      .channel(`chat:${channel.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`
      }, async (payload) => {
        const { data } = await supabase
          .from('messages')
          .select('*, sender:profiles(*)')
          .eq('id', payload.new.id)
          .single()
        
        if (data) {
          setMessages((current) => {
            // Prevent duplicates
            if (current.some(m => m.id === data.id)) return current
            return [...current, data as unknown as Message]
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channelSubscription)
    }
  }, [channel.id, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const content = newMessage
    setNewMessage("") 
    
    try {
      await sendMessage(channel.id, content)
    } catch (error) {
      console.error("Failed to send message", error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        <span className="font-bold">#{channel.name}</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => {
          const isOwn = message.sender_id === currentUser.id
          return (
            <div 
              key={message.id} 
              className={cn(
                "flex gap-3 max-w-[80%]",
                isOwn ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
                {message.sender?.name?.[0] || "U"}
              </div>
              <div className={cn(
                "rounded-lg p-3 text-sm",
                isOwn 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1 opacity-70">
                    {message.sender?.name || "Unknown"}
                  </p>
                )}
                <p>{message.content}</p>
                <p className="text-[10px] mt-1 opacity-50 text-right">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder={`Message #${channel.name}`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
