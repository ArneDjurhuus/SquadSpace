export interface Profile {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export interface Channel {
  id: string
  name: string
  type: 'TEXT' | 'VOICE'
  squad_id: string
  created_at: string
}

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface Message {
  id: string
  content: string
  image_url?: string | null
  channel_id: string
  sender_id: string
  created_at: string
  updated_at: string
  sender?: Profile
  reactions?: Reaction[]
}

export interface Event {
  id: string
  squad_id: string
  created_by: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  is_template: boolean
  template_name: string | null
  coordinates: { lat: number; lng: number } | null
  check_in_code: string | null
  max_participants: number | null
  meeting_url: string | null
  category: string | null
  recurrence_rule: string | null
  timezone: string | null
  created_at: string
  updated_at: string
  creator?: Profile
  participants?: EventParticipant[]
  agenda?: EventAgendaItem[]
}

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  status: 'going' | 'maybe' | 'not_going' | 'waitlist'
  checked_in_at: string | null
  created_at: string
  user?: Profile
}

export interface EventAgendaItem {
  id: string
  event_id: string
  title: string
  description: string | null
  start_time: string | null
  end_time: string | null
  presenter_id: string | null
  order_index: number
  created_at: string
  presenter?: Profile
}

export interface AvailabilityPoll {
  id: string
  squad_id: string
  created_by: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
  slots?: AvailabilitySlot[]
  creator?: Profile
}

export interface AvailabilitySlot {
  id: string
  poll_id: string
  start_time: string
  end_time: string
  responses?: AvailabilityResponse[]
}

export interface AvailabilityResponse {
  id: string
  poll_id: string
  user_id: string
  slot_id: string
  status: 'available' | 'if_needed'
  created_at: string
  user?: Profile
}

export interface Board {
  id: string
  squad_id: string
  name: string
  created_at: string
  columns?: Column[]
}

export interface Column {
  id: string
  board_id: string
  name: string
  order_index: number
  created_at: string
  tasks?: Task[]
}

export interface Sprint {
  id: string
  squad_id: string
  name: string
  start_date: string | null
  end_date: string | null
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED'
  created_at: string
}

export interface Task {
  id: string
  column_id: string
  sprint_id: string | null
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignee_id: string | null
  due_date: string | null
  order_index: number
  created_at: string
  updated_at: string
  assignee?: Profile
  sprint?: Sprint
  comments?: TaskComment[]
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  user?: Profile
}

export type SquadType = 'GAMING' | 'STUDY' | 'STARTUP' | 'CREATIVE' | 'SPORTS' | 'BOOK_CLUB' | 'FITNESS' | 'OTHER';

export interface SquadSettings {
  // Gaming
  gameTitle?: string;
  platform?: string;
  // Study
  subject?: string;
  institution?: string;
  // Startup
  githubRepo?: string;
  websiteUrl?: string;
  // Creative
  portfolioUrl?: string;
  // Sports
  sport?: string;
  teamName?: string;
  // Book Club
  currentBook?: string;
  // Fitness
  activityType?: string;
  // Common
  enabledModules?: string[];
}

export interface Squad {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: SquadType;
  settings: SquadSettings;
  invite_code: string;
  is_private: boolean;
  capacity: number;
  image: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}
