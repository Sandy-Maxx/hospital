'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const isAdmin = session?.user?.role === 'ADMIN'

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/profile/me').then(async (res) => {
      if (res.ok) setProfile(await res.json())
      setLoading(false)
    })
  }, [session?.user])

  const save = async () => {
    setSaving(true)
    try {
      await fetch('/api/profile/me', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
    } finally { setSaving(false) }
  }

  const uploadDataUrl = async (endpoint: string, dataUrl: string) => {
    await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl }) })
  }

  if (!session?.user) return <div className="p-6">Please sign in</div>
  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your personal and professional information</p>
      </div>

      {/* Personal */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Basic info and contact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={profile.fullName || ''} onChange={e => setProfile((p:any) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={profile.phone || ''} onChange={e => setProfile((p:any) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email || session.user?.email || ''} onChange={e => setProfile((p:any) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={profile.address || ''} onChange={e => setProfile((p:any) => ({ ...p, address: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Profile Picture</Label>
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return
              const reader = new FileReader(); reader.onload = async () => {
                await uploadDataUrl('/api/profile/me/avatar', reader.result as string)
              }; reader.readAsDataURL(f)
            }} />
          </div>
        </CardContent>
      </Card>

      {/* Professional */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Designation, job description, responsibilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Designation</Label>
              <Input value={profile.designation?.current || ''} onChange={e => setProfile((p:any) => ({ ...p, designation: { ...(p.designation || {}), current: e.target.value, changelog: p.designation?.changelog || [] } }))} />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={profile.department || ''} onChange={e => setProfile((p:any) => ({ ...p, department: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Job Description</Label>
            <Input value={profile.jobDescription || ''} onChange={e => setProfile((p:any) => ({ ...p, jobDescription: e.target.value }))} />
          </div>
          <div>
            <Label>Responsibilities</Label>
            <Input value={profile.responsibilities || ''} onChange={e => setProfile((p:any) => ({ ...p, responsibilities: e.target.value }))} />
          </div>
          <div>
            <Label>Experience Tree (JSON)</Label>
            <textarea className="w-full p-2 border rounded" rows={4} value={JSON.stringify(profile.experienceTree || [], null, 2)} onChange={e => {
              try { setProfile((p:any) => ({ ...p, experienceTree: JSON.parse(e.target.value || '[]') })) } catch {}
            }} />
          </div>
        </CardContent>
      </Card>

      {/* Education & Certifications */}
      <Card>
        <CardHeader>
          <CardTitle>Education & Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Education (JSON array)</Label>
            <textarea className="w-full p-2 border rounded" rows={3} value={JSON.stringify(profile.education || [], null, 2)} onChange={e => {
              try { setProfile((p:any) => ({ ...p, education: JSON.parse(e.target.value || '[]') })) } catch {}
            }} />
          </div>
          <div>
            <Label>Certifications (JSON array)</Label>
            <textarea className="w-full p-2 border rounded" rows={3} value={JSON.stringify(profile.certifications || [], null, 2)} onChange={e => {
              try { setProfile((p:any) => ({ ...p, certifications: JSON.parse(e.target.value || '[]') })) } catch {}
            }} />
          </div>
        </CardContent>
      </Card>

      {/* Signature - Admin only edit */}
      <Card>
        <CardHeader>
          <CardTitle>Signature</CardTitle>
          <CardDescription>Uploaded by admin only</CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div>
              <Label>Upload Signature</Label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return
                const reader = new FileReader(); reader.onload = async () => {
                  await uploadDataUrl('/api/profile/me/signature', reader.result as string)
                }; reader.readAsDataURL(f)
              }} />
            </div>
          ) : (
            <div className="text-sm text-gray-600">Only admins can upload or change signature.</div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </div>
    </div>
  )
}

