export const config = { runtime: 'edge' }

const PAYROLL_PIN = process.env.PAYROLL_PIN || '1855'

export default async function handler(req: Request) {
  const MAC_API_URL = process.env.MAC_PAYROLL_API_URL || ''

  // Verify PIN from header
  const pin = req.headers.get('x-payroll-pin')
  if (pin !== PAYROLL_PIN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/api/payroll', '')

  try {
    const res = await fetch(`${MAC_API_URL}/api/payroll${path}`, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Mac Pro offline or API not running' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
