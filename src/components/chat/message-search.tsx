"use client"

import { useState, useCallback } from "react"
import { Search, X, Hash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { searchMessages } from "@/app/actions/chat"
import { Channel, Message, Profile } from "@/types"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface SearchResult extends Message {
  channel?: { id: string; name: string }
}

interface MessageSearchProps {
  squadId: string
  channels: Channel[]
  onResultClick?: (channelId: string, messageId: string) => void
}

// Debounce hook
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      const id = setTimeout(() => callback(...args), delay)
      setTimeoutId(id)
    },
    [callback, delay, timeoutId]
  )
}

export function MessageSearch({ squadId, channels, onResultClick }: MessageSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedChannel, setSelectedChannel] = useState<string>("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const performSearch = useCallback(
    async (searchQuery: string, channelId: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setHasSearched(false)
        return
      }

      setIsLoading(true)
      setHasSearched(true)

      const channelFilter = channelId === "all" ? undefined : channelId
      const result = await searchMessages(squadId, searchQuery, channelFilter)

      if (result.data) {
        setResults(result.data as SearchResult[])
      }
      setIsLoading(false)
    },
    [squadId]
  )

  const debouncedSearch = useDebounce(performSearch, 300)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    debouncedSearch(value, selectedChannel)
  }

  const handleChannelChange = (value: string) => {
    setSelectedChannel(value)
    if (query.trim()) {
      performSearch(query, value)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick && result.channel) {
      onResultClick(result.channel.id, result.id)
      setOpen(false)
    }
  }

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text

    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search messages</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-9 pr-9"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => {
                  setQuery("")
                  setResults([])
                  setHasSearched(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select value={selectedChannel} onValueChange={handleChannelChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {channel.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground px-1">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors",
                    onResultClick && "cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
                      {(result.sender as Profile)?.name?.[0] || "U"}
                    </div>
                    <span className="font-medium text-sm">
                      {(result.sender as Profile)?.name || "Unknown"}
                    </span>
                    {result.channel && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        in <Hash className="h-3 w-3" />
                        {result.channel.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(result.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 pl-8">
                    {highlightMatch(result.content, query)}
                  </p>
                </button>
              ))}
            </div>
          ) : hasSearched && query.trim() ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-10 w-10 mb-2 opacity-50" />
              <p>No messages found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-10 w-10 mb-2 opacity-50" />
              <p>Search for messages</p>
              <p className="text-sm">Find messages across all channels</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
