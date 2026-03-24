import { useState, useEffect, useRef, useCallback } from 'react'

// ─────────────────────────────────────────────
// THEME — Deep blue / slate
// ─────────────────────────────────────────────
const ACCENT  = '#3b82f6'   // blue-500
const ACCENT2 = '#1d4ed8'   // blue-700
const BG      = '#0a0f1a'   // deep navy
const SURFACE = '#0f1623'   // card bg
const BORDER  = '#1e2d45'   // border
const TEXT     = '#e2e8f0'
const MUTED    = '#64748b'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Product {
  id: string
  name: string
  barcodes: string[]
  par: number
  onHand: number
  category: string
  cost: number
  active: boolean
}

interface Movement {
  id: string
  timestamp: number
  barcode: string
  productId: string
  productName: string
  qty: number
  onHandAfter: number
}

type ScanStatus = 'ready' | 'scanned' | 'notfound' | 'qr_rejected'
type Tab = 'scan' | 'products' | 'movements' | 'settings'

const isValidBarcode = (code: string) => /^\d{6,14}$/.test(code.trim())
const bestCost = (p: Product) => p.cost * 1.04
const fmt = (ts: number) => new Date(ts).toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

const CATEGORIES = ['Vodka', 'Whiskey', 'Rum', 'Tequila', 'Gin', 'Liqueur', 'Mixer', 'Beer', 'Other']

const stockLevel = (p: Product): 'good' | 'low' | 'critical' | 'out' => {
  if (p.par === 0) return 'good'
  const r = p.onHand / p.par
  if (p.onHand <= 0) return 'out'
  if (r < 0.5) return 'critical'
  if (r < 1)   return 'low'
  return 'good'
}

const levelColors: Record<string, string> = {
  good: '#22c55e', low: '#f59e0b', critical: '#ef4444', out: '#475569'
}

const statusConfig: Record<ScanStatus, { color: string; label: string }> = {
  ready:       { color: '#22c55e', label: 'READY TO SCAN' },
  scanned:     { color: ACCENT,   label: 'SCANNED ✓' },
  notfound:    { color: '#f97316', label: 'NOT FOUND' },
  qr_rejected: { color: '#f97316', label: 'QR REJECTED' },
}

