"use client"

import { SortableContext, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Column, Task } from "@/types"
import { TaskCard } from "./task-card"
import { MoreHorizontal, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BoardColumnProps {
  column: Column
  tasks: Task[]
  onAddTask: (columnId: string) => void
  onTaskClick: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

export function BoardColumn({ column, tasks, onAddTask, onTaskClick, onDeleteTask }: BoardColumnProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
    disabled: true, // Disable column reordering for now to simplify
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex h-full w-[300px] min-w-[300px] flex-col rounded-lg bg-muted/50 border"
    >
      {/* Column Header */}
      <div 
        className="flex items-center justify-between p-4 font-semibold"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm uppercase tracking-wider">{column.name}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground border">
            {tasks.length}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
        <SortableContext items={tasks.map(t => t.id)}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Task Button */}
      <div className="p-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(column.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
    </div>
  )
}
