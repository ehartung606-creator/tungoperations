// api/payroll.ts
// Proxies /payroll page requests to the local Mac Pro Flask API
// The Mac Pro must be running payroll_api.py on port 5555
// and have ngrok or Cloudflare tunnel exposing it

import { NextRequest, NextResponse } from 'next/server'

// Set your ngrok/tunnel URL as an environment variable in Vercel
const MAC_API_URL = process.env.MAC_PAYROLL_API_URL || 'http://localhost:5555'
const PAYROLL_PIN = process.env.PAYROLL_PIN || '1234' // set in Vercel env vars

export const config = { runtime: 'edge' }

export default async function handler(req: NextRequest) {
  // Verify PIN from header
  const pin = req.headers.get('x-payroll-pin')
  if (pin !== PAYROLL_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pathname } = new URL(req.url)
  const path = pathname.replace('/api/payroll', '')

  try {
    const res = await fetch(`${MAC_API_URL}/api/payroll${path}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json(
      { error: 'Mac Pro offline or API not running' },
      { status: 503 }
    )
  }
}
