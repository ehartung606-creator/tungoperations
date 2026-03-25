import React, { useState, useEffect, useRef, useCallback } from 'react'
const INV_PIN = '5252'

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const attempt = (val: string) => {
    if (val === INV_PIN) { onUnlock() }
    else if (val.length === INV_PIN.length) { setShake(true); setTimeout(() => { setShake(false); setInput('') }, 600) }
  }
  const press = (d: string) => { const next = input + d; setInput(next); attempt(next) }
  return (
    <div style={{ minHeight:'100vh', background:'#0d0d0f', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'IBM Plex Mono', monospace" }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28 }}>
        <div style={{ color:'#aa3bff', fontSize:11, letterSpacing:'0.4em', textTransform:'uppercase' as const }}>Inventory System</div>
        <div style={{ display:'flex', gap:14, animation: shake ? 'shake 0.5s ease' : 'none' }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width:12, height:12, borderRadius:'50%', background: input.length > i ? '#aa3bff' : '#1a1a20', border:'1px solid #333', transition:'background 0.15s' }} />)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {['1','2','3','4','5','6','7','8','9','','0','\u232b'].map((d,i) => (
            <button key={i} onClick={() => { if (d==='\u232b') setInput(p=>p.slice(0,-1)); else if(d) press(d) }} style={{ width:68, height:68, background: d ? '#111115' : 'transparent', border: d ? '1px solid #222' : 'none', borderRadius:10, color: d==='\u232b' ? '#555' : '#e2e2e8', fontSize: d==='\u232b' ? 18 : 22, fontFamily:'inherit', cursor: d ? 'pointer' : 'default' }}>{d}</button>
          ))}
        </div>
        <style>{'@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}'}</style>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface Product {
  id: string
  name: string
  barcodes: string[]   // [0] primary, rest are size/SKU aliases (e.g. 750ml + 1L)
  par: number
  onHand: number
  category: string
  abdCost: number
  active: boolean
}

// Cost with 4% distributor fee
const bestCost = (p: Product) => p.abdCost * 1.04

interface Movement {
  id: string
  timestamp: number
  barcode: string
  productId: string
  productName: string
  direction: 'OUT' | 'IN'
  qty: number
  onHandAfter: number
}

type ScanStatus = 'ready' | 'scanned' | 'notfound' | 'qr_rejected' | 'inactive' | 'error'
type Tab = 'scan' | 'products' | 'movements' | 'settings'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const LS_PRODUCTS  = 'cc_inv_products_v2'
const LS_MOVEMENTS = 'cc_inv_movements_v2'

// Accept only 6–14 digit numeric codes (UPC-E, UPC-A, EAN-8, EAN-13, ITF-14)
// Rejects QR codes, URLs, alphanumeric codes
const isValidBarcode = (code: string) => /^\d{6,14}$/.test(code.trim())

const CATEGORIES = ['Vodka', 'Whiskey', 'Rum', 'Tequila', 'Gin', 'Liqueur', 'Mixer', 'Other']

// ─────────────────────────────────────────────
// DEFAULT PRODUCTS — pre-loaded from Copper Cup
// ─────────────────────────────────────────────

const DEFAULT_PRODUCTS: Product[] = [
  // ── VODKA ──────────────────────────────────────────────────────────────
  { id:'p001', name:'Absolut Mandrin',       barcodes:['835229002401'],             par:2,  onHand:2,  category:'Vodka',   abdCost:22.49,  active:true },
  { id:'p002', name:'Absolut Citron',        barcodes:['835229001404'],             par:3,  onHand:3,  category:'Vodka',   abdCost:22.49,  active:true },
  { id:'p003', name:'Absolut Pear',          barcodes:['835229001336'],             par:4,  onHand:4,  category:'Vodka',   abdCost:14.99,  active:true },
  { id:'p004', name:'Absolut Mango',         barcodes:['835229001428'],             par:3,  onHand:3,  category:'Vodka',   abdCost:24.74,  active:true },
  { id:'p005', name:'Grey Goose',            barcodes:['080480280017'],             par:1,  onHand:1,  category:'Vodka',   abdCost:28.50,  active:true },
  { id:'p006', name:'New Amsterdam Red',     barcodes:['085000020326'],             par:2,  onHand:2,  category:'Vodka',   abdCost:12.00,  active:true },
  { id:'p007', name:'Ciroc Red Berry',       barcodes:['088076175051'],             par:4,  onHand:4,  category:'Vodka',   abdCost:34.13,  active:true },
  { id:'p008', name:'Ciroc Peach',           barcodes:['088076177406'],             par:3,  onHand:3,  category:'Vodka',   abdCost:24.74,  active:true },
  { id:'p009', name:'Smirnoff',              barcodes:['082000000051'],             par:4,  onHand:4,  category:'Vodka',   abdCost:13.88,  active:true },
  { id:'p010', name:'Smirnoff Raspberry',    barcodes:['082000003977'],             par:3,  onHand:3,  category:'Vodka',   abdCost:13.88,  active:true },
  { id:'p011', name:'Smirnoff Vanilla',      barcodes:['082000004028'],             par:2,  onHand:2,  category:'Vodka',   abdCost:13.88,  active:true },
  { id:'p012', name:'Smirnoff Blueberry',    barcodes:['082000732914'],             par:2,  onHand:2,  category:'Vodka',   abdCost:12.38,  active:true },
  { id:'p013', name:'Smirnoff Pineapple',    barcodes:['096749005208'],             par:2,  onHand:2,  category:'Vodka',   abdCost:12.38,  active:true },
  { id:'p014', name:'Smirnoff Cucumber Lime',barcodes:['082000790822'],             par:3,  onHand:3,  category:'Vodka',   abdCost:12.38,  active:true },
  { id:'p015', name:'Smirnoff Watermelon',   barcodes:['082000001171'],             par:3,  onHand:2,  category:'Vodka',   abdCost:12.38,  active:true },
  { id:'p016', name:'Kettle One',            barcodes:['085156610419'],             par:1,  onHand:1,  category:'Vodka',   abdCost:22.74,  active:true },
  { id:'p017', name:'Titos',                 barcodes:['619947000013'],             par:4,  onHand:4,  category:'Vodka',   abdCost:19.76,  active:true },
  { id:'p018', name:'Deep Eddy Grapefruit',  barcodes:['856065002080'],             par:3,  onHand:3,  category:'Vodka',   abdCost:14.25,  active:true },
  { id:'p019', name:'Deep Eddy Orange',      barcodes:['856065002813'],             par:3,  onHand:3,  category:'Vodka',   abdCost:14.25,  active:true },
  { id:'p020', name:'Deep Eddy Sweet Tea',   barcodes:['856065002004'],             par:2,  onHand:2,  category:'Vodka',   abdCost:14.25,  active:true },
  { id:'p021', name:'Deep Eddy Peach',       barcodes:['856065002585'],             par:3,  onHand:3,  category:'Vodka',   abdCost:14.25,  active:true },
  { id:'p022', name:'UV Cake',               barcodes:['087116015371'],             par:2,  onHand:2,  category:'Vodka',   abdCost:11.25,  active:true },
  { id:'p023', name:'UV Grape',              barcodes:['087116014770'],             par:4,  onHand:4,  category:'Vodka',   abdCost:7.50,  active:true },
  { id:'p024', name:'3 Olives Loopy',        barcodes:['811538015035'],             par:10, onHand:10, category:'Vodka',   abdCost:14.94,  active:true },
  { id:'p025', name:'3 Olives Cherry',       barcodes:['811538015479'],             par:3,  onHand:3,  category:'Vodka',   abdCost:14.94,  active:true },
  { id:'p026', name:'3 Olives Grape',        barcodes:['811538015349'],             par:3,  onHand:3,  category:'Vodka',   abdCost:14.94,  active:true },
  { id:'p027', name:'Mr Boston Vodka',       barcodes:['089000012244'],             par:8,  onHand:2,  category:'Vodka',   abdCost:5.25,  active:true },
  // ── WHISKEY / BOURBON ──────────────────────────────────────────────────
  { id:'p028', name:'Jack Daniels',          barcodes:['082184090442'],             par:2,  onHand:3,  category:'Whiskey', abdCost:23.87,  active:true },
  { id:'p029', name:'Jim Beam',              barcodes:['080686001201'],             par:2,  onHand:2,  category:'Whiskey', abdCost:16.50,  active:true },
  { id:'p030', name:'Makers Mark',           barcodes:['085246139424'],                           par:1,  onHand:2,  category:'Whiskey', abdCost:33.75,  active:true },
  { id:'p031', name:'Crown Royal',           barcodes:['087000007246'],             par:3,  onHand:3,  category:'Whiskey', abdCost:26.24,  active:true },
  { id:'p032', name:'Crown Peach',           barcodes:['082000795377'],                           par:2,  onHand:2,  category:'Whiskey', abdCost:26.24,  active:true },
  { id:'p033', name:'Crown Apple',           barcodes:['082000771562'],                           par:2,  onHand:2,  category:'Whiskey', abdCost:26.24,  active:true },
  { id:'p034', name:'Jameson',               barcodes:['080432500118'],                           par:4,  onHand:3,  category:'Whiskey', abdCost:31.47,  active:true },
  { id:'p035', name:'Jameson Orange',        barcodes:['080432117330'],                           par:3,  onHand:2,  category:'Whiskey', abdCost:22.49,  active:true },
  { id:'p036', name:'Seagrams 7',            barcodes:['087000007321'],             par:1,  onHand:1,  category:'Whiskey', abdCost:12.74,  active:true },
  { id:'p037', name:'Canadian Club',         barcodes:['080686821021'],             par:1,  onHand:1,  category:'Whiskey', abdCost:14.57,  active:true },
  { id:'p038', name:'Ten High Whiskey',      barcodes:['080660203034'],                           par:3,  onHand:2,  category:'Whiskey', abdCost:6.60,  active:true },
  { id:'p039', name:'Glenlivet 12yr',        barcodes:['080432400708'],                           par:1,  onHand:1,  category:'Whiskey', abdCost:57.47,  active:true },
  { id:'p040', name:'Red Label',             barcodes:['088100021405'],                           par:1,  onHand:1,  category:'Whiskey', abdCost:26.24,  active:true },
  { id:'p041', name:'Blue Label',            barcodes:['088100070052'],                           par:1,  onHand:1,  category:'Whiskey', abdCost:195.00,  active:true },
  { id:'p042', name:'Dewars White Label',    barcodes:['080480230012'],                           par:1,  onHand:1,  category:'Whiskey', abdCost:26.25,  active:true },
  // ── RUM ────────────────────────────────────────────────────────────────
  { id:'p043', name:'Captain Morgan',        barcodes:['087000002715'],                           par:3,  onHand:3,  category:'Rum',     abdCost:19.49,  active:true },
  { id:'p044', name:'Cruzan Coconut',        barcodes:['080686967712'],                           par:2,  onHand:2,  category:'Rum',     abdCost:10.50,  active:true },
  { id:'p045', name:'Malibu',                barcodes:['089540448978'],                           par:2,  onHand:2,  category:'Rum',     abdCost:17.99,  active:true },
  { id:'p046', name:'Bacardi',               barcodes:['080480015305'],                           par:2,  onHand:3,  category:'Rum',     abdCost:14.25,  active:true },
  { id:'p047', name:'Bacardi Limon',         barcodes:['080480353302'],                           par:2,  onHand:2,  category:'Rum',     abdCost:14.25,  active:true },
  { id:'p048', name:'Bacardi Dragonberry',   barcodes:['080480000264'],                           par:2,  onHand:2,  category:'Rum',     abdCost:14.25,  active:true },
  { id:'p049', name:'Mr Boston Rum',         barcodes:['089000012816'],                           par:3,  onHand:2,  category:'Rum',     abdCost:5.90,  active:true },
  // ── TEQUILA ────────────────────────────────────────────────────────────
  { id:'p050', name:'Jose Cuervo',           barcodes:['811538010801'],                           par:3,  onHand:2,  category:'Tequila', abdCost:21.75,  active:true },
  { id:'p051', name:'Patron',                barcodes:['721733000029'],                           par:3,  onHand:2,  category:'Tequila', abdCost:42.00,  active:true },
  { id:'p052', name:'Don Julio Blanco',      barcodes:['674545000001'],             par:3,  onHand:2,  category:'Tequila', abdCost:46.49,  active:true },
  { id:'p053', name:'Don Julio Rep',         barcodes:['674545000414'],                           par:3,  onHand:2,  category:'Tequila', abdCost:50.24,  active:true },
  { id:'p054', name:'Lalo Blanco',           barcodes:['811041030013'],             par:3,  onHand:2,  category:'Tequila', abdCost:36.00,  active:true },
  { id:'p055', name:'Corralejo Reposado',    barcodes:['720815930131'],                           par:1,  onHand:2,  category:'Tequila', abdCost:25.49,  active:true },
  { id:'p056', name:'Milagro Silver',        barcodes:['083664868919'],                           par:1,  onHand:2,  category:'Tequila', abdCost:25.50,  active:true },
  { id:'p057', name:'Espolon Blanco',        barcodes:['721059707503'],                           par:1,  onHand:2,  category:'Tequila', abdCost:24.00,  active:true },
  { id:'p058', name:'Casamigos Blanco',      barcodes:['856724006114'],                           par:2,  onHand:2,  category:'Tequila', abdCost:50.24,  active:true },
  { id:'p059', name:'Casamigos Reposado',    barcodes:['856724006213'],                           par:2,  onHand:2,  category:'Tequila', abdCost:54.74,  active:true },
  { id:'p060', name:'1942 Don Julio',        barcodes:['087000005322'],                           par:1,  onHand:1,  category:'Tequila', abdCost:149.99,  active:true },
  { id:'p061', name:'Exotico Blanco',        barcodes:['088352126524'],                           par:4,  onHand:2,  category:'Tequila', abdCost:20.25,  active:true },
  { id:'p062', name:'Montezuma Triple Sec',  barcodes:['080660650135'],                           par:2,  onHand:2,  category:'Tequila', abdCost:3.20,  active:true },
  // ── GIN ────────────────────────────────────────────────────────────────
  { id:'p063', name:'Bombay Sapphire',       barcodes:['080480301019'],                           par:1,  onHand:2,  category:'Gin',     abdCost:24.75,  active:true },
  { id:'p064', name:'Tanqueray',             barcodes:['088110110406'],                           par:1,  onHand:2,  category:'Gin',     abdCost:20.99,  active:true },
  { id:'p065', name:'Hendricks',             barcodes:['083664990436'],                           par:1,  onHand:1,  category:'Gin',     abdCost:29.25,  active:true },
  { id:'p066', name:'Revelton Mulberry Gin', barcodes:['810043690058'],                           par:2,  onHand:1,  category:'Gin',     abdCost:26.25,  active:true },
  { id:'p067', name:'Mr Boston Gin',         barcodes:['089000011841'],                           par:2,  onHand:2,  category:'Gin',     abdCost:5.25,  active:true },
  // ── LIQUEUR ────────────────────────────────────────────────────────────
  { id:'p068', name:'Southern Comfort',      barcodes:['088544018941'],             par:1,  onHand:1,  category:'Liqueur', abdCost:17.25,  active:true },
  { id:'p069', name:'Jager',                 barcodes:['083089660150'],                           par:2,  onHand:2,  category:'Liqueur', abdCost:26.13,  active:true },
  { id:'p070', name:'Baileys',               barcodes:['086767210043'],                           par:2,  onHand:2,  category:'Liqueur', abdCost:24.74,  active:true },
  { id:'p071', name:'Sambuca',               barcodes:['088004037475'],                           par:2,  onHand:1,  category:'Liqueur', abdCost:21.00,  active:true },
  { id:'p072', name:'Rumple Mintz',          barcodes:['088767520043'],                           par:3,  onHand:2,  category:'Liqueur', abdCost:25.49,  active:true },
  { id:'p073', name:'Goldschlager',          barcodes:['088004036744'],                           par:2,  onHand:1,  category:'Liqueur', abdCost:20.25,  active:true },
  { id:'p074', name:'Fireball 1.75',         barcodes:['088004009281'],                           par:1,  onHand:2,  category:'Liqueur', abdCost:24.00,  active:true },
  { id:'p075', name:'Henny VSOP',            barcodes:['088110151058'],                           par:1,  onHand:2,  category:'Liqueur', abdCost:50.24,  active:true },
  { id:'p076', name:'Aperol',                barcodes:['721059002387'],                           par:2,  onHand:2,  category:'Liqueur', abdCost:27.75,  active:true },
  { id:'p077', name:'Menthol',               barcodes:['088004144036'],                           par:3,  onHand:1,  category:'Liqueur', abdCost:16.50,  active:true },
  { id:'p078', name:'Blue Caracoa',          barcodes:['080686316022'],             par:1,  onHand:1,  category:'Liqueur', abdCost:7.88,  active:true },
  // ── MIXERS ─────────────────────────────────────────────────────────────
  { id:'p079', name:'Grape Pucker',          barcodes:['080686393207'],             par:4,  onHand:4,  category:'Mixer',   abdCost:11.81,  active:true },
  { id:'p080', name:'Watermelon Pucker',     barcodes:['080686396208'],             par:4,  onHand:4,  category:'Mixer',   abdCost:11.81,  active:true },
  { id:'p081', name:'Peach Tree',            barcodes:['080686365204'],             par:4,  onHand:4,  category:'Mixer',   abdCost:10.13,  active:true },
  { id:'p082', name:'Cherry Pucker',         barcodes:['080686394204'],             par:4,  onHand:4,  category:'Mixer',   abdCost:11.81,  active:true },
  { id:'p083', name:'Apple Pucker',          barcodes:['080686395201'],             par:2,  onHand:2,  category:'Mixer',   abdCost:11.81,  active:true },
  { id:'p084', name:'Simple Syrup',          barcodes:['070491021754'],             par:3,  onHand:3,  category:'Mixer',   abdCost:4.18,  active:true },
  { id:'p085', name:'Raspberry Puree',       barcodes:['070491113961'],             par:2,  onHand:2,  category:'Mixer',   abdCost:4.18,  active:true },
  { id:'p086', name:'Watermelon Puree',      barcodes:['070491562004'],             par:2,  onHand:2,  category:'Mixer',   abdCost:4.18,  active:true },
  { id:'p087', name:'Peach Puree',           barcodes:['070491116016'],             par:3,  onHand:3,  category:'Mixer',   abdCost:4.18,  active:true },
  { id:'p088', name:'Grenadine',             barcodes:['070491807952'],             par:2,  onHand:3,  category:'Mixer',   abdCost:4.18,  active:true },
  // ── TEQUILA (additional) ───────────────────────────────────────────────
  { id:'p089', name:'Verde',                 barcodes:['083664873685'],                           par:2,  onHand:2,  category:'Tequila', abdCost:28.50,  active:true },
  { id:'p090', name:'21 Seed Cucumber',      barcodes:['088076188808'],                           par:2,  onHand:2,  category:'Tequila', abdCost:26.25,  active:true },
  { id:'p091', name:'Mezcal 400 Conjos',     barcodes:['811538013628'],                           par:2,  onHand:2,  category:'Tequila', abdCost:30.00,  active:true },
  { id:'p092', name:'Tequila Ocho Reposado', barcodes:['898627001315'],                           par:1,  onHand:2,  category:'Tequila', abdCost:45.00,  active:true },
  { id:'p093', name:'Don Fulano',            barcodes:['741638230596'],                           par:1,  onHand:2,  category:'Tequila', abdCost:52.50,  active:true },
  { id:'p094', name:'Herradura Reposado',    barcodes:['744607111324'],                           par:1,  onHand:2,  category:'Tequila', abdCost:43.65,  active:true },
  { id:'p095', name:'Espolon Reposado',      barcodes:['721059707510'],                           par:1,  onHand:2,  category:'Tequila', abdCost:26.25,  active:true },
  // ── WHISKEY (additional) ──────────────────────────────────────────────
  { id:'p096', name:'Bulleit Bourbon',       barcodes:['087000005525'],                           par:1,  onHand:2,  category:'Whiskey', abdCost:32.99,  active:true },
  // ── LIQUEUR (additional) ──────────────────────────────────────────────
  { id:'p097', name:'St Germain',            barcodes:['080480004699'],                           par:1,  onHand:2,  category:'Liqueur', abdCost:30.00,  active:true },
  { id:'p098', name:'Amaretto',              barcodes:['086166600931'],                           par:2,  onHand:2,  category:'Liqueur', abdCost:5.63,  active:true },
  { id:'p099', name:'Hot Damn',              barcodes:['080686373209'],                           par:2,  onHand:2,  category:'Liqueur', abdCost:11.81,  active:true },
]

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const stockLevel = (p: Product): 'good' | 'low' | 'critical' | 'out' => {
  if (p.par === 0) return 'good'
  const ratio = p.onHand / p.par
  if (p.onHand <= 0) return 'out'
  if (ratio < 0.5)   return 'critical'
  if (ratio < 1)     return 'low'
  return 'good'
}

const levelColors: Record<string, string> = {
  good:     '#22c55e',
  low:      '#f59e0b',
  critical: '#ef4444',
  out:      '#6b7280',
}

const statusConfig: Record<ScanStatus, { color: string; label: string }> = {
  ready:       { color: '#22c55e', label: 'READY TO SCAN' },
  scanned:     { color: '#22c55e', label: 'SCANNED ✓' },
  notfound:    { color: '#f97316', label: 'NOT FOUND' },
  qr_rejected: { color: '#f97316', label: 'QR REJECTED' },
  inactive:    { color: '#6b7280', label: 'INACTIVE ITEM' },
  error:       { color: '#ef4444', label: 'ERROR' },
}

const fmt = (ts: number) => new Date(ts).toLocaleString('en-US', {
  month:'numeric', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true
})

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function Inventory() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const s = localStorage.getItem(LS_PRODUCTS)
      return s ? JSON.parse(s) : DEFAULT_PRODUCTS
    } catch { return DEFAULT_PRODUCTS }
  })

  const [movements, setMovements] = useState<Movement[]>(() => {
    try {
      const s = localStorage.getItem(LS_MOVEMENTS)
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })

  const [tab, setTab]               = useState<Tab>('scan')
  const [scanStatus, setScanStatus] = useState<ScanStatus>('ready')
  const [scanInput, setScanInput]   = useState('')
  const [lastMsg, setLastMsg]       = useState('')
  const [lastProduct, setLastProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editForm, setEditForm]     = useState<Partial<Product>>({})
  const [newBarcodeInput, setNewBarcodeInput] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name:'', barcodes:[], par:2, onHand:2, category:'Vodka', abdCost:0,  active:true
  })
  const [newProductBarcode, setNewProductBarcode] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const scanRef     = useRef<HTMLInputElement>(null)
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Persist ──
  useEffect(() => { localStorage.setItem(LS_PRODUCTS,  JSON.stringify(products))  }, [products])
  useEffect(() => { localStorage.setItem(LS_MOVEMENTS, JSON.stringify(movements)) }, [movements])

  // ── Auto-focus scan box ──
  useEffect(() => {
    if (tab === 'scan') setTimeout(() => scanRef.current?.focus(), 50)
  }, [tab])

  const resetStatusSoon = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setScanStatus('ready'), 2500)
  }, [])

  // ── Core scan logic ──
  const processScan = useCallback((raw: string) => {
    const code = raw.trim()
    setScanInput('')
    if (!code) return

    if (!isValidBarcode(code)) {
      setScanStatus('qr_rejected')
      setLastMsg(`Rejected — not a valid barcode (${code.length} chars). QR codes are ignored.`)
      setLastProduct(null)
      resetStatusSoon()
      return
    }

    const product = products.find(p => p.barcodes.includes(code))

    if (!product) {
      setScanStatus('notfound')
      setLastMsg(`Barcode ${code} not in product list. Add it in the Products tab.`)
      setLastProduct(null)
      resetStatusSoon()
      return
    }

    if (!product.active) {
      setScanStatus('inactive')
      setLastMsg(`${product.name} is inactive.`)
      setLastProduct(product)
      resetStatusSoon()
      return
    }

    const newOnHand = product.onHand - 1
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, onHand: newOnHand } : p))

    const mv: Movement = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      barcode: code,
      productId: product.id,
      productName: product.name,
      direction: 'OUT',
      qty: 1,
      onHandAfter: newOnHand,
    }
    setMovements(prev => [mv, ...prev])

    setScanStatus('scanned')
    setLastMsg(`${product.name} — now ${newOnHand} of ${product.par} PAR`)
    setLastProduct({ ...product, onHand: newOnHand })
    resetStatusSoon()
  }, [products, resetStatusSoon])

  const handleScanKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') processScan(scanInput)
  }

  // ── Export order list as CSV ──
  const exportOrderCSV = () => {
    const toOrder = movements.reduce((acc, m) => {
      acc[m.productId] = (acc[m.productId] || 0) + m.qty
      return acc
    }, {} as Record<string, number>)

    const rows = [['Product', 'Category', 'Qty Scanned', 'PAR', 'On Hand', 'ABD Cost', 'Cost w/ 4%']]
    Object.entries(toOrder).forEach(([id, qty]) => {
      const p = products.find(x => x.id === id)
      if (p) rows.push([
        p.name, p.category,
        String(qty), String(p.par), String(p.onHand),
        `$${p.abdCost.toFixed(2)}`,
        `$${(p.abdCost * 1.04).toFixed(2)}`
      ])
    })

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `copper-cup-order-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  // ── Submit order: clear movements, reset on-hand to PAR ──
  const submitOrder = () => {
    setProducts(prev => prev.map(p => ({ ...p, onHand: p.par })))
    setMovements([])
    setConfirmClear(false)
  }

  // ── Reset on-hand to PAR without clearing movements ──
  const resetToPar = () => {
    setProducts(prev => prev.map(p => ({ ...p, onHand: p.par })))
    setConfirmReset(false)
  }

  // ── Editing helpers ──
  const startEdit = (p: Product) => {
    setEditingId(p.id)
    setEditForm({ ...p })
    setNewBarcodeInput('')
  }
  const saveEdit = () => {
    if (!editingId) return
    setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...editForm } : p))
    setEditingId(null)
  }
  const removeBarcode = (bc: string) => {
    setEditForm(f => ({ ...f, barcodes: (f.barcodes || []).filter(b => b !== bc) }))
  }
  const addBarcode = () => {
    const bc = newBarcodeInput.trim()
    if (!bc) return
    const duplicate = products.find(p => p.id !== editingId && p.barcodes.includes(bc))
    if (duplicate) { alert(`That barcode is already assigned to ${duplicate.name}`); return }
    setEditForm(f => ({ ...f, barcodes: [...(f.barcodes || []), bc] }))
    setNewBarcodeInput('')
  }

  // ── Add new product ──
  const saveNewProduct = () => {
    if (!newProduct.name?.trim()) return
    const p: Product = {
      id: `p${Date.now()}`,
      name: newProduct.name!.trim(),
      barcodes: newProduct.barcodes || [],
      par: newProduct.par || 2,
      onHand: newProduct.onHand ?? newProduct.par ?? 2,
      category: newProduct.category || 'Other',
      abdCost: newProduct.abdCost || 0,
      active: true,
    }
    setProducts(prev => [...prev, p])
    setAddingProduct(false)
    setNewProduct({ name:'', barcodes:[], par:2, onHand:2, category:'Vodka', abdCost:0,  active:true })
    setNewProductBarcode('')
  }

  // ── Derived values ──
  const itemsBelowPar = products.filter(p => p.active && p.onHand < p.par)
  const outOfStock    = products.filter(p => p.active && p.onHand <= 0)
  const totalScanned  = movements.length

  const filteredProducts = products
    .filter(p => categoryFilter === 'All' || p.category === categoryFilter)
    .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
                               || p.barcodes.some(b => b.includes(productSearch)))

  const orderSummary = movements.reduce((acc, m) => {
    acc[m.productId] = (acc[m.productId] || 0) + m.qty
    return acc
  }, {} as Record<string, number>)

  // ── STYLES ──
  const S = {
    page: {
      background: '#0d0d0f',
      minHeight: '100vh',
      fontFamily: "'IBM Plex Mono', 'Fira Mono', 'Consolas', monospace",
      color: '#e2e2e8',
      padding: '0',
    } as React.CSSProperties,

    header: {
      background: '#111115',
      borderBottom: '1px solid #252530',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    } as React.CSSProperties,

    title: {
      fontSize: '13px',
      letterSpacing: '0.15em',
      fontWeight: 600,
      color: '#aa3bff',
      textTransform: 'uppercase' as const,
      margin: 0,
    },

    stats: {
      display: 'flex',
      gap: '24px',
      fontSize: '11px',
      color: '#666',
    } as React.CSSProperties,

    stat: () => ({
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '2px',
    }),

    statNum: (color: string) => ({
      fontSize: '18px',
      fontWeight: 700,
      color,
      lineHeight: 1,
    }),

    tabs: {
      background: '#111115',
      borderBottom: '1px solid #252530',
      display: 'flex',
      padding: '0 24px',
    } as React.CSSProperties,

    tab: (active: boolean) => ({
      padding: '12px 20px',
      fontSize: '11px',
      letterSpacing: '0.12em',
      fontWeight: active ? 700 : 400,
      color: active ? '#aa3bff' : '#555',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      borderBottom: active ? '2px solid #aa3bff' : '2px solid transparent',
      transition: 'color 0.15s',
      textTransform: 'uppercase' as const,
    } as React.CSSProperties),

    content: {
      padding: '24px',
      maxWidth: '1200px',
    } as React.CSSProperties,

    statusBox: (color: string) => ({
      background: `${color}18`,
      border: `2px solid ${color}60`,
      borderRadius: '8px',
      padding: '20px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '20px',
    } as React.CSSProperties),

    statusDot: (color: string) => ({
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 12px ${color}`,
      flexShrink: 0,
    } as React.CSSProperties),

    statusLabel: (color: string) => ({
      fontSize: '22px',
      fontWeight: 700,
      color,
      letterSpacing: '0.1em',
    } as React.CSSProperties),

    scanInput: {
      background: '#1a1a20',
      border: '2px solid #333',
      borderRadius: '6px',
      color: '#e2e2e8',
      fontFamily: 'inherit',
      fontSize: '16px',
      padding: '14px 16px',
      width: '100%',
      outline: 'none',
      letterSpacing: '0.1em',
    } as React.CSSProperties,

    card: {
      background: '#111115',
      border: '1px solid #252530',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
    } as React.CSSProperties,

    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '12px',
    },

    th: {
      textAlign: 'left' as const,
      padding: '10px 12px',
      fontSize: '10px',
      letterSpacing: '0.12em',
      color: '#555',
      borderBottom: '1px solid #252530',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
    } as React.CSSProperties,

    td: {
      padding: '10px 12px',
      borderBottom: '1px solid #1a1a20',
      verticalAlign: 'middle' as const,
    } as React.CSSProperties,

    pill: (color: string) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '10px',
      fontWeight: 700,
      background: `${color}20`,
      color,
      letterSpacing: '0.06em',
    } as React.CSSProperties),

    btn: (variant: 'primary' | 'ghost' | 'danger' | 'success') => {
      const colors = {
        primary: { bg: '#aa3bff22', border: '#aa3bff55', color: '#aa3bff' },
        ghost:   { bg: '#ffffff08', border: '#333',      color: '#aaa'    },
        danger:  { bg: '#ef444422', border: '#ef444455', color: '#ef4444' },
        success: { bg: '#22c55e22', border: '#22c55e55', color: '#22c55e' },
      }
      const c = colors[variant]
      return {
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '5px',
        color: c.color,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        padding: '6px 14px',
        textTransform: 'uppercase' as const,
        transition: 'opacity 0.15s',
      } as React.CSSProperties
    },

    input: {
      background: '#1a1a20',
      border: '1px solid #333',
      borderRadius: '5px',
      color: '#e2e2e8',
      fontFamily: 'inherit',
      fontSize: '12px',
      padding: '7px 10px',
      outline: 'none',
    } as React.CSSProperties,

    label: {
      fontSize: '10px',
      color: '#666',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      display: 'block',
      marginBottom: '4px',
    } as React.CSSProperties,

    bcTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: '#1a1a20',
      border: '1px solid #333',
      borderRadius: '4px',
      padding: '3px 8px',
      fontSize: '11px',
      letterSpacing: '0.06em',
      marginRight: '6px',
      marginBottom: '4px',
    } as React.CSSProperties,
  }

  // ──────────────────────────────────────────
  // SCAN TAB
  // ──────────────────────────────────────────
  const renderScan = () => {
    const sc = statusConfig[scanStatus]
    return (
      <div style={S.content}>
        {/* Status indicator */}
        <div style={S.statusBox(sc.color)}>
          <div style={S.statusDot(sc.color)} />
          <div>
            <div style={S.statusLabel(sc.color)}>{sc.label}</div>
            {lastMsg && <div style={{ fontSize:'12px', color:'#888', marginTop:'4px' }}>{lastMsg}</div>}
          </div>
          {lastProduct && (
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ fontSize:'11px', color:'#666' }}>LAST PRODUCT</div>
              <div style={{ fontSize:'15px', fontWeight:700, color:'#e2e2e8' }}>{lastProduct.name}</div>
              <div style={{ fontSize:'12px', color: levelColors[stockLevel(lastProduct)] }}>
                {lastProduct.onHand} / {lastProduct.par} PAR
              </div>
            </div>
          )}
        </div>

        {/* Scan input */}
        <div style={{ marginBottom:'24px' }}>
          <label style={S.label}>Scan barcode here (scanner auto-submits on Enter)</label>
          <input
            ref={scanRef}
            style={S.scanInput}
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            onKeyDown={handleScanKey}
            placeholder="Waiting for scan..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* Dashboard row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'24px' }}>
          {[
            { label:'Scans This Cycle', value: totalScanned, color:'#aa3bff' },
            { label:'Below PAR',        value: itemsBelowPar.length, color: itemsBelowPar.length > 0 ? '#f59e0b' : '#22c55e' },
            { label:'Out of Stock',     value: outOfStock.length,    color: outOfStock.length > 0 ? '#ef4444' : '#22c55e' },
          ].map(s => (
            <div key={s.label} style={S.card}>
              <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'6px' }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize:'32px', fontWeight:700, color: s.color, lineHeight:1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Items below PAR */}
        {itemsBelowPar.length > 0 && (
          <div style={S.card}>
            <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'12px' }}>BELOW PAR</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'8px' }}>
              {itemsBelowPar.map(p => {
                const level = stockLevel(p)
                return (
                  <div key={p.id} style={{
                    background:'#1a1a20', border:`1px solid ${levelColors[level]}44`,
                    borderRadius:'6px', padding:'10px 12px'
                  }}>
                    <div style={{ fontSize:'12px', fontWeight:600, color:'#e2e2e8', marginBottom:'4px' }}>{p.name}</div>
                    <div style={{ fontSize:'11px', color: levelColors[level] }}>
                      {p.onHand} of {p.par} PAR
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ──────────────────────────────────────────
  // PRODUCTS TAB
  // ──────────────────────────────────────────
  const renderProducts = () => (
    <div style={S.content}>
      {/* Controls */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap' }}>
        <input
          style={{ ...S.input, width:'220px' }}
          placeholder="Search name or barcode..."
          value={productSearch}
          onChange={e => setProductSearch(e.target.value)}
        />
        <select
          style={{ ...S.input, cursor:'pointer' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft:'auto' }}>
          <button style={S.btn('primary')} onClick={() => setAddingProduct(true)}>+ Add Product</button>
        </div>
      </div>

      {/* Add product form */}
      {addingProduct && (
        <div style={{ ...S.card, border:'1px solid #aa3bff44', marginBottom:'16px' }}>
          <div style={{ fontSize:'11px', color:'#aa3bff', letterSpacing:'0.1em', marginBottom:'12px' }}>NEW PRODUCT</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'10px', marginBottom:'12px' }}>
            {[
              { label:'Name', key:'name', type:'text' },
              { label:'PAR',  key:'par',  type:'number' },
              { label:'ABD Cost', key:'abdCost', type:'number' },
            ].map(f => (
              <div key={f.key}>
                <label style={S.label}>{f.label}</label>
                <input
                  style={{ ...S.input, width:'100%' }}
                  type={f.type}
                  value={(newProduct as Record<string, unknown>)[f.key] as string || ''}
                  onChange={e => setNewProduct(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value)||0 : e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label style={S.label}>Category</label>
              <select style={{ ...S.input, width:'100%', cursor:'pointer' }}
                value={newProduct.category}
                onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:'12px' }}>
            <label style={S.label}>Barcodes (scan or type, press Enter to add)</label>
            <div style={{ display:'flex', gap:'8px', marginBottom:'6px' }}>
              <input
                style={{ ...S.input, flex:1 }}
                placeholder="Scan or type barcode..."
                value={newProductBarcode}
                onChange={e => setNewProductBarcode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const bc = newProductBarcode.trim()
                    if (bc && !(newProduct.barcodes || []).includes(bc)) {
                      setNewProduct(p => ({ ...p, barcodes: [...(p.barcodes||[]), bc] }))
                    }
                    setNewProductBarcode('')
                    e.preventDefault()
                  }
                }}
              />
              <button style={S.btn('ghost')} onClick={() => {
                const bc = newProductBarcode.trim()
                if (bc && !(newProduct.barcodes||[]).includes(bc)) {
                  setNewProduct(p => ({ ...p, barcodes: [...(p.barcodes||[]), bc] }))
                }
                setNewProductBarcode('')
              }}>Add</button>
            </div>
            <div>
              {(newProduct.barcodes || []).map(bc => (
                <span key={bc} style={S.bcTag}>
                  {bc}
                  <span style={{ cursor:'pointer', color:'#ef4444', fontSize:'13px' }}
                    onClick={() => setNewProduct(p => ({ ...p, barcodes: (p.barcodes||[]).filter(b=>b!==bc) }))}>×</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button style={S.btn('primary')} onClick={saveNewProduct}>Save Product</button>
            <button style={S.btn('ghost')} onClick={() => setAddingProduct(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Products table */}
      <div style={{ background:'#111115', border:'1px solid #252530', borderRadius:'8px', overflow:'hidden' }}>
        <table style={S.table}>
          <thead>
            <tr>
              {['Product','Category','Barcodes','PAR','On Hand','Status','ABD Cost','Cost +4%',''].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const isEditing = editingId === p.id
              const level = stockLevel(p)
              return isEditing ? (
                <tr key={p.id} style={{ background:'#161620' }}>
                  <td style={{ ...S.td, paddingTop:'12px', paddingBottom:'12px' }} colSpan={9}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'10px', marginBottom:'12px' }}>
                      {[
                        { label:'Name',     key:'name',    type:'text'   },
                        { label:'PAR',      key:'par',     type:'number' },
                        { label:'On Hand',  key:'onHand',  type:'number' },
                        { label:'ABD Cost', key:'abdCost', type:'number' },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={S.label}>{f.label}</label>
                          <input
                            style={{ ...S.input, width:'100%' }}
                            type={f.type}
                            value={(editForm as Record<string, unknown>)[f.key] as string ?? ''}
                            onChange={e => setEditForm(ef => ({
                              ...ef,
                              [f.key]: f.type === 'number' ? parseFloat(e.target.value)||0 : e.target.value
                            }))}
                          />
                        </div>
                      ))}
                      <div>
                        <label style={S.label}>Category</label>
                        <select style={{ ...S.input, width:'100%', cursor:'pointer' }}
                          value={editForm.category}
                          onChange={e => setEditForm(ef => ({ ...ef, category: e.target.value }))}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>Active</label>
                        <select style={{ ...S.input, width:'100%', cursor:'pointer' }}
                          value={editForm.active ? 'yes' : 'no'}
                          onChange={e => setEditForm(ef => ({ ...ef, active: e.target.value === 'yes' }))}>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>

                    {/* Barcode management */}
                    <div style={{ marginBottom:'12px' }}>
                      <label style={S.label}>Barcodes — add aliases for different bottle sizes (750ml, 1L, etc.)</label>
                      <div style={{ marginBottom:'6px' }}>
                        {(editForm.barcodes || []).map((bc, i) => (
                          <span key={bc} style={S.bcTag}>
                            {i === 0 ? '★ ' : ''}{bc}
                            <span style={{ cursor:'pointer', color:'#ef4444', fontSize:'13px' }}
                              onClick={() => removeBarcode(bc)}>×</span>
                          </span>
                        ))}
                        {(editForm.barcodes||[]).length === 0 && (
                          <span style={{ color:'#555', fontSize:'11px' }}>No barcodes — item can't be scanned yet</span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:'8px' }}>
                        <input
                          style={{ ...S.input, width:'200px' }}
                          placeholder="Scan or type barcode..."
                          value={newBarcodeInput}
                          onChange={e => setNewBarcodeInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { addBarcode(); e.preventDefault() } }}
                        />
                        <button style={S.btn('ghost')} onClick={addBarcode}>Add Barcode</button>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:'8px' }}>
                      <button style={S.btn('primary')} onClick={saveEdit}>Save Changes</button>
                      <button style={S.btn('ghost')} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} style={{ opacity: p.active ? 1 : 0.45 }}>
                  <td style={{ ...S.td, fontWeight:600, color:'#e2e2e8' }}>{p.name}</td>
                  <td style={{ ...S.td, color:'#666', fontSize:'11px' }}>{p.category}</td>
                  <td style={S.td}>
                    {p.barcodes.length === 0
                      ? <span style={{ color:'#444', fontSize:'11px' }}>none</span>
                      : p.barcodes.map(b => (
                          <span key={b} style={{ ...S.bcTag, fontSize:'10px' }}>{b}</span>
                        ))
                    }
                  </td>
                  <td style={{ ...S.td, textAlign:'center' }}>{p.par}</td>
                  <td style={{ ...S.td, textAlign:'center', color: levelColors[level], fontWeight:700 }}>{p.onHand}</td>
                  <td style={S.td}><span style={S.pill(levelColors[level])}>{level.toUpperCase()}</span></td>
                  <td style={{ ...S.td, color:'#888' }}>${p.abdCost.toFixed(2)}</td>
                  <td style={{ ...S.td, color:'#22c55e', fontWeight:600 }}>${bestCost(p).toFixed(2)}</td>
                  <td style={S.td}>
                    <button style={S.btn('ghost')} onClick={() => startEdit(p)}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ──────────────────────────────────────────
  // MOVEMENTS TAB
  // ──────────────────────────────────────────
  const renderMovements = () => (
    <div style={S.content}>
      <div style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom:'16px', flexWrap:'wrap' }}>
        <div style={{ color:'#888', fontSize:'12px' }}>{movements.length} scans this cycle</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'8px' }}>
          <button style={S.btn('ghost')} onClick={exportOrderCSV}>Export Order CSV</button>
          {!confirmClear
            ? <button style={S.btn('success')} onClick={() => setConfirmClear(true)}>✓ Submit Order &amp; Clear</button>
            : (
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <span style={{ fontSize:'11px', color:'#f59e0b' }}>Resets all on-hand to PAR and clears movements. Continue?</span>
                <button style={S.btn('success')} onClick={submitOrder}>Yes, Submit</button>
                <button style={S.btn('ghost')} onClick={() => setConfirmClear(false)}>Cancel</button>
              </div>
            )
          }
        </div>
      </div>

      {/* Order summary */}
      {Object.keys(orderSummary).length > 0 && (() => {
        const orderItems = Object.entries(orderSummary).map(([id, qty]) => ({
          p: products.find(x => x.id === id),
          qty
        })).filter(x => x.p)
        const totalBottles = orderItems.reduce((s, x) => s + x.qty, 0)
        const totalCost    = orderItems.reduce((s, x) => s + bestCost(x.p!) * x.qty, 0)
        return (
          <div style={{ ...S.card, marginBottom:'16px' }}>
            {/* Totals row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px', marginBottom:'16px' }}>
              {[
                { label:'Total Bottles', value: String(totalBottles), unit:'bottles to order', color:'#aa3bff' },
                { label:'Estimated Bill', value: `$${totalCost.toFixed(2)}`, unit:'ABD cost + 4% fee', color:'#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ background:'#0d0d0f', borderRadius:'6px', padding:'16px 20px' }}>
                  <div style={{ fontSize:'10px', color:'#555', letterSpacing:'0.1em', marginBottom:'4px' }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize:'32px', fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:'10px', color:'#444', marginTop:'4px' }}>{s.unit}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'10px' }}>LINE ITEMS</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'8px' }}>
              {orderItems.map(({ p, qty }) => (
                <div key={p!.id} style={{ background:'#1a1a20', borderRadius:'5px', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px' }}>
                  <div>
                    <div style={{ fontSize:'12px', color:'#e2e2e8', fontWeight:600 }}>{p!.name}</div>
                    <div style={{ fontSize:'10px', color:'#555', marginTop:'2px' }}>
                      {qty} × ${bestCost(p!).toFixed(2)} (ABD +4%)
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#22c55e' }}>${(bestCost(p!) * qty).toFixed(2)}</div>
                    <div style={{ fontSize:'10px', color:'#555' }}>{qty} btl</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Movement log */}
      <div style={{ background:'#111115', border:'1px solid #252530', borderRadius:'8px', overflow:'hidden' }}>
        <table style={S.table}>
          <thead>
            <tr>
              {['Time','Product','Barcode','Direction','On Hand After'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...S.td, textAlign:'center', color:'#444', padding:'32px' }}>
                  No scans yet this cycle
                </td>
              </tr>
            )}
            {movements.map(m => (
              <tr key={m.id}>
                <td style={{ ...S.td, color:'#666', fontSize:'11px' }}>{fmt(m.timestamp)}</td>
                <td style={{ ...S.td, fontWeight:600, color:'#e2e2e8' }}>{m.productName}</td>
                <td style={{ ...S.td, color:'#555', fontSize:'11px', letterSpacing:'0.06em' }}>{m.barcode}</td>
                <td style={S.td}>
                  <span style={S.pill(m.direction === 'OUT' ? '#f97316' : '#22c55e')}>{m.direction}</span>
                </td>
                <td style={{ ...S.td, color:'#888' }}>{m.onHandAfter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ──────────────────────────────────────────
  // SETTINGS TAB
  // ──────────────────────────────────────────
  const renderSettings = () => (
    <div style={S.content}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'16px' }}>

        <div style={S.card}>
          <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'8px' }}>RESET TO PAR</div>
          <p style={{ fontSize:'12px', color:'#888', marginBottom:'12px', lineHeight:1.6 }}>
            Sets all on-hand counts back to PAR without clearing the movement log. Use for a manual count correction.
          </p>
          {!confirmReset
            ? <button style={S.btn('ghost')} onClick={() => setConfirmReset(true)}>Reset On-Hand to PAR</button>
            : (
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <button style={S.btn('danger')} onClick={resetToPar}>Confirm Reset</button>
                <button style={S.btn('ghost')} onClick={() => setConfirmReset(false)}>Cancel</button>
              </div>
            )
          }
        </div>

        <div style={S.card}>
          <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'8px' }}>EXPORT ORDER CSV</div>
          <p style={{ fontSize:'12px', color:'#888', marginBottom:'12px', lineHeight:1.6 }}>
            Downloads a CSV of scanned items with quantities, PAR, on-hand, ABD cost and cost +4%.
          </p>
          <button style={S.btn('primary')} onClick={exportOrderCSV}>Download CSV</button>
        </div>

        <div style={S.card}>
          <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'8px' }}>QR CODE FILTERING</div>
          <p style={{ fontSize:'12px', color:'#888', marginBottom:'4px', lineHeight:1.6 }}>
            Active. Any scan that is not a 6–14 digit numeric code is automatically rejected. This blocks QR codes, URLs, and text codes from registering as scans.
          </p>
          <span style={S.pill('#22c55e')}>ENABLED</span>
        </div>

        <div style={S.card}>
          <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'8px' }}>ALIAS BARCODES</div>
          <p style={{ fontSize:'12px', color:'#888', marginBottom:'4px', lineHeight:1.6 }}>
            Each product supports multiple barcodes. Scan a 750ml or a 1L — both count the same bottle. Add aliases in the Products tab by editing any item.
          </p>
          <span style={S.pill('#22c55e')}>ENABLED</span>
        </div>

        <div style={S.card}>
          <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'8px' }}>ZEBRA SCANNER — DISABLE QR</div>
          <p style={{ fontSize:'12px', color:'#888', lineHeight:1.6 }}>
            To stop your Zebra scanner from reading QR codes at the hardware level, scan the "Disable 2D Symbologies" programming barcode from the DS2208 Product Reference Guide (p. 5-8). This is the most reliable fix. Software filtering above handles anything that slips through.
          </p>
        </div>

        <div style={S.card}>
          <div style={{ fontSize:'11px', color:'#555', letterSpacing:'0.1em', marginBottom:'8px' }}>DATA STORAGE</div>
          <p style={{ fontSize:'12px', color:'#888', marginBottom:'12px', lineHeight:1.6 }}>
            All data is saved to browser localStorage on this device. Products and movements persist across sessions. To move data to a new device, use Export CSV.
          </p>
          <button style={S.btn('danger')} onClick={() => {
            if (confirm('This will delete ALL products and movements and restore defaults. Are you sure?')) {
              localStorage.removeItem(LS_PRODUCTS)
              localStorage.removeItem(LS_MOVEMENTS)
              setProducts(DEFAULT_PRODUCTS)
              setMovements([])
            }
          }}>
            Factory Reset
          </button>
        </div>
      </div>
    </div>
  )

  // ──────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Copper Cup — Inventory System</h1>
          <div style={{ fontSize:'11px', color:'#444', marginTop:'3px', letterSpacing:'0.05em' }}>
            Scanner-driven bottle tracking · Alias barcodes · QR filter active
          </div>
        </div>
        <div style={S.stats}>
          <div style={S.stat()}>
            <span style={S.statNum('#aa3bff')}>{products.filter(p=>p.active).length}</span>
            <span>Products</span>
          </div>
          <div style={S.stat()}>
            <span style={S.statNum(totalScanned > 0 ? '#f59e0b' : '#444')}>{totalScanned}</span>
            <span>Scans</span>
          </div>
          <div style={S.stat()}>
            <span style={S.statNum(itemsBelowPar.length > 0 ? '#ef4444' : '#22c55e')}>{itemsBelowPar.length}</span>
            <span>Below PAR</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {(['scan','products','movements','settings'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {t === 'scan' ? '⬡ Scan' : t === 'products' ? '▤ Products' : t === 'movements' ? '↓ Movements' : '⚙ Settings'}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'scan'      && renderScan()}
      {tab === 'products'  && renderProducts()}
      {tab === 'movements' && renderMovements()}
      {tab === 'settings'  && renderSettings()}
    </div>
  )
}
