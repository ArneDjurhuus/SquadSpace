"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Milestone {
  id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'planned'
  date: string
  quarter: string
}

const MOCK_MILESTONES: Milestone[] = [
  {
    id: '1',
    title: 'MVP Launch',
    description: 'Release the initial version to beta testers.',
    status: 'completed',
    date: 'Oct 15, 2023',
    quarter: 'Q4 2023'
  },
  {
    id: '2',
    title: 'User Feedback Integration',
    description: 'Analyze beta feedback and implement critical fixes.',
    status: 'in-progress',
    date: 'Nov 30, 2023',
    quarter: 'Q4 2023'
  },
  {
    id: '3',
    title: 'Series A Funding',
    description: 'Begin outreach to potential investors.',
    status: 'planned',
    date: 'Jan 2024',
    quarter: 'Q1 2024'
  },
  {
    id: '4',
    title: 'Mobile App Release',
    description: 'Launch iOS and Android applications.',
    status: 'planned',
    date: 'Mar 2024',
    quarter: 'Q1 2024'
  }
]

export function Roadmap({ squadId }: { squadId: string }) {
  const [milestones] = useState<Milestone[]>(MOCK_MILESTONES)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Placeholder for future use
  console.log("Rendering Roadmap for squad:", squadId)

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-6 w-6 text-green-500" />
      case 'in-progress': return <Clock className="h-6 w-6 text-blue-500" />
      case 'planned': return <Circle className="h-6 w-6 text-gray-300" />
    }
  }

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
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Milestone title" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" placeholder="Details about this milestone" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">Target Date</Label>
                  <Input id="date" placeholder="e.g. Q1 2024" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue="planned">
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
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)}>Add Milestone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative border-l border-muted ml-3 space-y-8 pb-8">
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
                      <Badge variant="outline">{milestone.quarter}</Badge>
                      <span className="text-sm text-muted-foreground">{milestone.date}</span>
                    </div>
                    <CardTitle className="text-lg">{milestone.title}</CardTitle>
                  </div>
                  <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                    {milestone.status.replace('-', ' ')}
                  </Badge>
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
