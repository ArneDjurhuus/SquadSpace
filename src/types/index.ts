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
