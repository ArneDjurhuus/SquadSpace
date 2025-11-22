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

export interface Message {
  id: string
  content: string
  channel_id: string
  sender_id: string
  created_at: string
  updated_at: string
  sender?: Profile
}
