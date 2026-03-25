import { useState } from 'react'

const DEMO_PIN = '1800'

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const attempt = (val: string) => {
    if (val === DEMO_PIN) { onUnlock() }
    else if (val.length === DEMO_PIN.length) { setShake(true); setTimeout(() => { setShake(false); setInput('') }, 600) }
  }
  const press = (d: string) => { const next = input + d; setInput(next); attempt(next) }
  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia, ser      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28 }}>
        <div style={{ color:'#22c55e', fontSize:11, letterSpacing:'0.4em', textTransform:'uppercase' as const }}>Demo Lab</div>
        <div style={{ display:'flex', gap:14, animation: shake ? 'shake 0.5s ease' : 'none' }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width:12, height:12, borderRadius:'50%', background: input.length > i ? '#22c55e' : '#1a1a1a', border:'1px solid #333', transition:'background 0.15s' }} />)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {['1','2','3','4','5','6','7','8','9','','0','\u232b'].map((d,i) => (
            <button key={i} onClick={() => { if (d==='\u232b') setInput(p=>p.slice(0,-1)); else if(d) press(d) }} style={{ width:68, height:68, background: d ? '#111' : 'transparent', border: d ? '1px solid #222' : 'none', borderRadius:10, color:'#e2e2e8', fontSize: d==='\u232b' ? 18 : 22, fontFamily:'inherit', cursor: d ? 'pointer' : 'default' }}>{d}</button>
          ))}
        </div>
        <style>{'@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}'}</style>
      </div>
    </div>
  )
}

export default function Demo() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />

  const demos = [
    { id:'inventory', href:'/demo/inventory', title:'Inventory System',   description:'Scanner-driven bottle tracking for bars. Alias barcodes, live sync across devices, automatic order summaries.', color:'#aa3bff', status:'live' },
    { id:'staff',     href:'/demo/staff',     title:'Staff App',          description:'PIN-based staff portal with shift checklists, notifications inbox, schedule viewer, and cash management.',         color:'#bc6c25', status:'live' },
    { id:'social',    href:'',                title:'Social Media Engine', description:'AI-powered content generation using real bar photos, weekly specials, and national day hooks. Integrated with Publer.', color:'#22c55e', status:'live' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#080808', fontFamily:'Georgia, serif', color:'#e2e2e8' }}>
      <div style={{ borderBottom:'1px solid #161616', padding:'24px 40px', display:'flex', alignItems:'center', gap:16 }}>
        <a href="/" style={{ color:'#444', fontSize:11, letterSpacing:4, textTransform:'uppercase', textDecoration:'none' }}>← Tung Operations</a>
        <span style={{ color:'#222' }}>|</span>
        <span style={{ color:'#bc6c25', fontSize:11, letterSpacing:4, textTransform:'uppercase' }}>Demo Lab</span>
      </div>
      <div style={{ padding:'64px 40px 48px', maxWidth:900, margin:'0 auto' }}>
        <div style={{ fontSize:11, color:'#444', letterSpacing:6, textTransform:'uppercase', marginBottom:16 }}>Tung Operations</div>
        <h1 style={{ fontSize:42, fontWeight:400, mgin:'0 0 16px', lineHeight:1.15 }}>Demo Lab</h1>
        <p style={{ fontSize:15, color:'#555', lineHeight:1.7, margin:0, maxWidth:520 }}>A collection of AI-assisted tools built for The Copper Cup and beyond. Each demo is a working prototype you can interact with.</p>
      </div>
      <div style={{ padding:'0 40px 80px', maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:20 }}>
        {demos.map(d => (
          <div key={d.id} style={{ background:'#0f0f12', border:`1px solid ${d.color}22`, borderRadius:16, padding:'32px 28px', display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:'#e2e2e8', marginBottom:8 }}>{d.title}</div>
              <div style={{ fontSize:13, color:'#555', lineHeight:1.65 }}>{d.description}</div>
            </div>
            <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:10, letterSpacing:3, textTransform:'uppercase', color:d.color }}>● {d.status}</span>
              {d.href
                ? <a href={d.href} style={{ fontSize:11, color:d.color, letterSpacing:2, textTransform:'uppercase', textDecoration:'none', fontWeight:700 }}>View Demo →</a>
                : <span style={{ fontSize:11, color:'#333', letterSpacing:2, textTransform:'uppercase' }}>Coming soon →</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
