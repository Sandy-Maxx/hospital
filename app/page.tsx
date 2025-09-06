'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, Users, Calendar, FileText, Shield, Phone, Mail, MapPin, Heart, Eye, Target, Plus, X } from 'lucide-react'
import Link from 'next/link'

interface HospitalSettings {
  name: string
  tagline: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  phone: string
  email: string
  address: string
  vision: string
  mission: string
  socialMedia: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showFloatingCTA, setShowFloatingCTA] = useState(true)
  const [settings, setSettings] = useState<HospitalSettings>({
    name: 'MediCare Hospital',
    tagline: 'Your Health, Our Priority',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    phone: '+1 (555) 123-4567',
    email: 'info@medicare.com',
    address: '123 Health Street, Medical City, MC 12345',
    vision: 'To be the leading healthcare provider, delivering exceptional medical care with compassion and innovation.',
    mission: 'We are committed to providing comprehensive, patient-centered healthcare services that promote healing, wellness, and quality of life for our community.',
    socialMedia: {
      facebook: '#',
      twitter: '#',
      instagram: '#',
      linkedin: '#'
    }
  })

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  useEffect(() => {
    // Load hospital settings from API or localStorage
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/hospital')
        if (response.ok) {
          const data = await response.json()
          setSettings(prev => ({ ...prev, ...data }))
        }
      } catch (error) {
        console.log('Using default settings')
      }
    }
    loadSettings()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: settings.logo ? 'transparent' : settings.primaryColor }}
              >
                {settings.logo ? (
                  <img 
                    src={settings.logo} 
                    alt={`${settings.name} Logo`} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Stethoscope className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{settings.name}</h1>
                <p className="text-sm text-gray-600">{settings.tagline}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/auth/signin">Staff Login</Link>
              </Button>
              <Button asChild style={{ backgroundColor: settings.primaryColor }}>
                <Link href="/book-appointment">Book Appointment</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span style={{ color: settings.primaryColor }}>{settings.name}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {settings.tagline} - Experience world-class healthcare with our state-of-the-art facilities and expert medical professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild style={{ backgroundColor: settings.primaryColor }}>
              <Link href="/book-appointment">Book Appointment</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/services">Our Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-lg text-gray-600">Comprehensive healthcare services with modern technology</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 mx-auto rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Expert Doctors</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Highly qualified and experienced medical professionals dedicated to your health.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 mx-auto rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Easy Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Book appointments online with our convenient scheduling system.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 mx-auto rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Digital Records</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Secure digital health records accessible anytime, anywhere.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 mx-auto rounded-lg bg-red-100 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>24/7 Emergency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Round-the-clock emergency services for urgent medical needs.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Eye className="w-6 h-6" style={{ color: settings.primaryColor }} />
                  <CardTitle>Our Vision</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{settings.vision}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Target className="w-6 h-6" style={{ color: settings.primaryColor }} />
                  <CardTitle>Our Mission</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{settings.mission}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-lg text-gray-600">We're here to help you with all your healthcare needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Phone className="w-8 h-8 mx-auto mb-4" style={{ color: settings.primaryColor }} />
                <CardTitle>Phone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{settings.phone}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Mail className="w-8 h-8 mx-auto mb-4" style={{ color: settings.primaryColor }} />
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{settings.email}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <MapPin className="w-8 h-8 mx-auto mb-4" style={{ color: settings.primaryColor }} />
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{settings.address}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: settings.logo ? 'transparent' : settings.primaryColor }}
                >
                  {settings.logo ? (
                    <img 
                      src={settings.logo} 
                      alt={`${settings.name} Logo`} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Stethoscope className="w-5 h-5 text-white" />
                  )}
                </div>
                <h3 className="text-lg font-semibold">{settings.name}</h3>
              </div>
              <p className="text-gray-400">{settings.tagline}</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/services" className="hover:text-white">Services</Link></li>
                <li><Link href="/doctors" className="hover:text-white">Doctors</Link></li>
                <li><Link href="/book-appointment" className="hover:text-white">Book Appointment</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Emergency Care</li>
                <li>General Medicine</li>
                <li>Specialist Consultations</li>
                <li>Diagnostic Services</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <p>{settings.phone}</p>
                <p>{settings.email}</p>
                <p>{settings.address}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {settings.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating CTA Button */}
      {showFloatingCTA && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative">
            <Button
              size="lg"
              className="rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 animate-pulse"
              style={{ backgroundColor: settings.primaryColor }}
              asChild
            >
              <Link href="/book-appointment" className="flex items-center px-6 py-4">
                <Calendar className="w-5 h-5 mr-2" />
                Book Now
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-600 hover:bg-gray-700 text-white p-0"
              onClick={() => setShowFloatingCTA(false)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
