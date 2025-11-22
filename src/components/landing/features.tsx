"use client"

import { motion } from "framer-motion"
import { Users, MessageSquare, Calendar, Trophy, Shield, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Squad Management",
    description: "Create profiles, assign roles, and manage permissions effortlessly with our intuitive dashboard.",
    icon: Users,
  },
  {
    title: "Real-time Chat",
    description: "Communicate instantly with channels, threads, and direct messages designed for focused discussions.",
    icon: MessageSquare,
  },
  {
    title: "Event Planning",
    description: "Schedule events, track RSVPs, and handle time zones automatically so no one misses out.",
    icon: Calendar,
  },
  {
    title: "Achievements",
    description: "Gamify your squad's progress with custom achievements, milestones, and leaderboards.",
    icon: Trophy,
  },
  {
    title: "Secure & Private",
    description: "Your data is encrypted and protected. Control who sees what with granular privacy settings.",
    icon: Shield,
  },
  {
    title: "Lightning Fast",
    description: "Built on modern tech for instant loading and real-time updates across all devices.",
    icon: Zap,
  },
]

export function Features() {
  return (
    <section className="container mx-auto space-y-16 py-24 md:py-32">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl font-bold">
          Everything you need to manage your squad
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Powerful tools to help your team collaborate, communicate, and conquer.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-muted bg-background/60 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-md">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
