import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"

interface SquadCardProps {
  squad: {
    id: string
    name: string
    description: string | null
    type?: string | null
    category?: string | null
    _count: {
      members: number
    }
  }
}

function formatType(type?: string | null) {
  if (!type) return "Uncategorized"
  return type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ')
}

export function SquadCard({ squad }: SquadCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{squad.name}</CardTitle>
            <CardDescription>{formatType(squad.type)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {squad.description || "No description provided."}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-1 h-4 w-4" />
          {squad._count.members} members
        </div>
        <Link href={`/squads/${squad.id}`}>
          <Button variant="outline" size="sm">
            View Squad
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