// ─────────────────────────────────────────────
// DEMO DATA — fictional bar "Slate & Stone"
// ─────────────────────────────────────────────
const DEMO_PRODUCTS: Product[] = [
  // Vodka
  { id:'d001', name:"Grey Goose",         barcodes:['080480280017'], par:3,  onHand:2,  category:'Vodka',   cost:28.50, active:true },
  { id:'d002', name:"Tito's",             barcodes:['619947000013'], par:4,  onHand:4,  category:'Vodka',   cost:19.76, active:true },
  { id:'d003', name:"Ketel One",          barcodes:['085156610419'], par:2,  onHand:1,  category:'Vodka',   cost:22.74, active:true },
  { id:'d004', name:"Absolut",            barcodes:['835229001404'], par:3,  onHand:3,  category:'Vodka',   cost:18.99, active:true },
  { id:'d005', name:"Smirnoff",           barcodes:['082000000051'], par:4,  onHand:2,  category:'Vodka',   cost:13.88, active:true },
  // Whiskey
  { id:'d006', name:"Jack Daniels",       barcodes:['082184090442'], par:3,  onHand:3,  category:'Whiskey', cost:23.87, active:true },
  { id:'d007', name:"Jameson",            barcodes:['080432500118'], par:4,  onHand:2,  category:'Whiskey', cost:31.47, active:true },
  { id:'d008', name:"Bulleit Bourbon",    barcodes:['087000005525'], par:2,  onHand:2,  category:'Whiskey', cost:32.99, active:true },
  { id:'d009', name:"Maker's Mark",       barcodes:['085246139424'], par:2,  onHand:1,  category:'Whiskey', cost:33.75, active:true },
  { id:'d010', name:"Crown Royal",        barcodes:['087000007246'], par:2,  onHand:2,  category:'Whiskey', cost:26.24, active:true },
  { id:'d011', name:"Glenlivet 12yr",     barcodes:['080432400708'], par:1,  onHand:1,  category:'Whiskey', cost:57.47, active:true },
  // Rum
  { id:'d012', name:"Bacardi White",      barcodes:['080480015305'], par:3,  onHand:3,  category:'Rum',     cost:14.25, active:true },
  { id:'d013', name:"Captain Morgan",     barcodes:['087000002715'], par:2,  onHand:2,  category:'Rum',     cost:19.49, active:true },
  { id:'d014', name:"Malibu",             barcodes:['089540448978'], par:2,  onHand:0,  category:'Rum',     cost:17.99, active:true },
  // Tequila
  { id:'d015', name:"Patron Silver",      barcodes:['721733000029'], par:2,  onHand:2,  category:'Tequila', cost:42.00, active:true },
  { id:'d016', name:"Don Julio Blanco",   barcodes:['674545000001'], par:2,  onHand:1,  category:'Tequila', cost:46.49, active:true },
  { id:'d017', name:"Casamigos Blanco",   barcodes:['856724006114'], par:2,  onHand:2,  category:'Tequila', cost:50.24, active:true },
  { id:'d018', name:"Jose Cuervo",        barcodes:['811538010801'], par:2,  onHand:2,  category:'Tequila', cost:21.75, active:true },
  // Gin
  { id:'d019', name:"Hendricks",          barcodes:['083664990436'], par:1,  onHand:1,  category:'Gin',     cost:29.25, active:true },
  { id:'d020', name:"Tanqueray",          barcodes:['088110110406'], par:2,  onHand:2,  category:'Gin',     cost:20.99, active:true },
  { id:'d021', name:"Bombay Sapphire",    barcodes:['080480301019'], par:2,  onHand:1,  category:'Gin',     cost:24.75, active:true },
  // Liqueur
  { id:'d022', name:"Baileys",            barcodes:['086767210043'], par:2,  onHand:2,  category:'Liqueur', cost:24.74, active:true },
  { id:'d023', name:"Kahlua",             barcodes:['089000004400'], par:1,  onHand:1,  category:'Liqueur', cost:22.50, active:true },
  { id:'d024', name:"Aperol",             barcodes:['721059002387'], par:2,  onHand:2,  category:'Liqueur', cost:27.75, active:true },
  { id:'d025', name:"St Germain",         barcodes:['080480004699'], par:1,  onHand:0,  category:'Liqueur', cost:30.00, active:true },
  // Mixer
  { id:'d026', name:"Simple Syrup",       barcodes:['070491021754'], par:3,  onHand:3,  category:'Mixer',   cost:4.18,  active:true },
  { id:'d027', name:"Grenadine",          barcodes:['070491807952'], par:2,  onHand:1,  category:'Mixer',   cost:4.18,  active:true },
]

// Pre-seeded movements — looks like a real week of scanning
const DEMO_MOVEMENTS: Movement[] = [
  { id:'m001', timestamp: Date.now() - 1000*60*14,   barcode:'080432500118', productId:'d007', productName:"Jameson",        qty:1, onHandAfter:2 },
  { id:'m002', timestamp: Date.now() - 1000*60*52,   barcode:'619947000013', productId:'d002', productName:"Tito's",         qty:1, onHandAfter:4 },
  { id:'m003', timestamp: Date.now() - 1000*60*90,   barcode:'080480280017', productId:'d001', productName:"Grey Goose",     qty:1, onHandAfter:2 },
  { id:'m004', timestamp: Date.now() - 1000*60*141,  barcode:'085156610419', productId:'d003', productName:"Ketel One",      qty:1, onHandAfter:1 },
  { id:'m005', timestamp: Date.now() - 1000*60*200,  barcode:'082000000051', productId:'d005', productName:"Smirnoff",       qty:1, onHandAfter:2 },
  { id:'m006', timestamp: Date.now() - 1000*60*310,  barcode:'089540448978', productId:'d014', productName:"Malibu",         qty:1, onHandAfter:0 },
  { id:'m007', timestamp: Date.now() - 1000*60*390,  barcode:'080432500118', productId:'d007', productName:"Jameson",        qty:1, onHandAfter:3 },
  { id:'m008', timestamp: Date.now() - 1000*60*480,  barcode:'080480004699', productId:'d025', productName:"St Germain",     qty:1, onHandAfter:0 },
  { id:'m009', timestamp: Date.now() - 1000*60*560,  barcode:'082184090442', productId:'d006', productName:"Jack Daniels",   qty:1, onHandAfter:3 },
  { id:'m010', timestamp: Date.now() - 1000*60*700,  barcode:'085246139424', productId:'d009', productName:"Maker's Mark",   qty:1, onHandAfter:1 },
  { id:'m011', timestamp: Date.now() - 1000*60*820,  barcode:'674545000001', productId:'d016', productName:"Don Julio Blanco", qty:1, onHandAfter:1 },
  { id:'m012', timestamp: Date.now() - 1000*60*960,  barcode:'619947000013', productId:'d002', productName:"Tito's",         qty:1, onHandAfter:5 },
]

