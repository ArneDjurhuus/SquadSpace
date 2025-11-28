import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/settings/profile-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <div className="grid gap-4 grid-cols-1 max-w-2xl">
        <ProfileForm user={{
          name: profile?.name || '',
          bio: profile?.bio || '',
          image: profile?.image || '',
          email: user.email || ''
        }} />
      </div>
    </div>
  )
}
