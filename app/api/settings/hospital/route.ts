import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// Default hospital settings
const defaultSettings = {
  name: 'MediCare Hospital',
  tagline: 'Your Health, Our Priority',
  logo: '',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  phone: '+1 (555) 123-4567',
  email: 'info@medicare.com',
  address: '123 Health Street, Medical City, MC 12345',
  vision: 'To be the leading healthcare provider, delivering exceptional medical care with compassion and innovation.',
  mission: 'We are committed to providing comprehensive, patient-centered healthcare services that promote healing, wellness, and quality of life for our community.',
  
  // Appointment Settings
  tokenPrefix: 'T',
  sessionPrefix: 'S',
  defaultSessionDuration: 240, // 4 hours in minutes
  maxTokensPerSession: 50,
  allowPublicBooking: true,
  requirePatientDetails: true,
  autoAssignTokens: true,
  enableCarryForward: true,
  
  // Business Hours
  businessStartTime: '09:00',
  businessEndTime: '17:00',
  lunchBreakStart: '13:00',
  lunchBreakEnd: '14:00',
  
  // Session Templates
  sessionTemplates: [
    { id: '1', name: 'Morning', shortCode: 'S1', startTime: '09:00', endTime: '13:00', maxTokens: 50, isActive: true },
    { id: '2', name: 'Afternoon', shortCode: 'S2', startTime: '14:00', endTime: '17:00', maxTokens: 40, isActive: true },
    { id: '3', name: 'Evening', shortCode: 'S3', startTime: '17:00', endTime: '20:00', maxTokens: 30, isActive: false }
  ],
  
  socialMedia: {
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: ''
  }
}

// Path to store settings file
const settingsPath = path.join(process.cwd(), 'data', 'hospital-settings.json')

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load settings from file
function loadSettings() {
  try {
    ensureDataDir()
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8')
      return { ...defaultSettings, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  return defaultSettings
}

// Save settings to file
function saveSettings(settings: any) {
  try {
    ensureDataDir()
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error('Error saving settings:', error)
    return false
  }
}

export async function GET() {
  try {
    const settings = loadSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching hospital settings:', error)
    return NextResponse.json(defaultSettings)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Load current settings and merge with new data
    const currentSettings = loadSettings()
    const updatedSettings = { ...currentSettings, ...data }
    
    // Save to file
    const saved = saveSettings(updatedSettings)
    
    if (!saved) {
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }
    
    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating hospital settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
