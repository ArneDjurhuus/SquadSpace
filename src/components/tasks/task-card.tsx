"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Trash2 } from "lucide-react"
import { Task } from "@/types"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onDelete?: () => void
}

export function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColors = {
    LOW: "bg-slate-500",
    MEDIUM: "bg-blue-500",
    HIGH: "bg-orange-500",
    URGENT: "bg-red-500",
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-muted rounded-lg border-2 border-dashed h-[100px]"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group relative touch-none"
    >
      <Card className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
        <CardHeader className="p-3 pb-0 space-y-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex gap-2">
              <Badge 
                variant="secondary" 
                className={cn("text-[10px] px-1.5 py-0 text-white", priorityColors[task.priority as keyof typeof priorityColors] || "bg-slate-500")}
              >
                {task.priority}
              </Badge>
              {task.sprint && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {task.sprint.name}
                </Badge>
              )}
            </div>
            {onDelete && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm("Delete task?")) onDelete()
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive cursor-pointer z-10 relative"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2 space-y-3">
          <p className="text-sm font-medium leading-tight line-clamp-2">
            {task.title}
          </p>
          
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2 text-xs">
              {task.due_date && (
                <div className={cn(
                  "flex items-center gap-1",
                  new Date(task.due_date) < new Date() ? "text-red-500" : ""
                )}>
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
              {/* Comment count placeholder if we had it */}
              {/* <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>2</span>
              </div> */}
            </div>

            {task.assignee && (
              <Avatar className="h-6 w-6 border-2 border-background">
                <AvatarImage src={task.assignee.image || undefined} />
                <AvatarFallback className="text-[10px]">
                  {task.assignee.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
