import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, MessageSquare, Calendar } from "lucide-react"
import { getChannels } from "@/app/actions/chat"
import { getEvents } from "@/app/actions/events"
import { ChatLayout } from "@/components/chat/chat-layout"
import { EventList } from "@/components/events/event-list"
import { CreateEventDialog } from "@/components/events/create-event-dialog"
import { SquadCalendar } from "@/components/events/squad-calendar"
import { JoinSquadButton } from "@/components/squads/join-squad-button"
import { TaskBoard } from "@/components/tasks/task-board"
import { KanbanSquare } from "lucide-react"
import { SQUAD_FEATURES, FEATURE_LABELS } from "@/lib/squad-features"
import { SquadType } from "@/types"

// Feature Components
import { Leaderboard } from "@/components/features/gaming/leaderboard"
import { LFGBoard } from "@/components/features/gaming/lfg-board"
import { Flashcards } from "@/components/features/study/flashcards"
import { StudyTimer } from "@/components/features/study/study-timer"
import { Roadmap } from "@/components/features/startup/roadmap"
import { SquadThemeProvider } from "@/components/squads/squad-theme-provider"
import { DocumentList } from "@/components/features/shared/documents/document-list"
import { getDocuments } from "@/app/actions/documents"
import { Tournaments } from "@/components/features/gaming/tournaments"
import { getTournaments } from "@/app/actions/tournaments"

interface SquadMemberResponse {
  id: string
  user_id: string
  role: string
  joined_at: string
  profiles: {
    name: string | null
    image: string | null
    email: string | null
  }
}

interface SquadPageProps {
  params: Promise<{
    squadId: string
  }>
}

