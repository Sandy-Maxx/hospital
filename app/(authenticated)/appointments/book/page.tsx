'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function BookAppointmentRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patientId')

  useEffect(() => {
    // Redirect to the new session-based booking form
    const redirectUrl = patientId 
      ? `/book-appointment?patientId=${patientId}`
      : '/book-appointment'
    
    router.replace(redirectUrl)
  }, [router, patientId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Redirecting to New Booking System</CardTitle>
          <CardDescription>
            We've updated our appointment booking system. You're being redirected to the new session-based booking form.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 mb-4">
            If you're not redirected automatically,{' '}
            <Link href="/book-appointment" className="text-blue-600 hover:underline">
              click here
            </Link>
          </p>
          <Link href="/appointments" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Appointments
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
