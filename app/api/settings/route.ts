import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const settingsPath = path.join(process.cwd(), 'data', 'hospital-settings.json')
    const settingsData = fs.readFileSync(settingsPath, 'utf8')
    const json = JSON.parse(settingsData)
    return NextResponse.json(json)
  } catch (e) {
    return NextResponse.json({}, { status: 200 })
  }
}
