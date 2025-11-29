"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

export interface CreatePollInput {
  squadId: string
  channelId?: string
  question: string
  description?: string
  options: string[]
  pollType?: 'single' | 'multiple'
  isAnonymous?: boolean
  allowAddOptions?: boolean
  endsAt?: string
}

export async function createPoll(input: CreatePollInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Verify user is member of squad
  const { data: membership } = await supabase
    .from('squad_members')
    .select('id')
    .eq('squad_id', input.squadId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return { error: "Not a member of this squad" }
  }

  // Create poll
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      squad_id: input.squadId,
      channel_id: input.channelId || null,
      created_by: user.id,
      question: input.question,
      description: input.description || null,
      poll_type: input.pollType || 'single',
      is_anonymous: input.isAnonymous || false,
      allow_add_options: input.allowAddOptions || false,
      ends_at: input.endsAt || null
    })
    .select()
    .single()

  if (pollError) {
    console.error("Error creating poll:", pollError)
    return { error: "Failed to create poll" }
  }

  // Create options
  const optionsToInsert = input.options.map((text, index) => ({
    poll_id: poll.id,
    text,
    added_by: user.id,
    order_index: index
  }))

  const { error: optionsError } = await supabase
    .from('poll_options')
    .insert(optionsToInsert)

  if (optionsError) {
    console.error("Error creating poll options:", optionsError)
    // Rollback poll creation
    await supabase.from('polls').delete().eq('id', poll.id)
    return { error: "Failed to create poll options" }
  }

  revalidatePath(`/squads/${input.squadId}`)
  return { data: poll }
}

export async function getPolls(squadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      *,
      creator:profiles!created_by(*),
      options:poll_options(
        *,
        votes:poll_votes(*)
      )
    `)
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching polls:", error)
    return []
  }

  return polls
}

export async function getPoll(pollId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: poll, error } = await supabase
    .from('polls')
    .select(`
      *,
      creator:profiles!created_by(*),
      options:poll_options(
        *,
        votes:poll_votes(
          *,
          user:profiles!user_id(*)
        )
      )
    `)
    .eq('id', pollId)
    .single()

  if (error) {
    console.error("Error fetching poll:", error)
    return null
  }

  return poll
}

export async function vote(pollId: string, optionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Get poll to check type and status
  const { data: poll } = await supabase
    .from('polls')
    .select('poll_type, is_closed, ends_at, squad_id')
    .eq('id', pollId)
    .single()

  if (!poll) {
    return { error: "Poll not found" }
  }

  if (poll.is_closed) {
    return { error: "Poll is closed" }
  }

  if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
    return { error: "Poll has ended" }
  }

  // For single-choice polls, remove existing vote first
  if (poll.poll_type === 'single') {
    await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
  }

  // Check if already voted for this option (for multiple choice)
  const { data: existingVote } = await supabase
    .from('poll_votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('option_id', optionId)
    .eq('user_id', user.id)
    .single()

  if (existingVote) {
    // Remove vote (toggle behavior)
    const { error } = await supabase
      .from('poll_votes')
      .delete()
      .eq('id', existingVote.id)

    if (error) {
      console.error("Error removing vote:", error)
      return { error: "Failed to remove vote" }
    }

    revalidatePath(`/squads/${poll.squad_id}`)
    return { data: { action: 'removed' } }
  }

  // Add vote
  const { error } = await supabase
    .from('poll_votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id
    })

  if (error) {
    console.error("Error voting:", error)
    return { error: "Failed to vote" }
  }

  revalidatePath(`/squads/${poll.squad_id}`)
  return { data: { action: 'added' } }
}

export async function addPollOption(pollId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  // Check if poll allows adding options
  const { data: poll } = await supabase
    .from('polls')
    .select('allow_add_options, created_by, squad_id, is_closed')
    .eq('id', pollId)
    .single()

  if (!poll) {
    return { error: "Poll not found" }
  }

  if (poll.is_closed) {
    return { error: "Poll is closed" }
  }

  if (!poll.allow_add_options && poll.created_by !== user.id) {
    return { error: "Cannot add options to this poll" }
  }

  // Get max order_index
  const { data: maxOrder } = await supabase
    .from('poll_options')
    .select('order_index')
    .eq('poll_id', pollId)
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const { data: option, error } = await supabase
    .from('poll_options')
    .insert({
      poll_id: pollId,
      text,
      added_by: user.id,
      order_index: (maxOrder?.order_index || 0) + 1
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding option:", error)
    return { error: "Failed to add option" }
  }

  revalidatePath(`/squads/${poll.squad_id}`)
  return { data: option }
}

export async function closePoll(pollId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: poll } = await supabase
    .from('polls')
    .select('created_by, squad_id')
    .eq('id', pollId)
    .single()

  if (!poll) {
    return { error: "Poll not found" }
  }

  if (poll.created_by !== user.id) {
    return { error: "Only poll creator can close the poll" }
  }

  const { error } = await supabase
    .from('polls')
    .update({ is_closed: true })
    .eq('id', pollId)

  if (error) {
    console.error("Error closing poll:", error)
    return { error: "Failed to close poll" }
  }

  revalidatePath(`/squads/${poll.squad_id}`)
  return { data: { success: true } }
}

export async function deletePoll(pollId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const { data: poll } = await supabase
    .from('polls')
    .select('created_by, squad_id')
    .eq('id', pollId)
    .single()

  if (!poll) {
    return { error: "Poll not found" }
  }

  if (poll.created_by !== user.id) {
    return { error: "Only poll creator can delete the poll" }
  }

  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', pollId)

  if (error) {
    console.error("Error deleting poll:", error)
    return { error: "Failed to delete poll" }
  }

  revalidatePath(`/squads/${poll.squad_id}`)
  return { data: { success: true } }
}