export default async function SquadPage({ params }: SquadPageProps) {
  const { squadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const currentUser = {
    id: user.id,
    email: user.email || null,
    name: user.user_metadata?.name || null,
    image: user.user_metadata?.avatar_url || null
  }

  const { data: squad, error } = await supabase
    .from('squads')
    .select(`
      *,
      squad_members (
        *,
        profiles (*)
      )
    `)
    .eq('id', squadId)
    .single()

  if (error || !squad) {
    notFound()
  }

  // Map Supabase response to component structure
  const formattedSquad = {
    ...squad,
    inviteCode: squad.invite_code,
    createdAt: new Date(squad.created_at),
    members: squad.squad_members.map((m: SquadMemberResponse) => ({
      ...m,
      user: m.profiles
    }))
  }

  const isMember = squad.squad_members.some(
    (member: SquadMemberResponse) => member.user_id === user.id
  )

  const theme = squad.settings?.theme

  if (!isMember) {
    return (
      <SquadThemeProvider theme={theme}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto py-8 px-4 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                {squad.banner_url && (
                  <div className="w-full h-32 rounded-t-lg overflow-hidden mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={squad.banner_url} alt="Squad Banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <CardTitle>{formattedSquad.name}</CardTitle>
                <CardDescription>
                  {formattedSquad.is_private ? "Private Squad" : formattedSquad.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{formattedSquad.members.length} members</span>
                  </div>
                  
                  {formattedSquad.is_private ? (
                     <div className="bg-muted p-4 rounded-lg text-center space-y-4">
                      <p className="font-semibold">This squad is private.</p>
                      <p className="text-sm text-muted-foreground">You need an invite code to join.</p>
                    </div>
                  ) : (
                    <JoinSquadButton inviteCode={formattedSquad.inviteCode} />
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </SquadThemeProvider>
    )
  }

  const channels = await getChannels(squadId)
  const events = await getEvents(squadId)
  const documents = await getDocuments(squadId)
  const tournaments = await getTournaments(squadId)
  const features = SQUAD_FEATURES[formattedSquad.type as SquadType] || SQUAD_FEATURES.OTHER

  return (
    <SquadThemeProvider theme={theme}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        {squad.banner_url && (
          <div className="w-full h-48 md:h-64 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={squad.banner_url} alt="Squad Banner" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 p-6 z-20 container mx-auto">
              <h1 className="text-4xl font-bold text-white drop-shadow-md">{formattedSquad.name}</h1>
            </div>
          </div>
        )}
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="flex flex-col gap-8">
            {/* Squad Header */}
            {!squad.banner_url && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">{formattedSquad.name}</h1>
                  <p className="text-muted-foreground mt-2 text-lg">
                    {formattedSquad.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      {formattedSquad.type ? (formattedSquad.type.charAt(0) + formattedSquad.type.slice(1).toLowerCase().replace(/_/g, ' ')) : "Uncategorized"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formattedSquad.members.length} members
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
            )}
            {squad.banner_url && (
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-muted-foreground text-lg">
                    {formattedSquad.description || "No description provided."}
                  </p>
                   <div className="flex items-center gap-2 mt-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      {formattedSquad.type ? (formattedSquad.type.charAt(0) + formattedSquad.type.slice(1).toLowerCase().replace(/_/g, ' ')) : "Uncategorized"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formattedSquad.members.length} members
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
            )}

          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full h-auto flex-wrap justify-start md:w-auto md:flex-nowrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">
                <Users className="mr-2 h-4 w-4" />
                Members
              </TabsTrigger>
              {features.map(feature => (
                <TabsTrigger key={feature} value={feature}>
                  {feature === 'chat' && <MessageSquare className="mr-2 h-4 w-4" />}
                  {feature === 'events' && <Calendar className="mr-2 h-4 w-4" />}
                  {feature === 'tasks' && <KanbanSquare className="mr-2 h-4 w-4" />}
                  {FEATURE_LABELS[feature]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Squad Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Invite Code:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                        {formattedSquad.inviteCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Created:</span>
                      <span>{formattedSquad.createdAt.toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">No recent activity.</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Squad Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <SquadCalendar events={events} currentUser={currentUser} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formattedSquad.members.map((member: SquadMemberResponse & { user: SquadMemberResponse['profiles'] }) => (
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
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {features.includes('chat') && (
              <TabsContent value="chat" className="mt-6">
                <ChatLayout 
                  squadId={squadId} 
                  initialChannels={channels}
                  currentUser={currentUser}
                />
              </TabsContent>
            )}

            {features.includes('events') && (
              <TabsContent value="events" className="mt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Upcoming Events</h2>
                    <CreateEventDialog squadId={squadId} />
                  </div>
                  <EventList events={events} currentUser={currentUser} />
                </div>
              </TabsContent>
            )}

            {features.includes('tasks') && (
              <TabsContent value="tasks" className="mt-6 h-[calc(100vh-200px)]">
                <TaskBoard squadId={squadId} members={formattedSquad.members} />
              </TabsContent>
            )}

            {features.filter(f => !['chat', 'events', 'tasks'].includes(f)).map(feature => (
              <TabsContent key={feature} value={feature} className="mt-6">
                {feature === 'leaderboard' && <Leaderboard squadId={squadId} />}
                {feature === 'lfg' && <LFGBoard squadId={squadId} currentUserId={currentUser.id} />}
                {feature === 'tournaments' && <Tournaments squadId={squadId} tournaments={tournaments} currentUserId={currentUser.id} />}
                {feature === 'flashcards' && <Flashcards squadId={squadId} />}
                {feature === 'timer' && <StudyTimer squadId={squadId} />}
                {feature === 'roadmap' && <Roadmap squadId={squadId} />}
                {(feature === 'documents' || feature === 'resources') && (
                  <DocumentList 
                    squadId={squadId} 
                    documents={documents} 
                    currentUserId={currentUser.id} 
                  />
                )}
                
                {!['leaderboard', 'lfg', 'tournaments', 'flashcards', 'timer', 'roadmap', 'documents', 'resources'].includes(feature) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{FEATURE_LABELS[feature]}</CardTitle>
                      <CardDescription>Feature coming soon...</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>This feature is enabled for {formattedSquad.type} squads.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
    </SquadThemeProvider>
  )
}
