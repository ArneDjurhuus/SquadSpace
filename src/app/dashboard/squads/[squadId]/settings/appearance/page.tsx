import { createClient } from '@/utils/supabase/server'
import { AppearanceSettings } from '@/components/squads/appearance-settings'
import { redirect } from 'next/navigation'

export default async function SquadAppearancePage({ params }: { params: Promise<{ squadId: string }> }) {
  const { squadId } = await params
  const supabase = await createClient()

  const { data: squad } = await supabase
    .from('squads')
    .select('*')
    .eq('id', squadId)
    .single()

  if (!squad) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how your squad looks.
        </p>
      </div>
      <AppearanceSettings squad={squad} />
    </div>
  )
}
