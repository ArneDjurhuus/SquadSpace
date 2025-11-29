"use client"

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Profile } from "@/types"

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  members: Profile[]
  className?: string
  disabled?: boolean
}

export function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  members,
  className,
  disabled
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter members based on query
  const filteredMembers = members.filter(member =>
    member.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  // Handle input changes to detect @ mentions
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart || 0
    
    onChange(newValue)

    // Find the @ symbol before cursor
    const textBeforeCursor = newValue.slice(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    if (lastAtIndex !== -1) {
      // Check if @ is at start or preceded by space
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " "
      if (charBeforeAt === " " || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1)
        // Only show suggestions if no space after @
        if (!query.includes(" ")) {
          setMentionQuery(query)
          setMentionStart(lastAtIndex)
          setShowSuggestions(true)
          setSelectedIndex(0) // Reset selection when query changes
          return
        }
      }
    }
    
    setShowSuggestions(false)
    setMentionQuery("")
    setMentionStart(null)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredMembers.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredMembers.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredMembers.length - 1
          )
          break
        case "Enter":
          if (filteredMembers[selectedIndex]) {
            e.preventDefault()
            insertMention(filteredMembers[selectedIndex])
          }
          break
        case "Escape":
          setShowSuggestions(false)
          break
        case "Tab":
          if (filteredMembers[selectedIndex]) {
            e.preventDefault()
            insertMention(filteredMembers[selectedIndex])
          }
          break
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  // Insert selected mention into input
  const insertMention = (member: Profile) => {
    if (mentionStart === null || !member.name) return

    const beforeMention = value.slice(0, mentionStart)
    const afterMention = value.slice(mentionStart + mentionQuery.length + 1)
    const mentionText = `@${member.name} `
    
    onChange(beforeMention + mentionText + afterMention)
    setShowSuggestions(false)
    setMentionQuery("")
    setMentionStart(null)
    
    // Focus back to input
    inputRef.current?.focus()
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        disabled={disabled}
      />
      
      {showSuggestions && filteredMembers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-lg shadow-lg overflow-hidden z-50"
        >
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredMembers.map((member, index) => (
              <button
                key={member.id}
                type="button"
                onClick={() => insertMention(member)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left",
                  index === selectedIndex && "bg-muted"
                )}
              >
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
                  {member.name?.[0] || "U"}
                </div>
                <span className="truncate">{member.name || "Unknown"}</span>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/50">
            <kbd className="px-1 py-0.5 rounded bg-background border text-[10px]">↑↓</kbd> to navigate, 
            <kbd className="px-1 py-0.5 rounded bg-background border text-[10px] ml-1">Tab</kbd> or 
            <kbd className="px-1 py-0.5 rounded bg-background border text-[10px] ml-1">Enter</kbd> to select
          </div>
        </div>
      )}
    </div>
  )
}

// Utility function to render message content with highlighted mentions
export function renderMessageWithMentions(
  content: string,
  members: Profile[],
  currentUserId: string
): React.ReactNode {
  // Match @username patterns
  const mentionRegex = /@(\w+(?:\s\w+)*)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }

    const mentionedName = match[1]
    const mentionedMember = members.find(
      m => m.name?.toLowerCase() === mentionedName.toLowerCase()
    )

    if (mentionedMember) {
      const isCurrentUser = mentionedMember.id === currentUserId
      parts.push(
        <span
          key={match.index}
          className={cn(
            "px-1 rounded font-medium",
            isCurrentUser
              ? "bg-primary/20 text-primary"
              : "bg-muted-foreground/20 text-foreground"
          )}
        >
          @{mentionedName}
        </span>
      )
    } else {
      // Keep as plain text if no matching member found
      parts.push(`@${mentionedName}`)
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex))
  }

  return parts.length > 0 ? parts : content
}
