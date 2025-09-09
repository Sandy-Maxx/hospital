"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, ChevronLeft, ChevronRight, GraduationCap, User as UserIcon, ListChecks, Settings } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

interface ProfileData {
  fullName?: string
  phone?: string
  email?: string
  address?: string
  department?: string
  designation?: { current?: string; changelog?: Array<{ designation: string; fromYear: number; toYear?: number }> }
  jobDescription?: string
  responsibilities?: string
  qualifications?: Array<{ degree: string; stream: string; institute?: string; year?: number }>
  experience?: Array<{ organization: string; designation: string; department?: string; fromYear: number; toYear?: number; notes?: string }>
}

const DEGREE_OPTIONS = ['High School', 'Diploma', 'BSc', 'BPharm', 'BTech', 'MBBS', 'MD', 'MS', 'MSc', 'MPharm', 'MTech', 'PhD']
const STREAM_OPTIONS = ['Science', 'Arts', 'Commerce', 'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'Radiology', 'Oncology']
const DEPARTMENT_OPTIONS = ['Cardiology','Emergency','General Medicine','Pediatrics','Orthopedics','Neurology','Oncology','Radiology','Surgery','Psychiatry']
const DESIGNATION_OPTIONS = ['Junior Doctor','Senior Doctor','Consultant','Head of Department','Nurse','Head Nurse','Receptionist','Administrator']

function Stepper({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step + 1) / total) * 100)
  return (
    <div className="mb-4">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-600 mt-1">Step {step + 1} of {total}</div>
    </div>
  )
}

