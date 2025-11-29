"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/actions/auth"
import { User } from "@supabase/supabase-js"
import { LogOut, Settings, User as UserIcon, Smile } from "lucide-react"
import Link from "next/link"
import { StatusEditor } from "@/components/layout/status-editor"
import { Profile } from "@/types"

interface UserNavProps {
  user: User
  profile?: Profile | null
}

export function UserNav({ user, profile }: UserNavProps) {
  const hasStatus = profile?.status_emoji || profile?.status_text
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ""} />
            <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {/* Status indicator dot */}
          {profile?.status_emoji && (
            <span className="absolute -bottom-0.5 -right-0.5 text-xs bg-background rounded-full p-0.5 shadow-sm">
              {profile.status_emoji}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {/* Status display */}
            {hasStatus && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                {profile?.status_emoji && <span>{profile.status_emoji}</span>}
                {profile?.status_text && <span className="truncate">{profile.status_text}</span>}
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Status Editor */}
        <div className="px-2 py-1.5">
          <StatusEditor
            currentEmoji={profile?.status_emoji}
            currentText={profile?.status_text}
            trigger={
              <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-2">
                <Smile className="mr-2 h-4 w-4" />
                {hasStatus ? "Update status" : "Set status"}
              </Button>
            }
          />
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
