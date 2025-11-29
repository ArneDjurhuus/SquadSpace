'use client'

import { updateProfile } from '@/app/actions/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useActionState } from 'react'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionResponse } from '@/lib/errors'

interface ProfileFormProps {
  user: {
    name: string | null
    bio: string | null
    image: string | null
    email: string | null
  }
}

const initialState: ActionResponse = {
  success: false,
  error: {
    code: 'INITIAL' as any,
    message: ''
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null)

  useEffect(() => {
    if (state?.success) {
      toast.success('Profile updated successfully')
    } else if (state?.success === false && state.error.message) {
      toast.error(state.error.message)
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Update your personal information and how you appear to others.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={user.email || ''} 
              disabled 
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={user.name || ''} 
              placeholder="Your name" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              name="bio" 
              defaultValue={user.bio || ''} 
              placeholder="Tell us about yourself"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Avatar URL</Label>
            <Input 
              id="image" 
              name="image" 
              defaultValue={user.image || ''} 
              placeholder="https://example.com/avatar.png" 
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL for your profile picture.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
