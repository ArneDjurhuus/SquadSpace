"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LogIn } from "lucide-react"

interface JoinSquadButtonProps {
  inviteCode: string
}

export function JoinSquadButton({ inviteCode }: JoinSquadButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function onJoin() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/squads/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to join squad")
      }

      toast.success("Joined squad successfully!")
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error("An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={onJoin} disabled={isLoading} className="w-full">
      <LogIn className="mr-2 h-4 w-4" />
      {isLoading ? "Joining..." : "Join Squad"}
    </Button>
  )
}
