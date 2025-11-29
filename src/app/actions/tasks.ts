"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Board, Column, Task, Sprint } from "@/types"
import { z } from "zod"
import { 
  createBoardSchema, 
  createTaskSchema, 
  updateTaskSchema, 
  createSprintSchema,
  moveTaskSchema
} from "@/lib/validation"
import { 
  ActionResponse, 
  handleActionError, 
  createSuccessResponse 
} from "@/lib/errors"

export async function getBoards(squadId: string): Promise<Board[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching boards:', error)
    return []
  }

  return data as Board[]
}

export async function createBoard(data: z.infer<typeof createBoardSchema>): Promise<ActionResponse<Board>> {
  return handleActionError(async () => {
    const { squadId, name } = createBoardSchema.parse(data)
    const supabase = await createClient()
    
    const { data: board, error } = await supabase
      .from('boards')
      .insert({ squad_id: squadId, name })
      .select()
      .single()

    if (error) throw error

    // Create default columns
    const defaultColumns = [
      { board_id: board.id, name: 'To Do', order_index: 0 },
      { board_id: board.id, name: 'In Progress', order_index: 1 },
      { board_id: board.id, name: 'Done', order_index: 2 }
    ]

    const { error: columnsError } = await supabase.from('columns').insert(defaultColumns)
    if (columnsError) throw columnsError

    revalidatePath(`/squads/${squadId}`)
    return createSuccessResponse(board as Board)
  })
}

export async function getBoardData(boardId: string, sprintId?: string | null) {
  const supabase = await createClient()
  
  // Fetch columns
  const { data: columns, error: columnsError } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('order_index', { ascending: true })

  if (columnsError) {
    console.error('Error fetching columns:', columnsError)
    return { columns: [], tasks: [] }
  }

  // Fetch tasks
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!assignee_id(*),
      sprint:sprints!sprint_id(*)
    `)
    .in('column_id', columns.map(c => c.id))
    .order('order_index', { ascending: true })

  if (sprintId) {
    query = query.eq('sprint_id', sprintId)
  } else if (sprintId === null) {
    // Backlog view (no sprint)
    query = query.is('sprint_id', null)
  }

  const { data: tasks, error: tasksError } = await query

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError)
    return { columns: columns as Column[], tasks: [] }
  }

  return { columns: columns as Column[], tasks: tasks as Task[] }
}

export async function createTask(data: z.infer<typeof createTaskSchema>): Promise<ActionResponse<Task>> {
  return handleActionError(async () => {
    const validatedData = createTaskSchema.parse(data)
    const supabase = await createClient()

    // Get max order index in the column
    const { data: maxOrder } = await supabase
      .from('tasks')
      .select('order_index')
      .eq('column_id', validatedData.columnId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const newOrderIndex = (maxOrder?.order_index ?? -1) + 1

    const { squadId, columnId, ...taskData } = validatedData

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        column_id: columnId,
        order_index: newOrderIndex
      })
      .select(`
        *,
        assignee:profiles!assignee_id(*),
        sprint:sprints!sprint_id(*)
      `)
      .single()

    if (error) throw error

    revalidatePath(`/squads/${squadId}`)
    return createSuccessResponse(task as Task)
  })
}

export async function updateTaskPosition(data: z.infer<typeof moveTaskSchema>): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const { taskId, columnId, position } = moveTaskSchema.parse(data)
    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .update({ 
        column_id: columnId, 
        order_index: position,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (error) throw error

    return createSuccessResponse(undefined)
  })
}

export async function updateTask(data: z.infer<typeof updateTaskSchema>): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const { taskId, squadId, columnId, ...updateData } = updateTaskSchema.parse(data)
    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .update({
        ...updateData,
        ...(columnId ? { column_id: columnId } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    if (error) throw error

    if (squadId) {
      revalidatePath(`/squads/${squadId}`)
    }
    return createSuccessResponse(undefined)
  })
}

export async function getSprints(squadId: string): Promise<Sprint[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sprints:', error)
    return []
  }

  return data as Sprint[]
}

export async function createSprint(data: z.infer<typeof createSprintSchema>): Promise<ActionResponse<Sprint>> {
  return handleActionError(async () => {
    const { squadId, name, startDate, endDate } = createSprintSchema.parse(data)
    const supabase = await createClient()
    
    const { data: sprint, error } = await supabase
      .from('sprints')
      .insert({
        squad_id: squadId,
        name,
        start_date: startDate,
        end_date: endDate,
        status: 'PLANNED'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/squads/${squadId}`)
    return createSuccessResponse(sprint as Sprint)
  })
}

export async function deleteTask(taskId: string): Promise<ActionResponse<void>> {
  return handleActionError(async () => {
    const supabase = await createClient()

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error

    revalidatePath('/squads/[squadId]', 'page')
    return createSuccessResponse(undefined)
  })
}
