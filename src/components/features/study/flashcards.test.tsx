import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { Flashcards } from './flashcards'
import * as studyActions from '@/app/actions/study'

// Mock the server actions
jest.mock('@/app/actions/study', () => ({
  getDecks: jest.fn(),
  createDeck: jest.fn(),
  deleteDeck: jest.fn(),
  getFlashcards: jest.fn(),
  createFlashcard: jest.fn(),
  deleteFlashcard: jest.fn(),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => <div data-testid="dialog" data-open={open}>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('Flashcards', () => {
  const mockDecks = [
    {
      id: '1',
      title: 'Biology 101',
      description: 'Cell structure',
      cardCount: 10,
      creator_id: 'user1'
    }
  ]

  const mockCards = [
    { id: 'c1', front: 'Question 1', back: 'Answer 1' },
    { id: 'c2', front: 'Question 2', back: 'Answer 2' }
  ]

  beforeEach(() => {
    (studyActions.getDecks as jest.Mock).mockResolvedValue(mockDecks);
    (studyActions.getFlashcards as jest.Mock).mockResolvedValue(mockCards);
  })

  it('renders decks list initially', async () => {
    render(<Flashcards squadId="squad1" />)

    await waitFor(() => {
      expect(screen.getByText('Biology 101')).toBeInTheDocument()
      expect(screen.getByText('10 cards')).toBeInTheDocument()
    })
  })

  it('switches to study mode when deck is clicked', async () => {
    render(<Flashcards squadId="squad1" />)

    await waitFor(() => {
      expect(screen.getByText('Biology 101')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Biology 101'))

    await waitFor(() => {
      expect(screen.getByText('Question 1')).toBeInTheDocument()
      expect(screen.getByText('Back to Decks')).toBeInTheDocument()
    })
  })
})
