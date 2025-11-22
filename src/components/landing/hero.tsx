"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Users, Zap, Shield } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-20 lg:pt-32 pb-16 md:pb-20 lg:pb-32">
      {/* <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div> */}
      <div className="container mx-auto flex flex-col items-center gap-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
          v1.0 is now live
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground"
        >
          Where Squads Unite to <span className="text-primary">Thrive</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8"
        >
          SquadSpace is the ultimate platform for teams, gaming groups, and creative collectives to organize, communicate, and achieve goals together.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mt-6"
        >
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-lg gap-2">
              Create Your Squad <ArrowRight className="h-4 w-4" />
            </Button>

          </Link>
          <Link href="/features">
            <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
              Explore Features
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 relative w-full max-w-5xl aspect-video rounded-xl border bg-background/50 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
            {/* Placeholder for App Screenshot */}
            <div className="text-center">
              <Users className="h-24 w-24 mx-auto mb-4 opacity-20" />
              <p className="text-2xl font-heading font-bold">Dashboard Preview</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
