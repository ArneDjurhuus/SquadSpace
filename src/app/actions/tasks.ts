"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { Board, Column, Task, Sprint } from "@/types"

export async function getBoards(squadId: string) {
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

export async function createBoard(squadId: string, name: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('boards')
    .insert({ squad_id: squadId, name })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Create default columns
  const defaultColumns = [
    { board_id: data.id, name: 'To Do', order_index: 0 },
    { board_id: data.id, name: 'In Progress', order_index: 1 },
    { board_id: data.id, name: 'Done', order_index: 2 }
  ]

  await supabase.from('columns').insert(defaultColumns)

  revalidatePath(`/squads/${squadId}`)
  return { data }
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
      sprint:sprints(*)
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
    return { columns, tasks: [] }
  }

  return { columns: columns as Column[], tasks: tasks as Task[] }
}

export async function createTask(data: {
  column_id: string
  title: string
  description?: string
  priority?: string
  assignee_id?: string
  sprint_id?: string
  due_date?: string
}) {
  const supabase = await createClient()

  // Get max order index in the column
  const { data: maxOrder } = await supabase
    .from('tasks')
    .select('order_index')
    .eq('column_id', data.column_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const newOrderIndex = (maxOrder?.order_index ?? -1) + 1

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...data,
      order_index: newOrderIndex
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/squads/[squadId]', 'page')
  return { data: task }
}

export async function updateTaskPosition(
  taskId: string, 
  newColumnId: string, 
  newIndex: number
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ 
      column_id: newColumnId, 
      order_index: newIndex,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateTask(taskId: string, data: Partial<Task>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/squads/[squadId]', 'page')
  return { success: true }
}

export async function getSprints(squadId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return data as Sprint[]
}

export async function createSprint(squadId: string, name: string, startDate?: string, endDate?: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
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

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/squads/${squadId}`)
  return { data }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/squads/[squadId]', 'page')
  return { success: true }
}
