import { useState, useEffect, useRef } from 'react'

const PIN = import.meta.env.VITE_PAYROLL_PIN || '1855'

const COPPER = '#bc6c25'
const MAC_URL = import.meta.env.VITE_MAC_API_URL || 'https://api.tungoperations.com'
const DARK   = '#080808'

type JobStatus = {
  running: boolean
  last_run: string | null
  last_result: string | null
}

type Status = {
  payroll: JobStatus
  texts: JobStatus
  log: string
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

export default function Payroll() {
  const [pin, setPin]         = useState('')
  const [authed, setAuthed]   = useState(false)
  const [pinError, setPinError] = useState(false)
  const [status, setStatus]   = useState<Status | null>(null)
  const [macOnline, setMacOnline] = useState<boolean | null>(null)
  const logRef = useRef<HTMLPreElement>(null)

  const headers = { 'x-payroll-pin': PIN }

  const checkStatus = async () => {
    try {
      const res = await fetch(`${MAC_URL}/api/payroll/status`, { headers })
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
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [status?.log])

  const handlePin = () => {
    if (pin === PIN) { setAuthed(true); setPinError(false) }
    else { setPinError(true); setPin('') }
  }

  const runPayroll = async () => {
    await fetch(`${MAC_URL}/api/payroll/run`, { method: 'POST', headers })
    setTimeout(checkStatus, 500)
  }

  const sendTexts = async () => {
    await fetch(`${MAC_URL}/api/payroll/send-texts`, { method: 'POST', headers })
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
            Payroll Access
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
          {pinError && (
            <div style={{ color: '#c0392b', fontSize: 13 }}>Incorrect PIN</div>
          )}
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

  const payrollRunning = status?.payroll.running
  const textsRunning   = status?.texts.running

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
            Payroll Dashboard
          </div>
          <div style={{ fontSize: 12, color: '#555', letterSpacing: 2, textTransform: 'uppercase' }}>
            The Copper Cup
          </div>
        </div>
        {/* Mac status dot */}
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
          ⚠️ Mac Pro is offline or the payroll API isn't running. Make sure the Mac Pro is on and <code>payroll_api.py</code> is running.
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {/* Run Payroll */}
        <button
          onClick={runPayroll}
          disabled={payrollRunning || textsRunning || !macOnline}
          style={{
            padding: '28px 20px', borderRadius: 14,
            background: payrollRunning ? '#1a1a1a' : `${COPPER}22`,
            border: `2px solid ${payrollRunning ? COPPER : `${COPPER}55`}`,
            color: payrollRunning ? COPPER : '#fff',
            cursor: payrollRunning || !macOnline ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column', gap: 8,
            alignItems: 'flex-start', transition: 'all 0.2s',
            opacity: !macOnline ? 0.4 : 1
          }}
        >
          <span style={{ fontSize: 28 }}>{payrollRunning ? '⏳' : '📊'}</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            {payrollRunning ? 'Running...' : 'Run Payroll'}
          </span>
          <span style={{ fontSize: 12, color: '#888', textAlign: 'left' }}>
            {payrollRunning
              ? 'Scraping Blogic — this takes a few minutes'
              : 'Scrape Blogic & fill spreadsheet'}
          </span>
          {status?.payroll.last_run && (
            <span style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
              Last run: {fmt(status.payroll.last_run)}
            </span>
          )}
        </button>

        {/* Send to Staff */}
        <button
          onClick={sendTexts}
          disabled={payrollRunning || textsRunning || !macOnline}
          style={{
            padding: '28px 20px', borderRadius: 14,
            background: textsRunning ? '#1a1a1a' : '#1a2a1a',
            border: `2px solid ${textsRunning ? '#2ecc71' : '#2ecc7155'}`,
            color: textsRunning ? '#2ecc71' : '#fff',
            cursor: textsRunning || payrollRunning || !macOnline ? 'not-allowed' : 'pointer',
            display: 'flex', flexDirection: 'column', gap: 8,
            alignItems: 'flex-start', transition: 'all 0.2s',
            opacity: !macOnline ? 0.4 : 1
          }}
        >
          <span style={{ fontSize: 28 }}>{textsRunning ? '📤' : '💬'}</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            {textsRunning ? 'Sending...' : 'Send to Staff'}
          </span>
          <span style={{ fontSize: 12, color: '#888', textAlign: 'left' }}>
            {textsRunning
              ? 'Texting employees via iMessage'
              : 'Text pay summary to each employee'}
          </span>
          {status?.texts.last_run && (
            <span style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
              Last sent: {fmt(status.texts.last_run)}
            </span>
          )}
        </button>
      </div>

      {/* Last results */}
      {(status?.payroll.last_result || status?.texts.last_result) && (
        <div style={{
          background: '#111', borderRadius: 12, padding: '16px 20px',
          marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10
        }}>
          {status?.payroll.last_result && (
            <div style={{ fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{
                color: status.payroll.last_result === 'success' ? '#2ecc71' : '#c0392b'
              }}>
                {status.payroll.last_result === 'success' ? '✓' : '✗'}
              </span>
              <span style={{ color: '#888' }}>Payroll:</span>
              <span style={{ color: status.payroll.last_result === 'success' ? '#2ecc71' : '#c0392b' }}>
                {status.payroll.last_result === 'success' ? 'Completed successfully' : status.payroll.last_result}
              </span>
            </div>
          )}
          {status?.texts.last_result && (
            <div style={{ fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{
                color: status.texts.last_result === 'success' ? '#2ecc71' : '#c0392b'
              }}>
                {status.texts.last_result === 'success' ? '✓' : '✗'}
              </span>
              <span style={{ color: '#888' }}>Texts:</span>
              <span style={{ color: status.texts.last_result === 'success' ? '#2ecc71' : '#c0392b' }}>
                {status.texts.last_result === 'success' ? 'Sent to all employees' : status.texts.last_result}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Live log */}
      {status?.log && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11, color: '#555', letterSpacing: 2,
            textTransform: 'uppercase', marginBottom: 8
          }}>
            Live Log
          </div>
          <pre
            ref={logRef}
            style={{
              background: '#0d0d0d', border: '1px solid #222',
              borderRadius: 10, padding: '16px', fontSize: 11,
              color: '#4a9', fontFamily: 'monospace', lineHeight: 1.6,
              maxHeight: 280, overflowY: 'auto', margin: 0,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}
          >
            {status.log}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #1a1a1a', paddingTop: 20,
        fontSize: 12, color: '#444', display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Fred: fred@cpadesmoines.com</span>
        <span>Polls every 4s</span>
      </div>
    </div>
  )
}
