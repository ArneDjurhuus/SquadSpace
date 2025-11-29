import { render, screen, waitFor } from '@testing-library/react'
import { LFGBoard } from './lfg-board'
import * as gamingActions from '@/app/actions/gaming'

// Mock the server actions
jest.mock('@/app/actions/gaming', () => ({
  getLFGPosts: jest.fn(),
  createLFGPost: jest.fn(),
  joinLFGPost: jest.fn(),
  leaveLFGPost: jest.fn(),
  deleteLFGPost: jest.fn(),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock UI components that might cause issues in JSDOM
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => <div data-testid="dialog" data-open={open}>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('LFGBoard', () => {
  const mockPosts = [
    {
      id: '1',
      game: 'Valorant',
      mode: 'Competitive',
      description: 'Need a Sage',
      currentPlayers: 4,
      max_players: 5,
      start_time: 'In 10 mins',
      creator_id: 'user1',
      host: { name: 'JettMain', image: 'avatar.png' },
      participants: [{ user_id: 'user1' }, { user_id: 'user2' }]
    }
  ]

  beforeEach(() => {
    (gamingActions.getLFGPosts as jest.Mock).mockResolvedValue(mockPosts)
  })

  it('renders posts correctly', async () => {
    render(<LFGBoard squadId="squad1" currentUserId="user2" />)

    await waitFor(() => {
      expect(screen.getByText('Valorant')).toBeInTheDocument()
      expect(screen.getByText('Need a Sage')).toBeInTheDocument()
      expect(screen.getByText('4/5')).toBeInTheDocument()
    })
  })

  it('shows "Leave Squad" button for participants', async () => {
    render(<LFGBoard squadId="squad1" currentUserId="user2" />)

    await waitFor(() => {
      expect(screen.getByText('Leave Squad')).toBeInTheDocument()
    })
  })

  it('shows "Delete Post" button for creator', async () => {
    render(<LFGBoard squadId="squad1" currentUserId="user1" />)

    await waitFor(() => {
      expect(screen.getByText('Delete Post')).toBeInTheDocument()
    })
  })
})
