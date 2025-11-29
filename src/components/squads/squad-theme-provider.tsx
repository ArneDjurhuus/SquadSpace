"use client"



interface Theme {
  primary?: string // HSL string like "262.1 83.3% 57.8%"
  appearance?: 'light' | 'dark' | 'system'
}

interface SquadThemeProviderProps {
  theme?: Theme
  children: React.ReactNode
}

export function SquadThemeProvider({ theme, children }: SquadThemeProviderProps) {
  // We apply the theme variables to a wrapper div
  // This way, everything inside inherits these variables
  
  const style = theme?.primary ? {
    '--primary': theme.primary,
    '--ring': theme.primary,
  } as React.CSSProperties : {}

  return (
    <div style={style} className="contents">
      {children}
    </div>
  )
}
