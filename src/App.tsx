import { useState } from 'react'

const PIN = '1985'

export default function App() {
  const [input, setInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [shake, setShake] = useState(false)

  const attempt = (val: string) => {
    if (val === PIN) { setUnlocked(true) }
    else if (val.length === PIN.length) { setShake(true); setTimeout(() => { setShake(false); setInput('') }, 600) }
  }

  const press = (d: string) => { const next = input + d; setInput(next); attempt(next) }

  if (!unlocked) return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia, serif' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28 }}>
        <div style={{ color:'#333', fontSize:13, letterSpacing:6, textTransform:'uppercase' }}>Tung Operations</div>
        <div style={{ display:'flex', gap:14, animation: shake ? 'shake 0.5s ease' : 'none' }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: input.length > i ? '#fff' : '#1a1a1a', border:'1px solid #333', transition:'background 0.15s' }} />)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button key={i} onClick={() => { if (d === '⌫') setInput(p => p.slice(0,-1)); else if (d) press(d) }} style={{ width:72, height:72, background: d ? '#0f0f0f' : 'transparent', border: d ? '1px solid #1e1e1e' : 'none', borderRadius:12, color:'#fff', fontSize: d === '⌫' ? 18 : 24, fontFamily:'Georgia, serif', cursor: d ? 'pointer' : 'default' }}>{d}</button>
          ))}
        </div>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}`le>
      </div>
    </div>
  )

  const tools = [
    { href:'/payroll',        label:'Payroll Dashboard' },
    { href:'/inventory',      label:'Inventory System'  },
    { href:'/mule',           label:'Mule Bonus %'      },
    { href:'/menuforge.html', label:'MenuForge'         },
    { href:'/demo',           label:'Demo Lab'          },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia, serif' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, width:'100%', maxWidth:540, padding:'0 24px' }}>
        <div style={{ color:'#fff', fontSize:28, fontWeight:400, letterSpacing:10, textTransform:'uppercase', marginBottom:16 }}>Tung Operations</div>
        {tools.map(t => (
          <a key={t.href} href={t.href} style={{ display:'block', width:'100%', padding:'28px 40px', background:'#0f0f0f', border:'1px solid #1e1e1e', borderRadius:14, color:'#fff', textDecoration:'none', fontSize:18, fontWeight:500, letterSpacing:2, textAlign:'center' }}>{t.label}</a>
        ))}
      </div>
    </div>
  )
}
