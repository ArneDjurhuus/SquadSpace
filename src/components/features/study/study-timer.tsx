"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const FOCUS_TIME = 25 * 60
const BREAK_TIME = 5 * 60

export function StudyTimer({ squadId }: { squadId: string }) {
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'focus' | 'break'>('focus')

  // Placeholder for future use
  console.log("Rendering Study Timer for squad:", squadId)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  const toggleTimer = () => setIsActive(!isActive)

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME)
  }

  const switchMode = (newMode: 'focus' | 'break') => {
    setMode(newMode)
    setIsActive(false)
    setTimeLeft(newMode === 'focus' ? FOCUS_TIME : BREAK_TIME)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = 100 - (timeLeft / (mode === 'focus' ? FOCUS_TIME : BREAK_TIME)) * 100

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {mode === 'focus' ? <Brain className="h-5 w-5 text-primary" /> : <Coffee className="h-5 w-5 text-orange-500" />}
          {mode === 'focus' ? 'Focus Session' : 'Break Time'}
        </CardTitle>
        <CardDescription>
          {mode === 'focus' ? 'Stay focused on your task' : 'Take a short break to recharge'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="text-center">
          <div className="text-7xl font-bold tracking-tighter font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex justify-center gap-4">
          <Button
            variant={isActive ? "destructive" : "default"}
            size="lg"
            className="w-32"
            onClick={toggleTimer}
          >
            {isActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Start
              </>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={resetTimer}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center gap-2">
          <Button 
            variant={mode === 'focus' ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => switchMode('focus')}
          >
            Focus
          </Button>
          <Button 
            variant={mode === 'break' ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => switchMode('break')}
          >
            Short Break
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
