/**
 * TypeScript enums and constants for SquadSpace
 * Replaces magic strings throughout the application
 */

// ============================================================================
// Squad Types
// ============================================================================

export enum SquadType {
  GAMING = 'GAMING',
  STUDY = 'STUDY',
  STARTUP = 'STARTUP',
  GENERAL = 'GENERAL',
}

export const SquadTypeLabels: Record<SquadType, string> = {
  [SquadType.GAMING]: 'Gaming',
  [SquadType.STUDY]: 'Study',
  [SquadType.STARTUP]: 'Startup',
  [SquadType.GENERAL]: 'General',
};

// ============================================================================
// Squad Member Roles
// ============================================================================

export enum SquadRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export const SquadRoleLabels: Record<SquadRole, string> = {
  [SquadRole.OWNER]: 'Owner',
  [SquadRole.ADMIN]: 'Admin',
  [SquadRole.MODERATOR]: 'Moderator',
  [SquadRole.MEMBER]: 'Member',
};

// ============================================================================
// Event Status
// ============================================================================

export enum EventStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const EventStatusLabels: Record<EventStatus, string> = {
  [EventStatus.UPCOMING]: 'Upcoming',
  [EventStatus.ONGOING]: 'Ongoing',
  [EventStatus.COMPLETED]: 'Completed',
  [EventStatus.CANCELLED]: 'Cancelled',
};

// ============================================================================
// Event Participant Status
// ============================================================================

export enum EventParticipantStatus {
  GOING = 'going',
  MAYBE = 'maybe',
  NOT_GOING = 'not_going',
  WAITLIST = 'waitlist',
}

export const EventParticipantStatusLabels: Record<EventParticipantStatus, string> = {
  [EventParticipantStatus.GOING]: 'Going',
  [EventParticipantStatus.MAYBE]: 'Maybe',
  [EventParticipantStatus.NOT_GOING]: 'Not Going',
  [EventParticipantStatus.WAITLIST]: 'Waitlist',
};

// ============================================================================
// Poll Types
// ============================================================================

export enum PollType {
  STANDARD = 'STANDARD',
  SCHEDULE = 'SCHEDULE',
  DECISION = 'DECISION',
}

export const PollTypeLabels: Record<PollType, string> = {
  [PollType.STANDARD]: 'Standard Poll',
  [PollType.SCHEDULE]: 'Schedule Poll',
  [PollType.DECISION]: 'Decision Poll',
};

// ============================================================================
// Task Status
// ============================================================================

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.IN_REVIEW]: 'In Review',
  [TaskStatus.DONE]: 'Done',
};

// ============================================================================
// Task Priority
// ============================================================================

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const TaskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
  [TaskPriority.URGENT]: 'Urgent',
};

export const TaskPriorityColors: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'text-gray-500',
  [TaskPriority.MEDIUM]: 'text-blue-500',
  [TaskPriority.HIGH]: 'text-orange-500',
  [TaskPriority.URGENT]: 'text-red-500',
};

// ============================================================================
// Tournament Format
// ============================================================================

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS = 'SWISS',
}

export const TournamentFormatLabels: Record<TournamentFormat, string> = {
  [TournamentFormat.SINGLE_ELIMINATION]: 'Single Elimination',
  [TournamentFormat.DOUBLE_ELIMINATION]: 'Double Elimination',
  [TournamentFormat.ROUND_ROBIN]: 'Round Robin',
  [TournamentFormat.SWISS]: 'Swiss',
};

// ============================================================================
// Tournament Status
// ============================================================================

export enum TournamentStatus {
  REGISTRATION = 'REGISTRATION',
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const TournamentStatusLabels: Record<TournamentStatus, string> = {
  [TournamentStatus.REGISTRATION]: 'Registration Open',
  [TournamentStatus.UPCOMING]: 'Upcoming',
  [TournamentStatus.ONGOING]: 'Ongoing',
  [TournamentStatus.COMPLETED]: 'Completed',
  [TournamentStatus.CANCELLED]: 'Cancelled',
};

// ============================================================================
// User Status
// ============================================================================

export enum UserStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}

export const UserStatusLabels: Record<UserStatus, string> = {
  [UserStatus.ONLINE]: 'Online',
  [UserStatus.AWAY]: 'Away',
  [UserStatus.BUSY]: 'Busy',
  [UserStatus.OFFLINE]: 'Offline',
};

export const UserStatusColors: Record<UserStatus, string> = {
  [UserStatus.ONLINE]: 'bg-green-500',
  [UserStatus.AWAY]: 'bg-yellow-500',
  [UserStatus.BUSY]: 'bg-red-500',
  [UserStatus.OFFLINE]: 'bg-gray-400',
};

// ============================================================================
// Notification Types
// ============================================================================

export enum NotificationType {
  SQUAD_INVITE = 'SQUAD_INVITE',
  EVENT_INVITE = 'EVENT_INVITE',
  EVENT_REMINDER = 'EVENT_REMINDER',
  MENTION = 'MENTION',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  POLL_CREATED = 'POLL_CREATED',
  TOURNAMENT_INVITE = 'TOURNAMENT_INVITE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export const NotificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.SQUAD_INVITE]: 'Squad Invite',
  [NotificationType.EVENT_INVITE]: 'Event Invite',
  [NotificationType.EVENT_REMINDER]: 'Event Reminder',
  [NotificationType.MENTION]: 'Mention',
  [NotificationType.TASK_ASSIGNED]: 'Task Assigned',
  [NotificationType.POLL_CREATED]: 'New Poll',
  [NotificationType.TOURNAMENT_INVITE]: 'Tournament Invite',
  [NotificationType.ANNOUNCEMENT]: 'Announcement',
};

// ============================================================================
// Channel Types
// ============================================================================

export enum ChannelType {
  TEXT = 'TEXT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  VOICE = 'VOICE',
}

export const ChannelTypeLabels: Record<ChannelType, string> = {
  [ChannelType.TEXT]: 'Text Channel',
  [ChannelType.ANNOUNCEMENT]: 'Announcement Channel',
  [ChannelType.VOICE]: 'Voice Channel',
};

// ============================================================================
// LFG Status
// ============================================================================

export enum LFGStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const LFGStatusLabels: Record<LFGStatus, string> = {
  [LFGStatus.OPEN]: 'Looking for Players',
  [LFGStatus.IN_PROGRESS]: 'In Progress',
  [LFGStatus.COMPLETED]: 'Completed',
  [LFGStatus.CANCELLED]: 'Cancelled',
};
