"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Clock, Plus } from "lucide-react"

interface LFGPost {
  id: string
  game: string
  mode: string
  description: string
  currentPlayers: number
  maxPlayers: number
  startTime: string
  host: {
    name: string
    avatar?: string
  }
}

const MOCK_LFG_POSTS: LFGPost[] = [
  {
    id: '1',
    game: 'Valorant',
    mode: 'Competitive',
    description: 'Need a Sage main for rank push. Gold/Plat lobby.',
    currentPlayers: 4,
    maxPlayers: 5,
    startTime: 'In 10 mins',
    host: { name: 'JettMain' }
  },
  {
    id: '2',
    game: 'Apex Legends',
    mode: 'Ranked',
    description: 'Grinding to Diamond. Mic required.',
    currentPlayers: 1,
    maxPlayers: 3,
    startTime: 'Now',
    host: { name: 'WraithMain' }
  },
  {
    id: '3',
    game: 'Minecraft',
    mode: 'Survival',
    description: 'Starting a new SMP server. Everyone welcome!',
    currentPlayers: 2,
    maxPlayers: 10,
    startTime: 'Tonight 8PM',
    host: { name: 'Steve' }
  }
]

export function LFGBoard({ squadId }: { squadId: string }) {
  const [posts] = useState<LFGPost[]>(MOCK_LFG_POSTS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Placeholder for future use
  console.log("Rendering LFG Board for squad:", squadId)

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit to the API
    setIsDialogOpen(false)
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
                <Input id="game" placeholder="e.g. Valorant, League of Legends" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mode">Mode</Label>
                <Input id="mode" placeholder="e.g. Ranked, Casual, Raid" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="players">Max Players</Label>
                  <Input id="players" type="number" min="2" max="100" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="time">Start Time</Label>
                  <Input id="time" placeholder="e.g. Now, 8:00 PM" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" placeholder="Details about what you're looking for..." />
              </div>
              <DialogFooter>
                <Button type="submit">Post Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="mb-2">{post.game}</Badge>
                <Badge variant={post.currentPlayers >= post.maxPlayers ? "secondary" : "default"}>
                  {post.currentPlayers}/{post.maxPlayers}
                </Badge>
              </div>
              <CardTitle className="text-lg">{post.mode}</CardTitle>
              <CardDescription className="line-clamp-2">{post.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span>{post.startTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{post.maxPlayers - post.currentPlayers} spots open</span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{post.host.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{post.host.name}</span>
                </div>
                <Button size="sm" variant="secondary">Join</Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
