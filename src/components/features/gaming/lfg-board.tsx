"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Clock, Plus, LogOut } from "lucide-react"
import { getLFGPosts, createLFGPost, joinLFGPost, leaveLFGPost, deleteLFGPost } from "@/app/actions/gaming"
import { toast } from "sonner"

interface LFGPost {
  id: string
  game: string
  mode: string
  description: string
  currentPlayers: number
  max_players: number
  start_time: string
  creator_id: string
  host: {
    name: string
    image?: string
  }
  participants: { user_id: string }[]
}

export function LFGBoard({ squadId, currentUserId }: { squadId: string, currentUserId: string }) {
  const [posts, setPosts] = useState<LFGPost[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    const data = await getLFGPosts(squadId)
    setPosts(data as any) // Type assertion needed due to join structure
    setIsLoading(false)
  }, [squadId])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const result = await createLFGPost(squadId, formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('LFG Post created')
      setIsDialogOpen(false)
      fetchPosts()
    }
  }

  const handleJoin = async (postId: string) => {
    const result = await joinLFGPost(squadId, postId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Joined squad')
      fetchPosts()
    }
  }

  const handleLeave = async (postId: string) => {
    const result = await leaveLFGPost(squadId, postId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Left squad')
      fetchPosts()
    }
  }

  const handleDelete = async (postId: string) => {
    const result = await deleteLFGPost(squadId, postId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Post deleted')
      fetchPosts()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Looking For Group</h2>
          <p className="text-muted-foreground">Find squadmates for your next game session</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create LFG Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePost} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="game">Game</Label>
                <Input id="game" name="game" placeholder="e.g. Valorant, League of Legends" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mode">Mode</Label>
                <Input id="mode" name="mode" placeholder="e.g. Ranked, Casual, Raid" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxPlayers">Max Players</Label>
                  <Input id="maxPlayers" name="maxPlayers" type="number" min="2" max="100" defaultValue="5" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" name="startTime" placeholder="e.g. In 10 mins, Tonight 8PM" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Details about the session..." />
              </div>
              <DialogFooter>
                <Button type="submit">Create Post</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const isParticipant = post.participants.some(p => p.user_id === currentUserId)
          const isCreator = post.creator_id === currentUserId
          const isFull = post.currentPlayers >= post.max_players

          return (
            <Card key={post.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{post.game}</CardTitle>
                    <CardDescription>{post.mode}</CardDescription>
                  </div>
                  <Badge variant={isFull ? "secondary" : "default"}>
                    {post.currentPlayers}/{post.max_players}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground mb-4">{post.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.start_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.host.image} />
                    <AvatarFallback>{post.host.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">Hosted by {post.host.name}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                {isCreator ? (
                  <Button variant="destructive" className="w-full" onClick={() => handleDelete(post.id)}>
                    Delete Post
                  </Button>
                ) : isParticipant ? (
                  <Button variant="outline" className="w-full" onClick={() => handleLeave(post.id)}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Squad
                  </Button>
                ) : (
                  <Button className="w-full" disabled={isFull} onClick={() => handleJoin(post.id)}>
                    {isFull ? 'Full' : 'Join Squad'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
        {posts.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No active LFG posts. Create one to start playing!
          </div>
        )}
      </div>
    </div>
  )
}
