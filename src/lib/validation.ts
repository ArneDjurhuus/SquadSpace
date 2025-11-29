import { z } from 'zod';

/**
 * Validation schemas for SquadSpace
 * Used across server actions to ensure type safety and data integrity
 */

// ============================================================================
// Common Schemas
// ============================================================================

export const emailSchema = z.string().email('Invalid email address').min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const uuidSchema = z.string().uuid('Invalid ID format');

// ============================================================================
// Auth Schemas
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
  status: z.string().max(100, 'Status must be at most 100 characters').optional().nullable(),
  statusEmoji: z.string().max(10, 'Status emoji is too long').optional().nullable(),
  statusExpiresAt: z.string().datetime().optional().nullable(),
});

// ============================================================================
// Squad Schemas
// ============================================================================

export const createSquadSchema = z.object({
  name: z.string().min(3, 'Squad name must be at least 3 characters').max(50, 'Squad name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  type: z.enum(['GAMING', 'STUDY', 'STARTUP', 'GENERAL']),
  isPrivate: z.boolean().default(false),
  maxMembers: z.number().int().min(2, 'Squad must allow at least 2 members').max(1000).optional(),
});

export const joinSquadSchema = z.object({
  squadId: uuidSchema,
  inviteCode: z.string().min(1, 'Invite code is required').optional(),
});

export const updateSquadSettingsSchema = z.object({
  squadId: uuidSchema,
  name: z.string().min(3).max(50).optional(),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
  maxMembers: z.number().int().min(2).max(1000).optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

// ============================================================================
// Event Schemas
// ============================================================================

export const createEventSchema = z.object({
  squadId: uuidSchema,
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time').optional(),
  location: z.string().max(200, 'Location is too long').optional(),
  isOnline: z.boolean().default(false),
  meetingLink: z.string().url('Invalid meeting link').optional().nullable(),
  maxParticipants: z.number().int().min(2).max(1000).optional().nullable(),
});

export const rsvpEventSchema = z.object({
  eventId: uuidSchema,
  status: z.enum(['going', 'maybe', 'not_going']),
});

export const updateEventSchema = createEventSchema.partial().extend({
  eventId: uuidSchema,
});

// ============================================================================
// Poll Schemas
// ============================================================================

export const createPollSchema = z.object({
  squadId: uuidSchema,
  question: z.string().min(5, 'Question must be at least 5 characters').max(200, 'Question is too long'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty').max(100, 'Option is too long'))
    .min(2, 'Poll must have at least 2 options')
    .max(10, 'Poll can have at most 10 options'),
  allowMultiple: z.boolean().default(false),
  allowAddOptions: z.boolean().default(false),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const votePollSchema = z.object({
  pollId: uuidSchema,
  optionIds: z.array(uuidSchema).min(1, 'Must select at least one option'),
});

// ============================================================================
// Task Schemas
// ============================================================================

export const createTaskSchema = z.object({
  boardId: uuidSchema,
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigneeId: uuidSchema.optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  taskId: uuidSchema,
});

export const moveTaskSchema = z.object({
  taskId: uuidSchema,
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  position: z.number().int().min(0).optional(),
});

// ============================================================================
// Gaming / LFG Schemas
// ============================================================================

export const createLFGSchema = z.object({
  squadId: uuidSchema,
  game: z.string().min(2, 'Game name must be at least 2 characters').max(100, 'Game name is too long'),
  mode: z.string().min(2, 'Mode must be at least 2 characters').max(100, 'Mode is too long'),
  maxPlayers: z.number().int().min(2, 'Must allow at least 2 players').max(100),
  description: z.string().max(500, 'Description is too long').optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export const joinLFGSchema = z.object({
  postId: uuidSchema,
});

export const createTournamentSchema = z.object({
  squadId: uuidSchema,
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name is too long'),
  game: z.string().min(2, 'Game name must be at least 2 characters').max(100, 'Game name is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  format: z.enum(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS']),
  maxTeams: z.number().int().min(2).max(128),
  teamSize: z.number().int().min(1).max(10),
  startDate: z.string().datetime(),
  registrationDeadline: z.string().datetime(),
  rules: z.string().max(5000, 'Rules are too long').optional(),
  prizePool: z.string().max(200, 'Prize pool description is too long').optional(),
});

export const registerTournamentTeamSchema = z.object({
  tournamentId: uuidSchema,
  teamName: z.string().min(2, 'Team name must be at least 2 characters').max(50, 'Team name is too long'),
  playerIds: z.array(uuidSchema).min(1, 'Must have at least one player'),
});

// ============================================================================
// Study Schemas
// ============================================================================

export const createFlashcardSetSchema = z.object({
  squadId: uuidSchema,
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  isPublic: z.boolean().default(false),
});

export const createFlashcardSchema = z.object({
  setId: uuidSchema,
  front: z.string().min(1, 'Front content is required').max(1000, 'Front content is too long'),
  back: z.string().min(1, 'Back content is required').max(1000, 'Back content is too long'),
  hint: z.string().max(200, 'Hint is too long').optional(),
});

// ============================================================================
// Chat Schemas
// ============================================================================

export const sendMessageSchema = z.object({
  channelId: uuidSchema,
  content: z.string().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
  mentionedUserIds: z.array(uuidSchema).max(50).optional(),
  parentMessageId: uuidSchema.optional().nullable(),
});

export const searchMessagesSchema = z.object({
  squadId: uuidSchema,
  query: z.string().min(1, 'Search query is required').max(200),
  channelId: uuidSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

// ============================================================================
// Document Schemas
// ============================================================================

export const createDocumentSchema = z.object({
  squadId: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string().max(100000, 'Content is too long').optional(),
  parentId: uuidSchema.optional().nullable(),
  isPublic: z.boolean().default(false),
});

export const updateDocumentSchema = z.object({
  documentId: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  content: z.string().max(100000, 'Content is too long').optional(),
  isPublic: z.boolean().optional(),
});

export const deleteDocumentSchema = z.object({
  documentId: uuidSchema,
});

// ============================================================================
// Pagination Schema
// ============================================================================

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// ============================================================================
// Helper Types
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateSquadInput = z.infer<typeof createSquadSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreatePollInput = z.infer<typeof createPollSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateLFGInput = z.infer<typeof createLFGSchema>;
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
