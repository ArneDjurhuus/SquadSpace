"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateSquadAppearance } from "@/app/actions/squad-settings"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AppearanceSettingsProps {
  squad: {
    id: string
    banner_url: string | null
    settings: {
      theme?: {
        primary?: string
      }
    }
  }
}

const PRESET_COLORS = [
  { name: 'Electric Purple', value: '262.1 83.3% 57.8%' },
  { name: 'Ocean Blue', value: '221.2 83.2% 53.3%' },
  { name: 'Emerald Green', value: '142.1 76.2% 36.3%' },
  { name: 'Crimson Red', value: '346.8 77.2% 49.8%' },
  { name: 'Sunset Orange', value: '24.6 95% 53.1%' },
]

export function AppearanceSettings({ squad }: AppearanceSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [primaryColor, setPrimaryColor] = useState(squad.settings.theme?.primary || PRESET_COLORS[0].value)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget)
    formData.set('primaryColor', primaryColor)
    
    const result = await updateSquadAppearance(squad.id, formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Appearance updated')
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Squad Theme</CardTitle>
          <CardDescription>Customize the color scheme for your squad.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label>Primary Color</Label>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setPrimaryColor(color.value)}
                    className={`h-10 w-10 rounded-full border-2 transition-all ${
                      primaryColor === color.value 
                        ? 'border-foreground scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: `hsl(${color.value})` }}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="h-10 w-10 rounded border"
                  style={{ backgroundColor: `hsl(${primaryColor})` }}
                />
                <Input 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="HSL Value (e.g. 262.1 83.3% 57.8%)"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannerUrl">Banner Image URL</Label>
              <Input 
                id="bannerUrl" 
                name="bannerUrl" 
                defaultValue={squad.banner_url || ''} 
                placeholder="https://example.com/banner.jpg" 
              />
              <p className="text-xs text-muted-foreground">
                Enter a URL for the squad banner image.
              </p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
