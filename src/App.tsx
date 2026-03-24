import { useState } from 'react'

const PIN = '1985'
const COPPER = '#bc6c25'
const DARK = '#080808'

export default function App() {
  const [input, setInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (input === PIN) {
        setUnlocked(true)
        setError(false)
      } else {
        setError(true)
        setInput('')
      }
    }
  }

  if (!unlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: DARK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ color: '#444', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
            Tung Operations
          </div>
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            onKeyDown={handleKey}
            autoFocus
            style={{
              background: '#111',
              border: `1px solid ${error ? '#c0392b' : '#333'}`,
              borderRadius: 8,
              color: '#fff',
              fontSize: 20,
              padding: '12px 24px',
              textAlign: 'center',
              outline: 'none',
              width: 160,
              letterSpacing: 8,
            }}
          />
          {error && <div style={{ color: '#c0392b', fontSize: 12, letterSpacing: 1 }}>INCORRECT PIN</div>}
        </div>
      </div>
    )
  }

  const tools = [
    { emoji: '📊', label: 'Payroll Dashboard', href: '/payroll' },
    { emoji: '📦', label: 'Inventory System', href: '/inventory' },
    { emoji: '🍺', label: 'Mule Bonus %', href: '/mule' },
    { emoji: '🍽️', label: 'MenuForge', href: '/menuforge' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: DARK,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'center',
      }}>
        <div style={{ color: '#444', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
          Tung Operations
        </div>
        {tools.map(t => (
          <a key={t.href} href={t.href} style={{
            display: 'block',
            padding: '20px 40px',
            background: '#111',
            border: `1px solid ${COPPER}33`,
            borderRadius: 12,
            color: COPPER,
            textDecoration: 'none',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 1,
            width: 280,
            textAlign: 'center',
          }}>
            {t.emoji} {t.label}
          </a>
        ))}
      </div>
    </div>
  )
}
