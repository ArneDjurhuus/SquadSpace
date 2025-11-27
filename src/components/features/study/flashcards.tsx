"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react"
import { motion } from "framer-motion"

interface Flashcard {
  id: string
  front: string
  back: string
}

const MOCK_FLASHCARDS: Flashcard[] = [
  { id: '1', front: 'What is the powerhouse of the cell?', back: 'Mitochondria' },
  { id: '2', front: 'What is the capital of France?', back: 'Paris' },
  { id: '3', front: 'What is the chemical symbol for Gold?', back: 'Au' },
  { id: '4', front: 'Who wrote "Romeo and Juliet"?', back: 'William Shakespeare' },
  { id: '5', front: 'What is the value of Pi (approx)?', back: '3.14159' },
]

export function Flashcards({ squadId }: { squadId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Placeholder for future use
  console.log("Rendering Flashcards for squad:", squadId)

  const handleNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % MOCK_FLASHCARDS.length)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + MOCK_FLASHCARDS.length) % MOCK_FLASHCARDS.length)
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
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
              <h3 className="text-2xl font-semibold">{MOCK_FLASHCARDS[currentIndex].front}</h3>
              <p className="text-sm text-muted-foreground mt-4">(Click to flip)</p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card 
            className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-primary text-primary-foreground"
            style={{ transform: "rotateY(180deg)" }}
          >
            <CardContent>
              <h3 className="text-2xl font-semibold">{MOCK_FLASHCARDS[currentIndex].back}</h3>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {currentIndex + 1} / {MOCK_FLASHCARDS.length}
        </span>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <Button variant="ghost" size="sm" onClick={() => setIsFlipped(false)}>
        <RotateCw className="mr-2 h-4 w-4" />
        Reset Card
      </Button>
    </div>
  )
}
