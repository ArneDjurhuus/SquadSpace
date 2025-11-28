"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCw, Plus, ArrowLeft, Trash2, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getDecks, createDeck, deleteDeck, getFlashcards, createFlashcard, deleteFlashcard } from "@/app/actions/study"
import { toast } from "sonner"

interface Flashcard {
  id: string
  front: string
  back: string
}

interface Deck {
  id: string
  title: string
  description: string
  cardCount: number
  creator_id: string
}

export function Flashcards({ squadId }: { squadId: string }) {
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false)
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDecks = useCallback(async () => {
    const data = await getDecks(squadId)
    setDecks(data as any)
    setIsLoading(false)
  }, [squadId])

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  const handleCreateDeck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await createDeck(squadId, formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Deck created')
      setIsCreateDeckOpen(false)
      fetchDecks()
    }
  }

  const handleSelectDeck = async (deck: Deck) => {
    setSelectedDeck(deck)
    setCurrentIndex(0)
    setIsFlipped(false)
    const deckCards = await getFlashcards(deck.id)
    setCards(deckCards as Flashcard[])
  }

  const handleCreateCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedDeck) return

    const formData = new FormData(e.currentTarget)
    const result = await createFlashcard(selectedDeck.id, formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Card added')
      setIsCreateCardOpen(false)
      // Refresh cards
      const deckCards = await getFlashcards(selectedDeck.id)
      setCards(deckCards as Flashcard[])
      // Update deck count in list
      fetchDecks()
    }
  }

  const handleDeleteDeck = async (e: React.MouseEvent, deckId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this deck?')) return

    const result = await deleteDeck(squadId, deckId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Deck deleted')
      fetchDecks()
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(null)
      }
    }
  }

  const handleDeleteCard = async () => {
    if (cards.length === 0) return
    const cardId = cards[currentIndex].id
    
    const result = await deleteFlashcard(cardId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Card deleted')
      const newCards = cards.filter(c => c.id !== cardId)
      setCards(newCards)
      if (currentIndex >= newCards.length) {
        setCurrentIndex(Math.max(0, newCards.length - 1))
      }
      setIsFlipped(false)
      fetchDecks() // Update count
    }
  }

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  if (!selectedDeck) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Flashcard Decks</h2>
            <p className="text-muted-foreground">Study sets created by your squad</p>
          </div>
          <Dialog open={isCreateDeckOpen} onOpenChange={setIsCreateDeckOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Deck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Deck</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDeck} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="e.g. Biology 101, React Hooks" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="What is this deck about?" />
                </div>
                <DialogFooter>
                  <Button type="submit">Create Deck</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card 
              key={deck.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleSelectDeck(deck)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{deck.title}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteDeck(e, deck.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{deck.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{deck.cardCount} cards</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {decks.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No decks found. Create one to start studying!
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-8 py-4">
      <div className="w-full flex justify-between items-center max-w-3xl">
        <Button variant="ghost" onClick={() => setSelectedDeck(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Decks
        </Button>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{selectedDeck.title}</h2>
          <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Flashcard</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCard} className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="front">Front (Question)</Label>
                  <Textarea id="front" name="front" placeholder="Enter the question or term..." required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="back">Back (Answer)</Label>
                  <Textarea id="back" name="back" placeholder="Enter the answer or definition..." required />
                </div>
                <DialogFooter>
                  <Button type="submit">Add Card</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {cards.length > 0 ? (
        <>
          <div className="relative w-full max-w-md h-64 perspective-1000" onClick={handleFlip}>
            <motion.div
              className="w-full h-full relative preserve-3d cursor-pointer"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center">
                <CardContent>
                  <h3 className="text-2xl font-semibold">{cards[currentIndex].front}</h3>
                  <p className="text-sm text-muted-foreground mt-4">(Click to flip)</p>
                </CardContent>
              </Card>

              {/* Back */}
              <Card 
                className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-primary text-primary-foreground"
                style={{ transform: "rotateY(180deg)" }}
              >
                <CardContent>
                  <h3 className="text-2xl font-semibold">{cards[currentIndex].back}</h3>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentIndex + 1} / {cards.length}
            </span>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsFlipped(false)}>
              <RotateCw className="mr-2 h-4 w-4" />
              Reset Card
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDeleteCard}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Card
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No cards in this deck yet.</p>
          <Button variant="link" onClick={() => setIsCreateCardOpen(true)}>
            Add your first card
          </Button>
        </div>
      )}
    </div>
  )
}