const LS_KEY = 'bar_inv_demo_v1'

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const S = {
  page: { minHeight:'100vh', background:BG, color:TEXT, fontFamily:"'IBM Plex Mono', 'Fira Mono', 'Consolas', monospace" } as React.CSSProperties,
  header: { background:SURFACE, borderBottom:`1px solid ${BORDER}`, padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, position:'sticky' as const, top:0, zIndex:10 },
  title: { fontSize:12, letterSpacing:'0.18em', fontWeight:700, color:ACCENT, textTransform:'uppercase' as const, margin:0 },
  tabs: { background:SURFACE, borderBottom:`1px solid ${BORDER}`, display:'flex', padding:'0 24px' } as React.CSSProperties,
  tab: (active: boolean) => ({ padding:'11px 18px', fontSize:'10px', letterSpacing:'0.12em', fontWeight: active ? 700 : 400, color: active ? ACCENT : MUTED, borderBottom: active ? `2px solid ${ACCENT}` : '2px solid transparent', cursor:'pointer', background:'none', border:'none', borderBottom: active ? `2px solid ${ACCENT}` : '2px solid transparent', textTransform:'uppercase' as const } as React.CSSProperties),
  content: { padding:'20px 24px', maxWidth:1100 } as React.CSSProperties,
  card: { background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:8, padding:'16px', marginBottom:12 } as React.CSSProperties,
  statusBox: (color: string) => ({ background:`${color}12`, border:`2px solid ${color}50`, borderRadius:8, padding:'18px 24px', display:'flex', alignItems:'center', gap:14, marginBottom:18 } as React.CSSProperties),
  dot: (color: string) => ({ width:12, height:12, borderRadius:'50%', background:color, boxShadow:`0 0 10px ${color}`, flexShrink:0 } as React.CSSProperties),
  scanInput: { background:'#111827', border:`2px solid ${BORDER}`, borderRadius:6, color:TEXT, fontFamily:'inherit', fontSize:15, padding:'13px 15px', width:'100%', outline:'none', letterSpacing:'0.08em', boxSizing:'border-box' as const } as React.CSSProperties,
  table: { width:'100%', borderCollapse:'collapse' as const, fontSize:12 },
  th: { textAlign:'left' as const, padding:'9px 12px', fontSize:'9px', letterSpacing:'0.14em', color:MUTED, borderBottom:`1px solid ${BORDER}`, fontWeight:600, textTransform:'uppercase' as const } as React.CSSProperties,
  td: { padding:'9px 12px', borderBottom:`1px solid #111827`, verticalAlign:'middle' as const } as React.CSSProperties,
  pill: (color: string) => ({ display:'inline-block', padding:'2px 7px', borderRadius:999, fontSize:9, fontWeight:700, background:`${color}18`, color, letterSpacing:'0.08em' } as React.CSSProperties),
  btn: (v: 'primary'|'ghost'|'danger'|'success') => {
    const c = { primary:{bg:`${ACCENT}20`,border:`${ACCENT}55`,color:ACCENT}, ghost:{bg:'#ffffff08',border:'#2a3a50',color:MUTED}, danger:{bg:'#ef444420',border:'#ef444455',color:'#ef4444'}, success:{bg:'#22c55e20',border:'#22c55e55',color:'#22c55e'} }[v]
    return { background:c.bg, border:`1px solid ${c.border}`, borderRadius:5, color:c.color, cursor:'pointer', fontFamily:'inherit', fontSize:10, fontWeight:600, letterSpacing:'0.1em', padding:'7px 14px', textTransform:'uppercase' as const } as React.CSSProperties
  },
  input: { background:'#111827', border:`1px solid ${BORDER}`, borderRadius:5, color:TEXT, fontFamily:'inherit', fontSize:12, padding:'7px 10px', outline:'none', boxSizing:'border-box' as const } as React.CSSProperties,
  label: { fontSize:9, color:MUTED, letterSpacing:'0.12em', textTransform:'uppercase' as const, display:'block', marginBottom:4 },
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function InventoryDemo() {
  const [products, setProducts]   = useState<Product[]>(() => {
    try { const s = localStorage.getItem(LS_KEY + '_p'); return s ? JSON.parse(s) : DEMO_PRODUCTS } catch { return DEMO_PRODUCTS }
  })
  const [movements, setMovements] = useState<Movement[]>(() => {
    try { const s = localStorage.getItem(LS_KEY + '_m'); return s ? JSON.parse(s) : DEMO_MOVEMENTS } catch { return DEMO_MOVEMENTS }
  })

  const [tab, setTab]               = useState<Tab>('scan')
  const [scanStatus, setScanStatus] = useState<ScanStatus>('ready')
  const [scanInput, setScanInput]   = useState('')
  const [lastMsg, setLastMsg]       = useState('')
  const [lastProduct, setLastProduct] = useState<Product | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [catFilter, setCatFilter]   = useState('All')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editForm, setEditForm]     = useState<Partial<Product>>({})
  const [newBcInput, setNewBcInput] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name:'', barcodes:[], par:2, onHand:2, category:'Vodka', cost:0, active:true })
  const [newProdBc, setNewProdBc]   = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const scanRef  = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { localStorage.setItem(LS_KEY + '_p', JSON.stringify(products)) }, [products])
  useEffect(() => { localStorage.setItem(LS_KEY + '_m', JSON.stringify(movements)) }, [movements])
  useEffect(() => { if (tab === 'scan') setTimeout(() => scanRef.current?.focus(), 50) }, [tab])

  const resetSoon = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setScanStatus('ready'), 2500)
  }, [])

  const processScan = useCallback((raw: string) => {
    const code = raw.trim()
    setScanInput('')
    if (!code) return

    if (!isValidBarcode(code)) {
      setScanStatus('qr_rejected')
      setLastMsg(`QR code rejected — only UPC/EAN barcodes accepted`)
      setLastProduct(null)
      resetSoon(); return
    }

    const product = products.find(p => p.barcodes.includes(code))
    if (!product) {
      setScanStatus('notfound')
      setLastMsg(`Barcode ${code} not in system`)
      setLastProduct(null)
      resetSoon(); return
    }

    const newOnHand = product.onHand - 1
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, onHand: newOnHand } : p))
    const mv: Movement = { id:`${Date.now()}`, timestamp:Date.now(), barcode:code, productId:product.id, productName:product.name, qty:1, onHandAfter:newOnHand }
    setMovements(prev => [mv, ...prev])
    setScanStatus('scanned')
    setLastMsg(`${product.name} — ${newOnHand} of ${product.par} PAR remaining`)
    setLastProduct({ ...product, onHand: newOnHand })
    resetSoon()
  }, [products, resetSoon])

  const submitOrder = () => {
    setProducts(prev => prev.map(p => ({ ...p, onHand: p.par })))
    setMovements([])
    setConfirmClear(false)
  }

  const exportCSV = () => {
    const summary = movements.reduce((a, m) => { a[m.productId] = (a[m.productId]||0) + m.qty; return a }, {} as Record<string,number>)
    const rows = [['Product','Category','Qty','PAR','On Hand','Cost','Cost+4%']]
    Object.entries(summary).forEach(([id, qty]) => {
      const p = products.find(x => x.id === id)
      if (p) rows.push([p.name, p.category, String(qty), String(p.par), String(p.onHand), `$${p.cost.toFixed(2)}`, `$${bestCost(p).toFixed(2)}`])
    })
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], { type:'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `bar-order-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const saveEdit = () => {
    if (!editingId) return
    setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...editForm } : p))
    setEditingId(null)
  }

  const saveNew = () => {
    if (!newProduct.name?.trim()) return
    const p: Product = { id:`d${Date.now()}`, name:newProduct.name!.trim(), barcodes:newProduct.barcodes||[], par:newProduct.par||2, onHand:newProduct.onHand??newProduct.par??2, category:newProduct.category||'Other', cost:newProduct.cost||0, active:true }
    setProducts(prev => [...prev, p])
    setAddingProduct(false)
    setNewProduct({ name:'', barcodes:[], par:2, onHand:2, category:'Vodka', cost:0, active:true })
    setNewProdBc('')
  }

  const itemsBelowPar = products.filter(p => p.active && p.onHand < p.par)
  const outOfStock    = products.filter(p => p.active && p.onHand <= 0)
  const orderSummary  = movements.reduce((a, m) => { a[m.productId] = (a[m.productId]||0)+m.qty; return a }, {} as Record<string,number>)

  const filteredProducts = products
    .filter(p => catFilter === 'All' || p.category === catFilter)
    .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcodes.some(b => b.includes(productSearch)))

  // ── SCAN TAB ──
  const renderScan = () => {
    const sc = statusConfig[scanStatus]
    return (
      <div style={S.content}>
        <div style={S.statusBox(sc.color)}>
          <div style={S.dot(sc.color)} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:700, color:sc.color, letterSpacing:'0.08em' }}>{sc.label}</div>
            {lastMsg && <div style={{ fontSize:11, color:MUTED, marginTop:3 }}>{lastMsg}</div>}
          </div>
          {lastProduct && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10, color:MUTED }}>LAST SCANNED</div>
              <div style={{ fontSize:14, fontWeight:700 }}>{lastProduct.name}</div>
              <div style={{ fontSize:11, color: levelColors[stockLevel(lastProduct)] }}>{lastProduct.onHand} / {lastProduct.par} PAR</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={S.label}>Scan barcode here</label>
          <input ref={scanRef} style={S.scanInput} value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') processScan(scanInput) }} placeholder="Waiting for scan..." autoComplete="off" spellCheck={false} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { label:'Scans This Cycle', value:movements.length, color:ACCENT },
            { label:'Below PAR',        value:itemsBelowPar.length, color: itemsBelowPar.length > 0 ? '#f59e0b' : '#22c55e' },
            { label:'Out of Stock',     value:outOfStock.length,    color: outOfStock.length > 0 ? '#ef4444' : '#22c55e' },
          ].map(s => (
            <div key={s.label} style={S.card}>
              <div style={{ fontSize:9, color:MUTED, letterSpacing:'0.12em', marginBottom:6 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize:28, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {itemsBelowPar.length > 0 && (
          <div style={S.card}>
            <div style={{ fontSize:9, color:MUTED, letterSpacing:'0.12em', marginBottom:10 }}>BELOW PAR</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8 }}>
              {itemsBelowPar.map(p => (
                <div key={p.id} style={{ background:'#111827', border:`1px solid ${levelColors[stockLevel(p)]}33`, borderRadius:6, padding:'10px 12px' }}>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:3 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:levelColors[stockLevel(p)] }}>{p.onHand} of {p.par} PAR</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── PRODUCTS TAB ──
  const renderProducts = () => (
    <div style={S.content}>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <input style={{ ...S.input, width:200 }} placeholder="Search..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
        <select style={{ ...S.input, cursor:'pointer' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft:'auto' }}>
          <button style={S.btn('primary')} onClick={() => setAddingProduct(true)}>+ Add Product</button>
        </div>
      </div>

      {addingProduct && (
        <div style={{ ...S.card, border:`1px solid ${ACCENT}44`, marginBottom:14 }}>
          <div style={{ fontSize:9, color:ACCENT, letterSpacing:'0.12em', marginBottom:10 }}>NEW PRODUCT</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:8, marginBottom:10 }}>
            {[{label:'Name',key:'name',type:'text'},{label:'PAR',key:'par',type:'number'},{label:'Cost',key:'cost',type:'number'}].map(f => (
              <div key={f.key}>
                <label style={S.label}>{f.label}</label>
                <input style={{ ...S.input, width:'100%' }} type={f.type} value={(newProduct as Record<string,unknown>)[f.key] as string||''} onChange={e => setNewProduct(p => ({ ...p, [f.key]: f.type==='number' ? parseFloat(e.target.value)||0 : e.target.value }))} />
              </div>
            ))}
            <div>
              <label style={S.label}>Category</label>
              <select style={{ ...S.input, width:'100%', cursor:'pointer' }} value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category:e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={S.label}>Barcodes</label>
            <div style={{ display:'flex', gap:8, marginBottom:6 }}>
              <input style={{ ...S.input, flex:1 }} placeholder="Scan or type..." value={newProdBc} onChange={e => setNewProdBc(e.target.value)} onKeyDown={e => { if (e.key==='Enter') { if (newProdBc.trim()) setNewProduct(p => ({ ...p, barcodes:[...(p.barcodes||[]),newProdBc.trim()] })); setNewProdBc(''); e.preventDefault() } }} />
              <button style={S.btn('ghost')} onClick={() => { if (newProdBc.trim()) setNewProduct(p => ({ ...p, barcodes:[...(p.barcodes||[]),newProdBc.trim()] })); setNewProdBc('') }}>Add</button>
            </div>
            <div>{(newProduct.barcodes||[]).map(bc => <span key={bc} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#111827', border:`1px solid ${BORDER}`, borderRadius:4, padding:'2px 7px', fontSize:10, marginRight:5, marginBottom:3 }}>{bc}<span style={{ cursor:'pointer', color:'#ef4444' }} onClick={() => setNewProduct(p => ({ ...p, barcodes:(p.barcodes||[]).filter(b=>b!==bc) }))}>×</span></span>)}</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={S.btn('primary')} onClick={saveNew}>Save</button>
            <button style={S.btn('ghost')} onClick={() => setAddingProduct(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden' }}>
        <table style={S.table}>
          <thead><tr>{['Product','Category','Barcodes','PAR','On Hand','Status','Cost','Cost+4%',''].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filteredProducts.map(p => {
              const level = stockLevel(p)
              if (editingId === p.id) return (
                <tr key={p.id} style={{ background:'#0d1520' }}>
                  <td style={{ ...S.td, paddingTop:12, paddingBottom:12 }} colSpan={9}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8, marginBottom:10 }}>
                      {[{label:'Name',key:'name',type:'text'},{label:'PAR',key:'par',type:'number'},{label:'On Hand',key:'onHand',type:'number'},{label:'Cost',key:'cost',type:'number'}].map(f => (
                        <div key={f.key}>
                          <label style={S.label}>{f.label}</label>
                          <input style={{ ...S.input, width:'100%' }} type={f.type} value={(editForm as Record<string,unknown>)[f.key] as string??''} onChange={e => setEditForm(ef => ({ ...ef, [f.key]: f.type==='number' ? parseFloat(e.target.value)||0 : e.target.value }))} />
                        </div>
                      ))}
                      <div>
                        <label style={S.label}>Category</label>
                        <select style={{ ...S.input, width:'100%', cursor:'pointer' }} value={editForm.category} onChange={e => setEditForm(ef => ({ ...ef, category:e.target.value }))}>
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <label style={S.label}>Barcodes (★ = primary alias)</label>
                      <div style={{ marginBottom:6 }}>
                        {(editForm.barcodes||[]).map((bc,i) => <span key={bc} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#111827', border:`1px solid ${BORDER}`, borderRadius:4, padding:'2px 7px', fontSize:10, marginRight:5, marginBottom:3 }}>{i===0?'★ ':''}{bc}<span style={{ cursor:'pointer', color:'#ef4444' }} onClick={() => setEditForm(ef => ({ ...ef, barcodes:(ef.barcodes||[]).filter(b=>b!==bc) }))}>×</span></span>)}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <input style={{ ...S.input, width:180 }} placeholder="Add barcode..." value={newBcInput} onChange={e => setNewBcInput(e.target.value)} onKeyDown={e => { if (e.key==='Enter') { if (newBcInput.trim()) setEditForm(ef => ({ ...ef, barcodes:[...(ef.barcodes||[]),newBcInput.trim()] })); setNewBcInput(''); e.preventDefault() } }} />
                        <button style={S.btn('ghost')} onClick={() => { if (newBcInput.trim()) setEditForm(ef => ({ ...ef, barcodes:[...(ef.barcodes||[]),newBcInput.trim()] })); setNewBcInput('') }}>Add</button>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button style={S.btn('primary')} onClick={saveEdit}>Save</button>
                      <button style={S.btn('ghost')} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </td>
                </tr>
              )
              return (
                <tr key={p.id} style={{ opacity: p.active ? 1 : 0.4 }}>
                  <td style={{ ...S.td, fontWeight:600 }}>{p.name}</td>
                  <td style={{ ...S.td, color:MUTED, fontSize:11 }}>{p.category}</td>
                  <td style={S.td}>{p.barcodes.length === 0 ? <span style={{ color:'#2a3a50', fontSize:10 }}>none</span> : p.barcodes.map(b => <span key={b} style={{ display:'inline-block', background:'#111827', border:`1px solid ${BORDER}`, borderRadius:3, padding:'1px 6px', fontSize:10, marginRight:4 }}>{b}</span>)}</td>
                  <td style={{ ...S.td, textAlign:'center' }}>{p.par}</td>
                  <td style={{ ...S.td, textAlign:'center', color:levelColors[level], fontWeight:700 }}>{p.onHand}</td>
                  <td style={S.td}><span style={S.pill(levelColors[level])}>{level.toUpperCase()}</span></td>
                  <td style={{ ...S.td, color:MUTED }}>${p.cost.toFixed(2)}</td>
                  <td style={{ ...S.td, color:'#22c55e', fontWeight:600 }}>${bestCost(p).toFixed(2)}</td>
                  <td style={S.td}><button style={S.btn('ghost')} onClick={() => { setEditingId(p.id); setEditForm({ ...p }) }}>Edit</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ── MOVEMENTS TAB ──
  const renderMovements = () => {
    const orderItems = Object.entries(orderSummary).map(([id,qty]) => ({ p:products.find(x=>x.id===id), qty })).filter(x=>x.p)
    const totalBottles = orderItems.reduce((s,x) => s+x.qty, 0)
    const totalCost    = orderItems.reduce((s,x) => s+bestCost(x.p!)*x.qty, 0)
    return (
      <div style={S.content}>
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
          <div style={{ fontSize:11, color:MUTED }}>{movements.length} scans this cycle</div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button style={S.btn('ghost')} onClick={exportCSV}>Export CSV</button>
            {!confirmClear
              ? <button style={S.btn('success')} onClick={() => setConfirmClear(true)}>✓ Submit Order & Clear</button>
              : <><span style={{ fontSize:10, color:'#f59e0b' }}>Resets all on-hand to PAR. Continue?</span><button style={S.btn('success')} onClick={submitOrder}>Yes</button><button style={S.btn('ghost')} onClick={() => setConfirmClear(false)}>Cancel</button></>
            }
          </div>
        </div>

        {orderItems.length > 0 && (
          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[
                { label:'Total Bottles', value:String(totalBottles), sub:'to order', color:ACCENT },
                { label:'Estimated Bill', value:`$${totalCost.toFixed(2)}`, sub:'cost + 4% fee', color:'#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ background:BG, borderRadius:6, padding:'14px 16px' }}>
                  <div style={{ fontSize:9, color:MUTED, letterSpacing:'0.12em', marginBottom:4 }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontSize:26, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:9, color:'#2a3a50', marginTop:3 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:9, color:MUTED, letterSpacing:'0.12em', marginBottom:8 }}>LINE ITEMS</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:6 }}>
              {orderItems.map(({ p, qty }) => (
                <div key={p!.id} style={{ background:BG, borderRadius:5, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>{p!.name}</div>
                    <div style={{ fontSize:10, color:MUTED }}>{qty} × ${bestCost(p!).toFixed(2)}</div>
                  </div>
                  <div style={{ fontWeight:700, color:'#22c55e', fontSize:13 }}>${(bestCost(p!)*qty).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden' }}>
          <table style={S.table}>
            <thead><tr>{['Time','Product','Barcode','Qty','On Hand After'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {movements.length === 0 && <tr><td colSpan={5} style={{ ...S.td, textAlign:'center', color:MUTED, padding:32 }}>No scans yet this cycle</td></tr>}
              {movements.map(m => (
                <tr key={m.id}>
                  <td style={{ ...S.td, color:MUTED, fontSize:11 }}>{fmt(m.timestamp)}</td>
                  <td style={{ ...S.td, fontWeight:600 }}>{m.productName}</td>
                  <td style={{ ...S.td, color:MUTED, fontSize:10, letterSpacing:'0.06em' }}>{m.barcode}</td>
                  <td style={S.td}><span style={S.pill('#f97316')}>OUT {m.qty}</span></td>
                  <td style={{ ...S.td, color:MUTED }}>{m.onHandAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── SETTINGS TAB ──
  const renderSettings = () => (
    <div style={S.content}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {[
          { title:'Reset to PAR', desc:'Sets all on-hand counts back to PAR without clearing movements. Use for a manual count correction.', action: () => !confirmReset ? setConfirmReset(true) : (setProducts(prev => prev.map(p => ({ ...p, onHand:p.par }))), setConfirmReset(false)), btnLabel: confirmReset ? 'Confirm Reset' : 'Reset On-Hand to PAR', btnVariant: confirmReset ? 'danger' : 'ghost' as 'danger'|'ghost' },
        ].map(s => (
          <div key={s.title} style={S.card}>
            <div style={{ fontSize:9, color:MUTED, letterSpacing:'0.12em', marginBottom:6 }}>{s.title.toUpperCase()}</div>
            <p style={{ fontSize:12, color:MUTED, marginBottom:12, lineHeight:1.6 }}>{s.desc}</p>
            <button style={S.btn(s.btnVariant)} onClick={s.action}>{s.btnLabel}</button>
          </div>
        ))}
        <div style={S.card}>
          <div style={{ fontSize:9, color:MUTED, letterSpacing:'0.12em', marginBottom:6 }}>QR CODE FILTER</div>
          <p style={{ fontSize:12, color:MUTED, marginBottom:6, lineHeight:1.6 }}>Rejects any scan that isn't a 6–14 digit numeric code. Blocks QR codes, URLs, and text codes automatically.</p>
          <span style={S.pill('#22c55e')}>ENABLED</span>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:9, color:MUTED, letterSpacing:'0.12em', marginBottom:6 }}>ALIAS BARCODES</div>
          <p style={{ fontSize:12, color:MUTED, marginBottom:4, lineHeight:1.6 }}>Each product supports multiple barcodes. A 750ml and 1L of the same spirit can both map to one product. Add aliases in the Products tab.</p>
          <span style={S.pill('#22c55e')}>ENABLED</span>
        </div>
        <div style={S.card}>
          <div style={{ fontSize:9, color:MUTED, letterSpacing:'0.12em', marginBottom:6 }}>DEMO MODE</div>
          <p style={{ fontSize:12, color:MUTED, marginBottom:12, lineHeight:1.6 }}>This is a sandboxed demo. Data is stored in your browser only. Reset to restore the original demo data.</p>
          <button style={S.btn('danger')} onClick={() => { if (confirm('Reset demo to original data?')) { localStorage.removeItem(LS_KEY+'_p'); localStorage.removeItem(LS_KEY+'_m'); setProducts(DEMO_PRODUCTS); setMovements(DEMO_MOVEMENTS) } }}>Reset Demo</button>
        </div>
      </div>
    </div>
  )

  // ── RENDER ──
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Bar Inventory System</h1>
          <div style={{ fontSize:10, color:'#1e3a5f', marginTop:2, letterSpacing:'0.06em' }}>
            Scanner-driven · Alias barcodes · QR filter active · Demo
          </div>
        </div>
        <div style={{ display:'flex', gap:24, fontSize:10, color:MUTED }}>
          {[
            { label:'Products', value:products.filter(p=>p.active).length, color:ACCENT },
            { label:'Scans',    value:movements.length, color: movements.length>0 ? '#f59e0b' : '#2a3a50' },
            { label:'Below PAR', value:itemsBelowPar.length, color: itemsBelowPar.length>0 ? '#ef4444' : '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <span style={{ fontSize:16, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</span>
              <span style={{ fontSize:9, letterSpacing:'0.1em' }}>{s.label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo banner */}
      <div style={{ background:'#0f1e2f', borderBottom:`1px solid ${BORDER}`, padding:'8px 24px', fontSize:11, color:'#3b82f6', letterSpacing:'0.06em' }}>
        ◈ Demo — data is sandboxed to this browser. Nothing here affects The Copper Cup.
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {(['scan','products','movements','settings'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab===t)} onClick={() => setTab(t)}>
            {t==='scan'?'⬡ Scan':t==='products'?'▤ Products':t==='movements'?'↓ Movements':'⚙ Settings'}
          </button>
        ))}
      </div>

      {tab==='scan'      && renderScan()}
      {tab==='products'  && renderProducts()}
      {tab==='movements' && renderMovements()}
      {tab==='settings'  && renderSettings()}
    </div>
  )
}
