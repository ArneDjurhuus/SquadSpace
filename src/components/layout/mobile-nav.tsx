"use client"

import * as React from "react"
import Link from "next/link"
import { Command, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <Link
          href="/"
          className="flex items-center"
          onClick={() => setOpen(false)}
        >
          <Command className="mr-2 h-4 w-4" />
          <span className="font-bold">SquadSpace</span>
        </Link>
        <div className="flex flex-col space-y-3 mt-4">
          <Link
            href="/features"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
            onClick={() => setOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
            onClick={() => setOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/about"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
            onClick={() => setOpen(false)}
          >
            About
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
