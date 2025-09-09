'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import ProfileWizard from '@/components/profile/profile-wizard'

export default function ProfilePage() {
  const { data: session } = useSession()
  if (!session?.user) return <div className="p-6">Please sign in</div>
  return (
    <div className="p-6">
      <ProfileWizard />
    </div>
  )
}
