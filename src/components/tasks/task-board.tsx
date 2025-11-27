"use client"

import { useState, useEffect } from "react"
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { BoardColumn } from "./board-column"
import { TaskCard } from "./task-card"
import { CreateTaskDialog } from "./create-task-dialog"
import { Board, Column, Task, Profile, Sprint } from "@/types"
import { getBoardData, updateTaskPosition, createBoard, getBoards, getSprints, deleteTask } from "@/app/actions/tasks"
import { toast } from "sonner"

interface TaskBoardProps {
  squadId: string
  members: { user: Profile }[]
}

export function TaskBoard({ squadId, members }: TaskBoardProps) {
  const [, setBoards] = useState<Board[]>([])
  const [activeBoard, setActiveBoard] = useState<Board | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const init = async () => {
      const [fetchedBoards, fetchedSprints] = await Promise.all([
        getBoards(squadId),
        getSprints(squadId)
      ])
      
      setBoards(fetchedBoards)
      setSprints(fetchedSprints)

      if (fetchedBoards.length > 0) {
        setActiveBoard(fetchedBoards[0])
        const { columns, tasks } = await getBoardData(fetchedBoards[0].id)
        setColumns(columns)
        setTasks(tasks)
      } else {
        // Create default board if none exists
        const result = await createBoard(squadId, "General")
        if (result.error) {
          toast.error("Failed to create board: " + result.error)
          console.error("Create board error:", result.error)
        } else if (result.data) {
          const newBoard = result.data as Board
          setBoards([newBoard])
          setActiveBoard(newBoard)
          const { columns, tasks } = await getBoardData(newBoard.id)
          setColumns(columns)
          setTasks(tasks)
        }
      }
    }
    init()
  }, [squadId])

  function handleTaskCreated(newTask: Task) {
    setTasks((current) => [...current, newTask])
  }

  async function handleDeleteTask(taskId: string) {
    const previousTasks = [...tasks]
    setTasks(tasks.filter(t => t.id !== taskId))

    const result = await deleteTask(taskId)
    if (result.error) {
      toast.error("Failed to delete task")
      setTasks(previousTasks)
    } else {
      toast.success("Task deleted")
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const id = active.id
    const task = tasks.find((t) => t.id === id)
    if (task) setActiveTask(task)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find the containers
    const activeTask = tasks.find(t => t.id === activeId)
    const overTask = tasks.find(t => t.id === overId)
    
    if (!activeTask) return

    // Dropping over a column
    const overColumn = columns.find(c => c.id === overId)
    
    if (overColumn) {
      if (activeTask.column_id !== overColumn.id) {
        setTasks((tasks) => {
          const activeIndex = tasks.findIndex((t) => t.id === activeId)
          const newTasks = [...tasks]
          newTasks[activeIndex] = { ...newTasks[activeIndex], column_id: overColumn.id }
          return newTasks
        })
      }
    } else if (overTask) {
      if (activeTask.column_id !== overTask.column_id) {
        setTasks((tasks) => {
          const activeIndex = tasks.findIndex((t) => t.id === activeId)
          const newTasks = [...tasks]
          newTasks[activeIndex] = { ...newTasks[activeIndex], column_id: overTask.column_id }
          return newTasks
        })
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const activeId = active.id
    const overId = over?.id

    if (!overId) {
      setActiveTask(null)
      return
    }

    const activeTask = tasks.find(t => t.id === activeId)
    const overTask = tasks.find(t => t.id === overId)
    const overColumn = columns.find(c => c.id === overId)

    if (activeTask) {
      let newColumnId = activeTask.column_id
      let newIndex = activeTask.order_index

      if (overColumn) {
        // Dropped directly on a column
        newColumnId = overColumn.id
        // Add to end of list
        const columnTasks = tasks.filter(t => t.column_id === overColumn.id)
        newIndex = columnTasks.length
      } else if (overTask) {
        // Dropped on another task
        newColumnId = overTask.column_id
        newIndex = overTask.order_index
      }

      // Optimistic update
      setTasks((tasks) => {
        const oldIndex = tasks.findIndex((t) => t.id === activeId)
        const newTasks = [...tasks]
        newTasks[oldIndex] = { 
          ...newTasks[oldIndex], 
          column_id: newColumnId,
          order_index: newIndex 
        }
        return newTasks
      })

      // Server update
      updateTaskPosition(activeId as string, newColumnId, newIndex)
        .then((result) => {
          if (result.error) {
            toast.error("Failed to move task")
            // Revert logic could go here
          }
        })
    }

    setActiveTask(null)
  }

  const handleAddTask = (columnId: string) => {
    setCreateTaskColumnId(columnId)
    setIsCreateTaskOpen(true)
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{activeBoard?.name || "Board"}</h2>
        <div className="flex gap-2">
          {/* Sprint Selector could go here */}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              tasks={tasks.filter((t) => t.column_id === column.id)}
              onAddTask={handleAddTask}
              onTaskClick={(task) => {
                // Open detail dialog
                console.log("Open task", task)
              }}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        columnId={createTaskColumnId}
        members={members}
        sprints={sprints}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}
