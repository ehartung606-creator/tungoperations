import { useState } from 'react'

const PIN = '1985' // change to your preferred PIN

export default function App() {
  const [input, setInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [shake, setShake] = useState(false)

  const attempt = (val: string) => {
    if (val === PIN) {
      setUnlocked(true)
    } else if (val.length === PIN.length) {
      setShake(true)
      setTimeout(() => { setShake(false); setInput('') }, 600)
    }
  }

  const press = (d: string) => {
    const next = input + d
    setInput(next)
    attempt(next)
  }

  if (!unlocked) return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ color: '#444', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>
          Tung Operations
        </div>
        <div style={{
          display: 'flex', gap: 12,
          animation: shake ? 'shake 0.5s ease' : 'none',
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              background: input.length > i ? '#bc6c25' : '#222',
              border: '1px solid #333', transition: 'background 0.15s',
            }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button key={i} onClick={() => {
              if (d === '⌫') setInput(p => p.slice(0, -1))
              else if (d !== '') press(d)
            }} style={{
              width: 64, height: 64,
              background: d === '' ? 'transparent' : '#111',
              border: d === '' ? 'none' : '1px solid #222',
              borderRadius: 10, color: '#bc6c25',
              fontSize: d === '⌫' ? 18 : 22,
              fontFamily: 'Georgia, serif',
              cursor: d === '' ? 'default' : 'pointer',
              transition: 'background 0.1s',
            }}>
              {d}
            </button>
          ))}
        </div>
        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0) }
            20% { transform: translateX(-8px) }
            40% { transform: translateX(8px) }
            60% { transform: translateX(-8px) }
            80% { transform: translateX(8px) }
          }
        `}</style>
      </div>
    </div>
  )

  const tools = [
    { href: '/payroll',   emoji: '📊', label: 'Payroll Dashboard', color: '#bc6c25' },
    { href: '/inventory', emoji: '📦', label: 'Inventory System',  color: '#aa3bff' },
    { href: '/mule',      emoji: '🍺', label: 'Mule Bonus %',      color: '#9b59b6' },
    { href: '/demo',      emoji: '🧪', label: 'Demo Lab',          color: '#22c55e' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <div style={{ color: '#444', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
          Tung Operations
        </div>
        {tools.map(t => (
          <a key={t.href} href={t.href} style={{
            display: 'block', padding: '20px 40px', minWidth: 260, textAlign: 'center',
            background: '#111', border: `1px solid ${t.color}33`,
            borderRadius: 12, color: t.color,
            textDecoration: 'none', fontSize: 16, fontWeight: 600, letterSpacing: 1,
          }}>
            {t.emoji} {t.label}
          </a>
        ))}
      </div>
    </div>
  )
}
