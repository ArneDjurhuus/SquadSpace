"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createMilestone, deleteMilestone, updateMilestoneStatus } from "@/app/actions/roadmap"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

interface Milestone {
  id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'planned'
  target_date: string | null
  quarter: string | null
}

export function Roadmap({ squadId }: { squadId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMilestones = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('squad_id', squadId)
        .order('target_date', { ascending: true })
      
      if (error) {
        console.error('Error fetching milestones:', error)
        return
      }
      
      setMilestones(data as Milestone[])
      setIsLoading(false)
    }

    fetchMilestones()
  }, [squadId])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const result = await createMilestone(squadId, formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Milestone created')
      setIsDialogOpen(false)
      // Refresh list
      const supabase = createClient()
      const { data } = await supabase.from('milestones').select('*').eq('squad_id', squadId).order('target_date', { ascending: true })
      if (data) setMilestones(data as Milestone[])
    }
  }

  const handleDelete = async (id: string) => {
    const result = await deleteMilestone(squadId, id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Milestone deleted')
      setMilestones(prev => prev.filter(m => m.id !== id))
    }
  }

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case 'in-progress': return <Clock className="h-6 w-6 text-blue-500" />
      case 'planned': return <Circle className="h-6 w-6 text-gray-300" />
    }
  }

  if (isLoading) return <div>Loading roadmap...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Product Roadmap</h2>
          <p className="text-muted-foreground">Track milestones and future plans</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="Milestone title" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Details about this milestone" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Target Date</Label>
                    <Input id="date" name="date" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quarter">Quarter</Label>
                    <Input id="quarter" name="quarter" placeholder="e.g. Q1 2024" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="planned">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Milestone</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative border-l border-muted ml-3 space-y-8 pb-8">
        {milestones.length === 0 && (
          <div className="pl-8 text-muted-foreground">No milestones yet. Add one to get started!</div>
        )}
        {milestones.map((milestone) => (
          <div key={milestone.id} className="relative pl-8">
            <div className="absolute -left-3 top-0 bg-background p-1 rounded-full">
              {getStatusIcon(milestone.status)}
            </div>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {milestone.quarter && <Badge variant="outline">{milestone.quarter}</Badge>}
                      {milestone.target_date && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(milestone.target_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg">{milestone.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                      {milestone.status.replace('-', ' ')}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(milestone.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{milestone.description}</p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
