"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { createPollSchema, votePollSchema } from '@/lib/validation'
import {
  successResponse,
  errorResponse,
  handleActionError,
  ErrorCode,
  type ActionResponse,
} from '@/lib/errors'
import { log } from '@/lib/logger'

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

export async function createPoll(input: CreatePollInput): Promise<ActionResponse<any>> {
  try {
    const validatedData = createPollSchema.parse({
      squadId: input.squadId,
      question: input.question,
      options: input.options,
      allowMultiple: input.pollType === 'multiple',
      allowAddOptions: input.allowAddOptions,
      expiresAt: input.endsAt,
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // Verify user is member of squad
    const { data: membership } = await supabase
      .from('squad_members')
      .select('id')
      .eq('squad_id', validatedData.squadId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return errorResponse(ErrorCode.NOT_SQUAD_MEMBER)
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        squad_id: validatedData.squadId,
        channel_id: input.channelId || null,
        created_by: user.id,
        question: validatedData.question,
        description: input.description || null,
        poll_type: validatedData.allowMultiple ? 'multiple' : 'single',
        is_anonymous: input.isAnonymous || false,
        allow_add_options: validatedData.allowAddOptions || false,
        ends_at: validatedData.expiresAt || null
      })
      .select()
      .single()

    if (pollError) {
      log.error("Error creating poll", pollError, { squadId: validatedData.squadId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, "Failed to create poll")
    }

    // Create options
    const optionsToInsert = validatedData.options.map((text, index) => ({
      poll_id: poll.id,
      text,
      added_by: user.id,
      order_index: index
    }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert)

    if (optionsError) {
      log.error("Error creating poll options", optionsError, { pollId: poll.id })
      // Rollback poll creation
      await supabase.from('polls').delete().eq('id', poll.id)
      return errorResponse(ErrorCode.DATABASE_ERROR, "Failed to create poll options")
    }

    log.info("Poll created successfully", { pollId: poll.id, userId: user.id })

    revalidatePath(`/squads/${validatedData.squadId}`)
    return successResponse(poll)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function getPolls(squadId: string, cursor?: string, limit: number = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  let query = supabase
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
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: polls, error } = await query

  if (error) {
    log.error("Error fetching polls", error, { squadId })
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
    log.error("Error fetching poll", error, { pollId })
    return null
  }

  return poll
}

export async function vote(pollId: string, optionId: string): Promise<ActionResponse<any>> {
  try {
    const validatedData = votePollSchema.parse({
      pollId,
      optionIds: [optionId], // Schema expects array, but function takes single
    })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // Get poll to check type and status
    const { data: poll } = await supabase
      .from('polls')
      .select('poll_type, is_closed, ends_at, squad_id')
      .eq('id', validatedData.pollId)
      .single()

    if (!poll) {
      return errorResponse(ErrorCode.RESOURCE_NOT_FOUND, "Poll not found")
    }

    if (poll.is_closed) {
      return errorResponse(ErrorCode.PERMISSION_DENIED, "Poll is closed")
    }

    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      return errorResponse(ErrorCode.PERMISSION_DENIED, "Poll has ended")
    }

    // For single-choice polls, remove existing vote first
    if (poll.poll_type === 'single') {
      await supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', validatedData.pollId)
        .eq('user_id', user.id)
    }

    // Check if already voted for this option (for multiple choice)
    const { data: existingVote } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', validatedData.pollId)
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
        log.error("Error removing vote", error, { pollId: validatedData.pollId, userId: user.id })
        return errorResponse(ErrorCode.DATABASE_ERROR, "Failed to remove vote")
      }

      revalidatePath(`/squads/${poll.squad_id}`)
      return successResponse({ action: 'removed' })
    }

    // Add vote
    const { error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: validatedData.pollId,
        option_id: optionId,
        user_id: user.id
      })

    if (error) {
      log.error("Error voting", error, { pollId: validatedData.pollId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, "Failed to vote")
    }

    revalidatePath(`/squads/${poll.squad_id}`)
    return successResponse({ action: 'added' })
  } catch (error) {
    return handleActionError(error)
  }
}

export async function addPollOption(pollId: string, text: string): Promise<ActionResponse<any>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    // Check if poll allows adding options
    const { data: poll } = await supabase
      .from('polls')
      .select('allow_add_options, created_by, squad_id, is_closed')
      .eq('id', pollId)
      .single()

    if (!poll) {
      return errorResponse(ErrorCode.RESOURCE_NOT_FOUND, "Poll not found")
    }

    if (poll.is_closed) {
      return errorResponse(ErrorCode.PERMISSION_DENIED, "Poll is closed")
    }

    if (!poll.allow_add_options && poll.created_by !== user.id) {
      return errorResponse(ErrorCode.PERMISSION_DENIED, "Cannot add options to this poll")
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
      log.error("Error adding option", error, { pollId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, "Failed to add option")
    }

    revalidatePath(`/squads/${poll.squad_id}`)
    return successResponse(option)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function closePoll(pollId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { data: poll } = await supabase
      .from('polls')
      .select('created_by, squad_id')
      .eq('id', pollId)
      .single()

    if (!poll) {
      return errorResponse(ErrorCode.RESOURCE_NOT_FOUND, "Poll not found")
    }

    if (poll.created_by !== user.id) {
      return errorResponse(ErrorCode.PERMISSION_DENIED, "Only poll creator can close the poll")
    }

    const { error } = await supabase
      .from('polls')
      .update({ is_closed: true })
      .eq('id', pollId)

    if (error) {
      log.error("Error closing poll", error, { pollId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, "Failed to close poll")
    }

    revalidatePath(`/squads/${poll.squad_id}`)
    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}

export async function deletePoll(pollId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return errorResponse(ErrorCode.AUTH_UNAUTHORIZED)
    }

    const { data: poll } = await supabase
      .from('polls')
      .select('created_by, squad_id')
      .eq('id', pollId)
      .single()

    if (!poll) {
      return errorResponse(ErrorCode.RESOURCE_NOT_FOUND, "Poll not found")
    }

    if (poll.created_by !== user.id) {
      return errorResponse(ErrorCode.PERMISSION_DENIED, "Only poll creator can delete the poll")
    }

    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)

    if (error) {
      log.error("Error deleting poll", error, { pollId, userId: user.id })
      return errorResponse(ErrorCode.DATABASE_ERROR, "Failed to delete poll")
    }

    revalidatePath(`/squads/${poll.squad_id}`)
    return successResponse(undefined)
  } catch (error) {
    return handleActionError(error)
  }
}
