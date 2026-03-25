import { useState } from 'react'

export default function App() {
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
