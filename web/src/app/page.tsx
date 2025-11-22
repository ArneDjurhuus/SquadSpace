import { Navbar } from "@/components/layout/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <footer className="border-t py-6 md:px-8 md:py-0 bg-muted/30">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by SquadSpace.me. The source code is available on GitHub.
          </p>
        </div>
      </footer>
    </div>
  )
}
