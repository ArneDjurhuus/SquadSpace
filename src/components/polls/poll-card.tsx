"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { 
  BarChart3, 
  Clock, 
  Lock, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  Users,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { vote, closePoll, deletePoll, addPollOption } from "@/app/actions/polls"
import { toast } from "sonner"
import { Poll } from "@/types"
import { cn } from "@/lib/utils"

interface PollCardProps {
  poll: Poll
  currentUserId: string
}

export function PollCard({ poll, currentUserId }: PollCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddOption, setShowAddOption] = useState(false)
  const [newOptionText, setNewOptionText] = useState("")

  const isCreator = poll.created_by === currentUserId
  const isEnded = poll.ends_at ? new Date(poll.ends_at) < new Date() : false
  const isClosed = poll.is_closed || isEnded

  // Calculate vote statistics
  const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0

  const handleVote = (optionId: string) => {
    if (isClosed) return
    
    startTransition(async () => {
      const result = await vote(poll.id, optionId)
      if (result.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleClose = () => {
    startTransition(async () => {
      const result = await closePoll(poll.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Poll closed")
        router.refresh()
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePoll(poll.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Poll deleted")
        setShowDeleteDialog(false)
        router.refresh()
      }
    })
  }

  const handleAddOption = () => {
    if (!newOptionText.trim()) return
    
    startTransition(async () => {
      const result = await addPollOption(poll.id, newOptionText.trim())
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Option added")
        setNewOptionText("")
        setShowAddOption(false)
        router.refresh()
      }
    })
  }

  const getTimeRemaining = () => {
    if (!poll.ends_at) return null
    const endsAt = new Date(poll.ends_at)
    if (endsAt < new Date()) return "Ended"
    return `Ends ${formatDistanceToNow(endsAt, { addSuffix: true })}`
  }

  return (
    <>
      <Card className={cn(isClosed && "opacity-75")}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={poll.creator?.image || undefined} />
                <AvatarFallback>
                  {poll.creator?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{poll.creator?.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isClosed && (
                <Badge variant="secondary">
                  <Lock className="mr-1 h-3 w-3" />
                  Closed
                </Badge>
              )}
              {poll.is_anonymous && (
                <Badge variant="outline">Anonymous</Badge>
              )}
              {poll.poll_type === 'multiple' && (
                <Badge variant="outline">Multiple choice</Badge>
              )}
              {isCreator && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isClosed && (
                      <DropdownMenuItem onClick={handleClose}>
                        <Lock className="mr-2 h-4 w-4" />
                        Close Poll
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Poll
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <CardTitle className="text-lg mt-2">{poll.question}</CardTitle>
          {poll.description && (
            <CardDescription>{poll.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {poll.options?.sort((a, b) => a.order_index - b.order_index).map((option) => {
            const voteCount = option.votes?.length || 0
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
            const isSelected = option.votes?.some(v => v.user_id === currentUserId)
            const voters = poll.is_anonymous ? [] : option.votes?.map(v => v.user) || []

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={isPending || isClosed}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-all",
                  "hover:border-primary/50 hover:bg-accent/50",
                  isSelected && "border-primary bg-primary/5",
                  (isPending || isClosed) && "cursor-not-allowed opacity-60"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      poll.poll_type === 'multiple' && "rounded-sm",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="font-medium">{option.text}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                {!poll.is_anonymous && voters.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="flex -space-x-1">
                      {voters.slice(0, 5).map((voter, i) => (
                        <Avatar key={i} className="h-5 w-5 border-2 border-background">
                          <AvatarImage src={voter?.image || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {voter?.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {voters.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{voters.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}

          {/* Add Option */}
          {poll.allow_add_options && !isClosed && (
            <div>
              {showAddOption ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter option text..."
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddOption()
                      if (e.key === 'Escape') {
                        setShowAddOption(false)
                        setNewOptionText("")
                      }
                    }}
                    disabled={isPending}
                    autoFocus
                  />
                  <Button size="icon" onClick={handleAddOption} disabled={isPending || !newOptionText.trim()}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => {
                      setShowAddOption(false)
                      setNewOptionText("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowAddOption(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
              </div>
              {getTimeRemaining() && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{getTimeRemaining()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>{poll.poll_type === 'single' ? 'Single' : 'Multiple'} choice</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this poll? This action cannot be undone.
              All votes will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
