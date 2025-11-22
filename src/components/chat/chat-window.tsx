"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Send, Image as ImageIcon, Loader2, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMessages, sendMessage, addReaction } from "@/app/actions/chat"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { Channel, Message, Profile, Reaction } from "@/types"

interface ChatWindowProps {
  channel: Channel
  currentUser: Profile
  mobileMenu?: React.ReactNode
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"]

export function ChatWindow({ channel, currentUser, mobileMenu }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getMessages(channel.id)
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
        console.log('New message received:', payload)
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles!sender_id(*), reactions(*)')
          .eq('id', payload.new.id)
          .single()
        
        if (error) {
          console.error('Error fetching new message details:', error)
          return
        }

        if (data) {
          setMessages((current) => {
            if (current.some(m => m.id === data.id)) return current
            return [...current, data as unknown as Message]
          })
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reactions'
      }, async (payload) => {
        const newReaction = payload.new as Reaction
        // Verify if this reaction belongs to a message in this channel
        // We can check if the message_id exists in our current messages list
        setMessages((current) => {
          const messageExists = current.some(m => m.id === newReaction.message_id)
          if (!messageExists) return current

          return current.map(m => {
            if (m.id === newReaction.message_id) {
              if (m.reactions?.some(r => r.id === newReaction.id)) return m
              return {
                ...m,
                reactions: [...(m.reactions || []), newReaction]
              }
            }
            return m
          })
        })
      })
      .subscribe((status) => {
        console.log(`Subscription status for channel ${channel.id}:`, status)
      })

    return () => {
      supabase.removeChannel(channelSubscription)
    }
  }, [channel.id, supabase])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleAddReaction = async (messageId: string, emoji: string) => {
    setActiveReactionMessageId(null)
    
    // Optimistic update
    setMessages(current => current.map(m => {
      if (m.id === messageId) {
        if (m.reactions?.some(r => r.emoji === emoji && r.user_id === currentUser.id)) return m
        return {
          ...m,
          reactions: [...(m.reactions || []), {
            id: `temp-${Date.now()}`,
            message_id: messageId,
            user_id: currentUser.id,
            emoji,
            created_at: new Date().toISOString()
          }]
        }
      }
      return m
    }))

    await addReaction(messageId, emoji)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${channel.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)

      // Optimistic update for image
      const tempId = `temp-${Date.now()}`
      const optimisticMessage: Message = {
        id: tempId,
        content: "Sent an image",
        image_url: publicUrl,
        channel_id: channel.id,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: currentUser,
        reactions: []
      }
      setMessages(current => [...current, optimisticMessage])

      const result = await sendMessage(channel.id, "Sent an image", publicUrl)
      
      if (result.error) {
        setMessages(current => current.filter(m => m.id !== tempId))
        console.error("Failed to send image message:", result.error)
      } else if (result.data) {
        setMessages(current => current.map(m => 
          m.id === tempId ? (result.data as unknown as Message) : m
        ))
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const content = newMessage
    setNewMessage("") 
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      content,
      channel_id: channel.id,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: currentUser,
      reactions: []
    }

    setMessages(current => [...current, optimisticMessage])

    try {
      const result = await sendMessage(channel.id, content)
      if (result.error) {
        // Remove optimistic message on error
        setMessages(current => current.filter(m => m.id !== tempId))
        console.error("Failed to send message:", result.error)
      } else if (result.data) {
        // Replace optimistic message with real one
        setMessages(current => current.map(m => 
          m.id === tempId ? (result.data as unknown as Message) : m
        ))
      }
    } catch (error) {
      setMessages(current => current.filter(m => m.id !== tempId))
      console.error("Failed to send message", error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-2">
        {mobileMenu && <div className="md:hidden">{mobileMenu}</div>}
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
                "flex gap-3 max-w-[80%] group relative",
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
                {message.image_url && (
                  <Image 
                    src={message.image_url} 
                    alt="Shared image" 
                    className="max-w-full rounded-md mb-2 max-h-60 object-cover"
                    width={500}
                    height={500}
                  />
                )}
                <p>{message.content}</p>
                
                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                      const count = message.reactions!.filter(r => r.emoji === emoji).length
                      const hasReacted = message.reactions!.some(r => r.emoji === emoji && r.user_id === currentUser.id)
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(message.id, emoji)}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 hover:bg-muted-foreground/10 transition-colors",
                            hasReacted ? "bg-primary/10 border-primary/30" : "bg-background border-border"
                          )}
                        >
                          <span>{emoji}</span>
                          <span className="text-[10px]">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                <p className="text-[10px] mt-1 opacity-50 text-right">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Reaction Button */}
              <div className="relative self-center opacity-0 group-hover:opacity-100 transition-opacity px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => setActiveReactionMessageId(activeReactionMessageId === message.id ? null : message.id)}
                >
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </Button>
                
                {activeReactionMessageId === message.id && (
                  <div className="absolute bottom-8 left-0 bg-popover border rounded-lg shadow-lg p-2 flex gap-1 z-10">
                    {COMMON_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(message.id, emoji)}
                        className="hover:bg-muted p-1 rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>
          <Input
            placeholder={`Message #${channel.name}`}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || isUploading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