export default function ProfileWizard() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<ProfileData>({ qualifications: [], experience: [], designation: { current: '', changelog: [] } })
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const targetUserId = isAdmin && searchParams?.get('userId') ? String(searchParams.get('userId')) : undefined

  const fullSteps = [
    { key: 'personal', title: 'Personal Info', icon: UserIcon },
    { key: 'professional', title: 'Professional', icon: Settings },
    { key: 'qualifications', title: 'Qualifications', icon: GraduationCap },
    { key: 'experience', title: 'Experience', icon: ListChecks },
    { key: 'review', title: 'Review & Save', icon: CheckCircle2 },
  ]
  const limitedSteps = [
    { key: 'personal', title: 'Personal Info', icon: UserIcon },
    { key: 'review', title: 'Review & Save', icon: CheckCircle2 },
  ]
  const steps = useMemo(() => (isAdmin ? fullSteps : limitedSteps), [isAdmin])

  useEffect(() => {
    (async () => {
      try {
        const url = targetUserId ? `/api/profile/${targetUserId}` : '/api/profile/me'
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setProfile((prev) => ({ ...prev, ...data }))
        }
      } finally { setLoading(false) }
    })()
  }, [targetUserId])

  const save = async () => {
    setSaving(true)
    try {
      const url = targetUserId ? `/api/profile/${targetUserId}` : '/api/profile/me'
      const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) })
      if (res.ok) {
        setStep(steps.length - 1)
      }
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-6">Loading...</div>

  const StepPersonal = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label>Profile Picture</Label>
        <input type="file" accept="image/*" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return
          const reader = new FileReader(); reader.onload = async () => {
            const body: any = { dataUrl: reader.result as string }
            if (isAdmin && targetUserId) body.userId = targetUserId
            await fetch('/api/profile/me/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          }; reader.readAsDataURL(f)
        }} />
      </div>
      <div>
        <Label>Full Name</Label>
        <Input value={profile.fullName || ''} onChange={(e) => setProfile(p => ({ ...p, fullName: e.target.value }))} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={profile.phone || ''} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} />
      </div>
      {isAdmin && (
        <div>
          <Label>Email</Label>
          <Input value={profile.email || ''} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} />
        </div>
      )}
      <div className="md:col-span-2">
        <Label>Address</Label>
        <Input value={profile.address || ''} onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} />
      </div>
    </div>
  )

  const StepProfessional = isAdmin ? (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Department</Label>
          <select className="w-full p-2 border rounded" value={profile.department || ''} onChange={(e) => setProfile(p => ({ ...p, department: e.target.value }))}>
            <option value="">Select Department</option>
            {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <Label>Designation</Label>
          <select className="w-full p-2 border rounded" value={profile.designation?.current || ''} onChange={(e) => setProfile(p => ({ ...p, designation: { ...(p.designation||{}), current: e.target.value, changelog: p.designation?.changelog || [] } }))}>
            <option value="">Select Designation</option>
            {DESIGNATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div>
        <Label>Job Description</Label>
        <Input value={profile.jobDescription || ''} onChange={(e) => setProfile(p => ({ ...p, jobDescription: e.target.value }))} />
      </div>
      <div>
        <Label>Responsibilities</Label>
        <Input value={profile.responsibilities || ''} onChange={(e) => setProfile(p => ({ ...p, responsibilities: e.target.value }))} />
      </div>
      <div>
        <Label>Designation Change Log</Label>
        <div className="space-y-2">
          {(profile.designation?.changelog || []).map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <select className="w-full p-2 border rounded" value={row.designation}
                  onChange={(e) => setProfile(p => ({ ...p, designation: { ...(p.designation || {}), changelog: (p.designation?.changelog||[]).map((r,i) => i===idx? { ...r, designation: e.target.value } : r) } }))}>
                  {DESIGNATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-3">
                <Input type="number" placeholder="From (YYYY)" value={row.fromYear || ''}
                  onChange={(e) => setProfile(p => ({ ...p, designation: { ...(p.designation || {}), changelog: (p.designation?.changelog||[]).map((r,i) => i===idx? { ...r, fromYear: Number(e.target.value) } : r) } }))} />
              </div>
              <div className="col-span-3">
                <Input type="number" placeholder="To (YYYY)" value={row.toYear || ''}
                  onChange={(e) => setProfile(p => ({ ...p, designation: { ...(p.designation || {}), changelog: (p.designation?.changelog||[]).map((r,i) => i===idx? { ...r, toYear: e.target.value? Number(e.target.value) : undefined } : r) } }))} />
              </div>
              <div className="col-span-2 text-right">
                <Button variant="outline" size="sm" onClick={() => setProfile(p => ({ ...p, designation: { ...(p.designation||{}), changelog: (p.designation?.changelog||[]).filter((_,i)=>i!==idx) } }))}>Remove</Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setProfile(p => ({ ...p, designation: { ...(p.designation||{}), changelog: [...(p.designation?.changelog||[]), { designation: p.designation?.current || '', fromYear: new Date().getFullYear() }] } }))}>+ Add Change</Button>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-sm text-gray-500">Only administrators can edit professional details.</div>
  )

  const StepQualifications = isAdmin ? (
    <div className="space-y-2">
      {(profile.qualifications || []).map((q, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-3">
            <select className="w-full p-2 border rounded" value={q.degree} onChange={(e) => setProfile(p => ({ ...p, qualifications: (p.qualifications||[]).map((r,i)=> i===idx? { ...r, degree: e.target.value } : r) }))}>
              {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="col-span-3">
            <select className="w-full p-2 border rounded" value={q.stream} onChange={(e) => setProfile(p => ({ ...p, qualifications: (p.qualifications||[]).map((r,i)=> i===idx? { ...r, stream: e.target.value } : r) }))}>
              {STREAM_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-3">
            <Input placeholder="Institute" value={q.institute || ''} onChange={(e) => setProfile(p => ({ ...p, qualifications: (p.qualifications||[]).map((r,i)=> i===idx? { ...r, institute: e.target.value } : r) }))} />
          </div>
          <div className="col-span-2">
            <Input type="number" placeholder="Year" value={q.year || ''} onChange={(e) => setProfile(p => ({ ...p, qualifications: (p.qualifications||[]).map((r,i)=> i===idx? { ...r, year: Number(e.target.value) } : r) }))} />
          </div>
          <div className="col-span-1 text-right">
            <Button variant="outline" size="sm" onClick={() => setProfile(p => ({ ...p, qualifications: (p.qualifications||[]).filter((_,i)=> i!==idx) }))}>Remove</Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setProfile(p => ({ ...p, qualifications: [...(p.qualifications||[]), { degree: DEGREE_OPTIONS[0], stream: STREAM_OPTIONS[0] }] }))}>+ Add Qualification</Button>
    </div>
  ) : (
    <div className="text-sm text-gray-500">Only administrators can edit qualifications.</div>
  )

  const StepExperience = isAdmin ? (
    <div className="space-y-2">
      {(profile.experience || []).map((row, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-3"><Input placeholder="Organization" value={row.organization} onChange={(e) => setProfile(p => ({ ...p, experience: (p.experience||[]).map((r,i)=> i===idx? { ...r, organization: e.target.value } : r) }))} /></div>
          <div className="col-span-3"><Input placeholder="Designation" value={row.designation} onChange={(e) => setProfile(p => ({ ...p, experience: (p.experience||[]).map((r,i)=> i===idx? { ...r, designation: e.target.value } : r) }))} /></div>
          <div className="col-span-2"><Input placeholder="Department" value={row.department || ''} onChange={(e) => setProfile(p => ({ ...p, experience: (p.experience||[]).map((r,i)=> i===idx? { ...r, department: e.target.value } : r) }))} /></div>
          <div className="col-span-2"><Input type="number" placeholder="From (YYYY)" value={row.fromYear || ''} onChange={(e) => setProfile(p => ({ ...p, experience: (p.experience||[]).map((r,i)=> i===idx? { ...r, fromYear: Number(e.target.value) } : r) }))} /></div>
          <div className="col-span-1"><Input type="number" placeholder="To" value={row.toYear || ''} onChange={(e) => setProfile(p => ({ ...p, experience: (p.experience||[]).map((r,i)=> i===idx? { ...r, toYear: e.target.value? Number(e.target.value) : undefined } : r) }))} /></div>
          <div className="col-span-1 text-right"><Button variant="outline" size="sm" onClick={() => setProfile(p => ({ ...p, experience: (p.experience||[]).filter((_,i)=> i!==idx) }))}>Remove</Button></div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setProfile(p => ({ ...p, experience: [...(p.experience||[]), { organization: '', designation: '', fromYear: new Date().getFullYear() }] }))}>+ Add Experience</Button>
    </div>
  ) : (
    <div className="text-sm text-gray-500">Only administrators can edit experience.</div>
  )

  const StepReview = (
    <div className="space-y-2 text-sm">
      <div><strong>Name:</strong> {profile.fullName || '-'}</div>
      <div><strong>Department:</strong> {profile.department || '-'}</div>
      <div><strong>Designation:</strong> {profile.designation?.current || '-'}</div>
      <div><strong>Qualifications:</strong> {(profile.qualifications||[]).length} item(s)</div>
      <div><strong>Experience:</strong> {(profile.experience||[]).length} item(s)</div>
    </div>
  )

  const render = () => {
    switch (step) {
      case 0: return StepPersonal
      case 1: return StepProfessional
      case 2: return StepQualifications
      case 3: return StepExperience
      case 4: return StepReview
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Update your personal and professional information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[step].icon, { className: 'w-5 h-5 text-primary-600' })}
            {steps[step].title}
          </CardTitle>
          <CardDescription>Step-by-step guided form</CardDescription>
        </CardHeader>
        <CardContent>
          <Stepper step={step} total={steps.length} />
          <div className="space-y-4">
            {render()}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-2">
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}>
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

