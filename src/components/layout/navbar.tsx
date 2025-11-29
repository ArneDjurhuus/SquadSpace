import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Command } from "lucide-react"
import { createClient } from "@/utils/supabase/server"

import { UserNav } from "@/components/layout/user-nav"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationsPopover } from "@/components/layout/notifications-popover"
import { Profile } from "@/types"

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch user profile for status display
  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, image, status_emoji, status_text, status_expires_at')
      .eq('id', user.id)
      .single()
    profile = data as Profile | null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/40 backdrop-blur-md supports-[backdrop-filter]:bg-background/20">
      <div className="container mx-auto flex h-16 items-center px-4">
        <MobileNav />
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Command className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              SquadSpace
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/features" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Features
            </Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Pricing
            </Link>
            <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
              About
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="mr-6 flex items-center space-x-2 md:hidden">
              <Command className="h-6 w-6" />
              <span className="font-bold inline-block">
                SquadSpace
              </span>
            </Link>
          </div>
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            {user ? (
              <>
                <NotificationsPopover />
                <Link href="/dashboard">
                  <Button size="sm">
                    Dashboard
                  </Button>
                </Link>
                <UserNav user={user} profile={profile} />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
