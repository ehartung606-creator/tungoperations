import { useState, useEffect, useRef } from 'react'

const PIN = import.meta.env.VITE_PAYROLL_PIN || '1234'
const COPPER = '#bc6c25'
const DARK   = '#080808'

type JobStatus = {
  running: boolean
  last_run: string | null
  last_result: string | null
}

type Status = {
  mule: JobStatus
  log: string
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

export default function MuleBonus() {
  const [pin, setPin]           = useState('')
  const [authed, setAuthed]     = useState(false)
  const [pinError, setPinError] = useState(false)
  const [status, setStatus]     = useState<Status | null>(null)
  const [macOnline, setMacOnline] = useState<boolean | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  const MAC_URL = import.meta.env.VITE_MAC_API_URL || ''

  const checkStatus = async () => {
    try {
      const res = await fetch(`${MAC_URL}/api/payroll/status`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setStatus(data)
      setMacOnline(true)
    } catch {
      setMacOnline(false)
    }
  }

  useEffect(() => {
    if (!authed) return
    checkStatus()
    const interval = setInterval(checkStatus, 4000)
    return () => clearInterval(interval)
  }, [authed])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [status?.log])

  const handlePin = () => {
    if (pin === PIN) { setAuthed(true); setPinError(false) }
    else { setPinError(true); setPin('') }
  }

  const runMuleBonus = async () => {
    await fetch(`${MAC_URL}/api/payroll/run-mule-bonus`, { method: 'POST' })
    setTimeout(checkStatus, 500)
  }

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', background: DARK, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Georgia", serif'
      }}>
        <div style={{
          background: '#111', border: `1px solid ${COPPER}33`,
          borderRadius: 16, padding: '48px 40px', width: 340,
          display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center'
        }}>
          <img
            src="https://i.postimg.cc/wvvKTCP2/Copper-Cup-logo.png"
            alt="Copper Cup"
            style={{ width: 80, marginBottom: 8 }}
          />
          <div style={{ color: '#888', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>
            Mule Bonus Access
          </div>
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePin()}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 8,
              background: '#1a1a1a', border: `1px solid ${pinError ? '#c0392b' : '#333'}`,
              color: '#fff', fontSize: 20, textAlign: 'center', letterSpacing: 8,
              outline: 'none', boxSizing: 'border-box'
            }}
          />
          {pinError && <div style={{ color: '#c0392b', fontSize: 13 }}>Incorrect PIN</div>}
          <button
            onClick={handlePin}
            style={{
              width: '100%', padding: '14px', borderRadius: 8,
              background: COPPER, color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              letterSpacing: 1, textTransform: 'uppercase'
            }}
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  const muleRunning = status?.mule.running

  return (
    <div style={{
      minHeight: '100vh', background: DARK, color: '#fff',
      fontFamily: '"Georgia", serif', padding: '40px 24px',
      maxWidth: 680, margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <img
          src="https://i.postimg.cc/wvvKTCP2/Copper-Cup-logo.png"
          alt="Copper Cup"
          style={{ width: 48 }}
        />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COPPER }}>
            Mule Bonus %
          </div>
          <div style={{ fontSize: 12, color: '#555', letterSpacing: 2, textTransform: 'uppercase' }}>
            The Copper Cup
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: macOnline === null ? '#555' : macOnline ? '#2ecc71' : '#c0392b'
          }} />
          <span style={{ fontSize: 12, color: '#555' }}>
            {macOnline === null ? 'Checking...' : macOnline ? 'Mac Pro Online' : 'Mac Pro Offline'}
          </span>
        </div>
      </div>

      {macOnline === false && (
        <div style={{
          background: '#1a0a0a', border: '1px solid #c0392b33',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          color: '#c0392b', fontSize: 14
        }}>
          ⚠️ Mac Pro is offline or the API isn't running. Make sure <code>payroll_api.py</code> is running.
        </div>
      )}

      {/* Run button */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={runMuleBonus}
          disabled={muleRunning || !macOnline}
          style={{
            width: '100%', padding: '32px 24px', borderRadius: 14,
            background: muleRunning ? '#1a1a1a' : '#1a1a2a',
            border: `2px solid ${muleRunning ? '#9b59b6' : '#9b59b655'}`,
            color: muleRunning ? '#9b59b6' : '#fff',
            cursor: muleRunning || !macOnline ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column', gap: 10,
            alignItems: 'flex-start', transition: 'all 0.2s',
            opacity: !macOnline ? 0.4 : 1
          }}
        >
          <span style={{ fontSize: 32 }}>{muleRunning ? '⏳' : '🍺'}</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            {muleRunning ? 'Running...' : 'Run Mule Bonus'}
          </span>
          <span style={{ fontSize: 13, color: '#888', textAlign: 'left' }}>
            {muleRunning
              ? 'Scraping sales data from Blogic...'
              : 'Scrape Blogic sales data and update Mule Bonus % spreadsheet'}
          </span>
          {status?.mule.last_run && (
            <span style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
              Last run: {fmt(status.mule.last_run)}
            </span>
          )}
        </button>
      </div>

      {/* Last result */}
      {status?.mule.last_result && (
        <div style={{
          background: '#111', borderRadius: 12, padding: '16px 20px',
          marginBottom: 24
        }}>
          <div style={{ fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: status.mule.last_result === 'success' ? '#9b59b6' : '#c0392b' }}>
              {status.mule.last_result === 'success' ? '✓' : '✗'}
            </span>
            <span style={{ color: '#888' }}>Last result:</span>
            <span style={{ color: status.mule.last_result === 'success' ? '#9b59b6' : '#c0392b' }}>
              {status.mule.last_result === 'success' ? 'Spreadsheet updated successfully' : status.mule.last_result}
            </span>
          </div>
        </div>
      )}

      {/* Live log */}
      {status?.log && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            Live Log
          </div>
          <pre
            ref={logRef}
            style={{
              background: '#0d0d0d', border: '1px solid #222',
              borderRadius: 10, padding: '16px', fontSize: 11,
              color: '#9b59b6', fontFamily: 'monospace', lineHeight: 1.6,
              maxHeight: 280, overflowY: 'auto', margin: 0,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}
          >
            {status.log}
          </pre>
        </div>
      )}

      <div style={{
        borderTop: '1px solid #1a1a1a', paddingTop: 20,
        fontSize: 12, color: '#444'
      }}>
        Polls every 4s · Updates Mule Bonus %.xlsx on OneDrive
      </div>
    </div>
  )
}
