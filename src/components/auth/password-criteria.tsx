"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordCriteriaProps {
  password: string
}

export function PasswordCriteria({ password }: PasswordCriteriaProps) {
  const criteria = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains digit", met: /\d/.test(password) },
    { label: "Contains symbol", met: /[^a-zA-Z0-9]/.test(password) },
  ]

  return (
    <div className="space-y-2 rounded-md bg-muted/50 p-3 text-sm" aria-live="polite">
      <p className="font-medium text-muted-foreground mb-2 text-xs uppercase tracking-wider">Password Requirements</p>
      <ul className="space-y-1.5">
        {criteria.map((item, index) => (
          <li key={index} className="flex items-center space-x-2 transition-colors duration-200">
            <div className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border",
              item.met 
                ? "border-green-500 bg-green-500 text-white" 
                : "border-muted-foreground/30 text-transparent"
            )} aria-hidden="true">
              <Check className="h-2.5 w-2.5" />
            </div>
            <span className={cn(
              "text-xs transition-colors",
              item.met ? "text-foreground" : "text-muted-foreground"
            )}>
              <span className="sr-only">{item.met ? "Met: " : "Not met: "}</span>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
