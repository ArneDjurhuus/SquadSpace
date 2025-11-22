import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { CreateSquadDialog } from "@/components/squads/create-squad-dialog"
import { JoinSquadDialog } from "@/components/squads/join-squad-dialog"
import { SquadCard } from "@/components/squads/squad-card"
import { Navbar } from "@/components/layout/navbar"

export default async function DashboardPage() {
  const session = await auth()

  if (!session || !session.user?.id) {
    redirect("/login")
  }

  const squads = await db.squad.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your squads and view your activity.
            </p>
          </div>
          <div className="flex gap-2">
            <JoinSquadDialog />
            <CreateSquadDialog />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Your Squads</h2>
          {squads.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">No squads yet</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You haven't joined or created any squads yet.
              </p>
              <div className="flex gap-2 justify-center">
                <JoinSquadDialog />
                <CreateSquadDialog />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {squads.map((squad) => (
                <SquadCard key={squad.id} squad={squad} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
