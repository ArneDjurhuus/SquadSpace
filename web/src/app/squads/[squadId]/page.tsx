import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, MessageSquare, Calendar } from "lucide-react"

interface SquadPageProps {
  params: {
    squadId: string
  }
}

export default async function SquadPage({ params }: SquadPageProps) {
  const session = await auth()

  if (!session || !session.user?.id) {
    redirect("/login")
  }

  const squad = await db.squad.findUnique({
    where: {
      id: params.squadId,
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  })

  if (!squad) {
    notFound()
  }

  const isMember = squad.members.some(
    (member) => member.userId === session.user?.id
  )

  if (!isMember) {
    // Handle non-members (show join page or redirect)
    // For now, just redirect to dashboard
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex flex-col gap-8">
          {/* Squad Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{squad.name}</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {squad.description || "No description provided."}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  {squad.category || "Uncategorized"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {squad._count.members} members
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button>Invite Members</Button>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="members">
                <Users className="mr-2 h-4 w-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">No recent activity.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Squad Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Invite Code:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                        {squad.inviteCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Created:</span>
                      <span>{squad.createdAt.toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {squad.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {member.user.name?.[0] || "U"}
                          </div>
                          <div>
                            <p className="font-medium">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Joined {member.joinedAt.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat">
              <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">Chat functionality coming soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground">Event planning coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
