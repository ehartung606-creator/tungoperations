import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const COPPER = '#bc6c25'
const DARK = '#080808'
const GRAD = 'linear-gradient(135deg, #bc6c25, #8b4a14)'
const LOGO = 'https://i.postimg.cc/wvvKTCP2/Copper-Cup-logo.png'

const STAFF_PINS: Record<string, { name: string; role: string }> = {
  '1800': { name: 'Demo',    role: 'Demo' },
  '1855': { name: 'Manager', role: 'Manager' },
}

const OPENING_TASKS = [
  'Put down stools','Turn on TVs','Place trash cans',
  'Fill ice (3 buckets each side)','Place bar mats',
  'Put fruit out (cut fresh if slimy)','Put out clean menus',
  'Put lights in coolers','Make popcorn','Turn on music',
  'Turn on outside lights and Open sign','Fill caddies',
  'PROMOTE YOURSELF',
]

const CLOSING_TASKS = [
  '1:45 Lights at full brightness','1:50 Stop serving and turn music volume all the way down',
  'Get everyone out of the bar','Bring red bull tables in',
  'Turn off open sign and outside lights','LOCK THE DOOR',
  'Check bathrooms for people','Finish dishes','Clean or soak bar mats',
  'Collect and clean menus','Wipe down all of bar and tables',
  'Wipe everything (coolers / speed rails / ice wells) behind the bar stickiness',
  'Wipe out tap beer tray','Clean out popcorn machine','Put fruit trays away',
  'Put cooler lights on chargers','Put dirty towels away','Stock Beer, liquor, red bull',
  'Close out Credit Cards','Put credit card receipts away',
  'Exchange Cash Tips for big bills','Count money','Batch Credit Cards',
  'Bag money','Clock out / End Shift','Take out trash and replace liners','Lock up',
]

const TRAINING_MODULES = [
  { title: 'How to Serve a Customer', content: `1. Greet every guest within 30 seconds of sitting down.\n2. Make eye contact and smile — even when you're slammed.\n3. Know your menu cold. Recommend the mule.\n4. Ask for ID if there's any doubt. No exceptions.\n5. Keep tabs open — never let a round go untracked.\n6. Watch pacing. A guest on their 4th drink in 45 minutes gets water.\n7. Never leave a guest with an empty glass without checking in.\n8. Handle complaints immediately and with zero attitude.\n9. Thank every guest by name when they close out.\n10. Clean as you go — a dirty bar is a slow bar.` },
  { title: 'Weekly Specials', content: `Sunday — Industry Night: 20% off for industry workers\nMonday — $5 Mules all night\nTuesday — $2 off all tequila drinks & shots\nWednesday — $4 Jameson + $10 off Monster Mules\nThursday — $5 Bomb shots\nFriday — Extended Happy Hour 5–9pm\nSaturday — $2 off seltzers 4–9pm` },
  { title: 'Cash Handling', content: `Always count the drawer at the start of your shift.\nNever leave the register open between transactions.\nTip exchange: collect smaller bills, exchange for $20s or $50s.\nBag tips separately from house cash.\nIf the drawer is short, it comes out of tips — not a joke.\nReport any discrepancy to the manager immediately.\nNever lend from the drawer. Ever.` },
  { title: 'Responsible Service', content: `Check ID for anyone who looks under 30.\nAccepted: Driver's license, passport, military ID.\nRefuse service if a guest is visibly intoxicated — slurred speech, stumbling, aggression.\nOffer water and food before cutting someone off.\nIf you cut someone off, tell the manager immediately.\nNever let an intoxicated guest drive. Call a cab or Uber.\nDocument any refusals of service in the shift notes.` },
  { title: 'Emergency Procedures', content: `FIRE: Call 911. Do not use a fire extinguisher unless trained. Clear the bar calmly. Do not use elevators.\n\nMEDICAL: Call 911 first. Keep the guest calm and still. First aid kit is under the bar near the ice well. AED is by the back door.\n\nFIGHT: Do not physically intervene alone. Call manager. If escalating, call 911. Get other guests away from the area.\n\nAll incidents must be documented in the shift report.` },
  { title: 'POS Management', content: `Open a tab with card before serving — no exceptions on busy nights.\nComps must be approved by a manager before ringing.\nVoid a transaction within the same shift only.\nAll staff discounts require manager code.\nDo not share your login with other staff.\nEnd-of-night: batch all credit cards before leaving.\nReceipts go in the envelope in the register.` },
]

const MULE_RECIPES = [
  { name: 'Traditional',         ingredients: 'Smirnoff, lime juice, ginger beer' },
  { name: 'Sexy',                ingredients: 'Ciroc Mango, Cruzan Coconut Rum, pineapple, OJ, ginger beer' },
  { name: 'Berry',               ingredients: 'Ciroc Red Berry, Cherry Pucker, lime, ginger beer, raspberries' },
  { name: 'Peach',               ingredients: 'Deep Eddy Peach, Peachtree Pucker, peach puree, lime, ginger beer' },
  { name: 'Grapefruit',          ingredients: 'Deep Eddy Ruby Red, lime, Stiegl Grapefruit Beer + ginger beer' },
  { name: 'Birthday Cake',       ingredients: 'UV Vodka, Vanilla Smirnoff, simple syrup, lime, ginger beer' },
  { name: 'Watermelon',          ingredients: 'Watermelon Absolut, Exotico, watermelon puree, lime, ginger beer' },
  { name: 'Blood Orange',        ingredients: 'Bacardi Lemon, Deep Eddy Orange, blood orange syrup, lime, ginger beer' },
  { name: 'Trix Looper',         ingredients: '3 Olives Loop, simple syrup, ginger beer' },
  { name: 'Irish',               ingredients: 'Jameson, lime juice, ginger beer' },
  { name: 'Lavender',            ingredients: 'Absolut Citron, Monin Lavender, lime, ginger beer' },
  { name: 'Aperol Spritz',       ingredients: 'Aperol, OJ, orange bitters, lime, ginger beer' },
  { name: 'Habanero Pineapple',  ingredients: 'Pineapple Smirnoff, Exotico, pineapple, lime, fire bitters, ginger beer' },
  { name: 'Spicy Cucumber',      ingredients: '21 Seed, Smirnoff Cucumber, simple syrup, ginger beer' },
  { name: 'Elderflower',         ingredients: 'Smirnoff, St Germain, lemon juice, ginger beer' },
  { name: 'Mezcal',              ingredients: '400 Conejos, Ancho Reyes Verde, lime, ginger beer' },
]

const LIQUOR_LIST = [
  { tier: 'WELL',    color: '#888', items: ['Mr. Boston Vodka', 'Mr. Boston Rum', 'Mr. Boston Gin', 'Puckers', 'Triple Sec'] },
  { tier: 'CALL',    color: '#ccc', items: ['Smirnoff', "Tito's", 'Deep Eddy', 'Absolut', 'Captain Morgan', 'Bacardi', 'Jameson', 'Jack Daniels', 'Crown Royal', 'Jim Beam'] },
  { tier: 'TOP',     color: '#f59e0b', items: ['Grey Goose', 'Ketel One', "Maker's Mark", 'Patron', 'Don Julio', 'Casamigos', 'Lalo Blanco', 'Hendricks', 'Bombay Sapphire', 'Bulleit Bourbon'] },
  { tier: 'SHOT',    color: '#a78bfa', items: ['Fireball', 'Jager', 'Baileys', 'Rumple Mintz', 'Goldschlager', 'Hot Damn', 'Sambuca'] },
  { tier: 'TEQUILA', color: COPPER,   items: ['Exotico Blanco', 'Jose Cuervo', '1942 Don Julio', 'Casamigos Reposado', 'Corralejo', 'Herradura', 'Espolon'] },
  { tier: 'JAMESON', color: '#22c55e', items: ['Jameson', 'Jameson Orange'] },
]

const DENOMINATIONS = ['Quarters', '$1 Bills', '$5 Bills', '$10 Bills', '$20 Bills', '$50 Bills', '$100 Bills']
const DENOM_VALUES: Record<string, number> = {
  'Quarters': 0.25, '$1 Bills': 1, '$5 Bills': 5,
  '$10 Bills': 10, '$20 Bills': 20, '$50 Bills': 50, '$100 Bills': 100,
}

type Screen = 'login' | 'dashboard' | 'checklist' | 'training' | 'tv' | 'cash' | 'shift' | 'notifications' | 'schedule'

function getShiftDate(): string {
  const now = new Date()
  if (now.getHours() < 4) now.setDate(now.getDate() - 1)
  return now.toISOString().slice(0, 10)
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: DARK, color: '#e2e2e8', fontFamily: 'system-ui, sans-serif', paddingBottom: 72 } as React.CSSProperties,
  header: { background: '#0d0d0f', borderBottom: '1px solid #1a1a20', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 } as React.CSSProperties,
  body: { padding: '16px', maxWidth: 480, margin: '0 auto' } as React.CSSProperties,
  card: { background: '#111115', border: '1px solid #1e1e24', borderRadius: 12, padding: '16px', marginBottom: 12 } as React.CSSProperties,
  btn: { background: GRAD, border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: '14px 20px', width: '100%', letterSpacing: 0.5 } as React.CSSProperties,
  ghostBtn: { background: 'transparent', border: `1px solid ${COPPER}55`, borderRadius: 10, color: COPPER, cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '10px 16px' } as React.CSSProperties,
  input: { background: '#1a1a20', border: '1px solid #2a2a32', borderRadius: 8, color: '#e2e2e8', fontSize: 14, padding: '12px 14px', width: '100%', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  label: { fontSize: 11, color: '#666', letterSpacing: 2, textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0d0d0f', borderTop: '1px solid #1a1a20', display: 'flex', zIndex: 20 } as React.CSSProperties,
  navBtn: (active: boolean) => ({ flex: 1, padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3, color: active ? COPPER : '#444', fontSize: 18 }),
  pill: (color: string) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: `${color}20`, color, letterSpacing: 1 }),
  tab: (active: boolean) => ({ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: active ? `2px solid ${COPPER}` : '2px solid transparent', color: active ? COPPER : '#555', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 400 }),
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function StaffDemo() {
  const [screen, setScreen]         = useState<Screen>('login')
  const [pinInput, setPinInput]     = useState('')
  const [pinError, setPinError]     = useState(false)
  const [staffName, setStaffName]   = useState('')
  const [staffRole, setStaffRole]   = useState('')
  const isManager = staffRole === 'Manager'

  // Shift persistence
  const shiftKey = `coppercup_shift_${getShiftDate()}`
  const loadShift = () => {
    try { return JSON.parse(localStorage.getItem(shiftKey) || '{}') } catch { return {} }
  }
  const saveShift = (data: Record<string, unknown>) => {
    const existing = loadShift()
    localStorage.setItem(shiftKey, JSON.stringify({ ...existing, ...data }))
  }

  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>(() => loadShift().checkedTasks || {})
  const [cashCounts, setCashCounts]     = useState<Record<string, string>>(() => loadShift().cashCounts || {})
  const [openingDoneAt, setOpeningDoneAt] = useState<string | null>(() => loadShift().openingCompletedAt || null)

  // Notifications
  const notifKey = 'coppercup_notifications'
  const readKey  = `coppercup_read_${staffName}`
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; postedAt: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(notifKey) || '[]') } catch { return [] }
  })
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(readKey) || '[]') } catch { return [] }
  })
  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length

  // Persist shift data
  useEffect(() => { saveShift({ checkedTasks, cashCounts, openingCompletedAt: openingDoneAt }) }, [checkedTasks, cashCounts, openingDoneAt])

  const login = (pin: string) => {
    const staff = STAFF_PINS[pin]
    if (staff) {
      setStaffName(staff.name)
      setStaffRole(staff.role)
      setScreen('dashboard')
      setPinError(false)
    } else {
      setPinError(true)
      setTimeout(() => { setPinError(false); setPinInput('') }, 800)
    }
  }

  const pressPin = (d: string) => {
    const next = pinInput + d
    setPinInput(next)
    if (next.length === 4) login(next)
  }

  const toggleTask = (key: string) => {
    setCheckedTasks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const postNotification = (text: string) => {
    const n = { id: Date.now().toString(), text, postedAt: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) }
    const updated = [n, ...notifications]
    setNotifications(updated)
    localStorage.setItem(notifKey, JSON.stringify(updated))
  }

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    localStorage.setItem(notifKey, JSON.stringify(updated))
  }

  const markAllRead = useCallback(() => {
    const ids = notifications.map(n => n.id)
    setReadIds(ids)
    localStorage.setItem(readKey, JSON.stringify(ids))
  }, [notifications, readKey])

  // ── LOGIN ──────────────────────────────────────────────────
  if (screen === 'login') return (
    <div style={{ minHeight: '100vh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <img src={LOGO} alt="Copper Cup" style={{ width: 72 }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: COPPER, fontSize: 18, fontWeight: 700 }}>Staff Portal</div>
          <div style={{ color: '#444', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>The Copper Cup</div>
        </div>
        {/* Demo banner */}
        <div style={{ background: '#1a1500', border: '1px solid #f59e0b44', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#f59e0b', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
          Demo Mode — use PIN 1800 (Staff) or 1855 (Manager)
        </div>
        {/* PIN dots */}
        <div style={{ display: 'flex', gap: 14, animation: pinError ? 'shake 0.5s' : 'none' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: pinInput.length > i ? COPPER : '#222', border: '1px solid #333', transition: 'background 0.15s' }} />
          ))}
        </div>
        {pinError && <div style={{ color: '#ef4444', fontSize: 13 }}>Incorrect PIN</div>}
        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
            <button key={i} onClick={() => {
              if (d === '⌫') setPinInput(p => p.slice(0,-1))
              else if (d) pressPin(d)
            }} style={{ width: 72, height: 72, background: d ? '#111115' : 'transparent', border: d ? '1px solid #222' : 'none', borderRadius: 12, color: d === '⌫' ? '#888' : '#e2e2e8', fontSize: d === '⌫' ? 18 : 24, cursor: d ? 'pointer' : 'default' }}>
              {d}
            </button>
          ))}
        </div>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}`}</style>
      </div>
    </div>
  )

  // ── NAV ──────────────────────────────────────────────────
  const NAV = [
    { key: 'dashboard',  icon: '⌂', label: 'Home' },
    { key: 'schedule',   icon: '📅', label: 'Schedule' },
    { key: 'checklist',  icon: '✓', label: 'Tasks' },
    { key: 'tv',         icon: '📺', label: 'TV' },
    { key: 'training',   icon: '📖', label: 'Training' },
  ]

  const BottomNav = () => (
    <div style={S.bottomNav}>
      {NAV.map(n => (
        <button key={n.key} style={S.navBtn(screen === n.key)} onClick={() => setScreen(n.key as Screen)}>
          <span>{n.icon}</span>
          <span style={{ fontSize: 10 }}>{n.label}</span>
        </button>
      ))}
    </div>
  )

  const Header = ({ title }: { title: string }) => (
    <div style={S.header}>
      {screen !== 'dashboard' && (
        <button onClick={() => setScreen('dashboard')} style={{ background: 'none', border: 'none', color: COPPER, cursor: 'pointer', fontSize: 20, padding: 0 }}>‹</button>
      )}
      {screen === 'dashboard' && <img src={LOGO} alt="" style={{ width: 28 }} />}
      <span style={{ fontSize: 16, fontWeight: 700, color: '#e2e2e8', flex: 1 }}>{title}</span>
      <span style={{ fontSize: 12, color: '#444' }}>{staffName}</span>
    </div>
  )

  // ── DASHBOARD ──────────────────────────────────────────────
  if (screen === 'dashboard') {
    const tiles = [
      { key: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
      { key: 'schedule',      label: 'Schedule',      icon: '📅' },
      { key: 'checklist',     label: 'Tasks',         icon: '✅' },
      { key: 'tv',            label: 'TV Guide',      icon: '📺' },
      { key: 'training',      label: 'Training',      icon: '📖' },
      { key: 'cash',          label: 'Cash',          icon: '💵' },
    ]
    return (
      <div style={S.page}>
        <Header title="The Copper Cup" />
        <div style={S.body}>
          <div style={{ background: '#1a1500', border: '1px solid #f59e0b44', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#f59e0b', marginBottom: 16 }}>
            Demo Mode — shift reports will not be sent
          </div>
          {isManager && <ManagerPost onPost={postNotification} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {tiles.map(t => (
              <button key={t.key} onClick={() => setScreen(t.key as Screen)} style={{ background: '#111115', border: `1px solid #1e1e24`, borderRadius: 14, padding: '20px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, position: 'relative' }}>
                <span style={{ fontSize: 28 }}>{t.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e2e8' }}>{t.label}</span>
                {t.badge && t.badge > 0 ? (
                  <span style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
          <button onClick={() => setScreen('shift')} style={{ ...S.btn }}>
            🏁 End Shift Report
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  // ── CHECKLIST ──────────────────────────────────────────────
  if (screen === 'checklist') return <ChecklistScreen checkedTasks={checkedTasks} onToggle={toggleTask} openingDoneAt={openingDoneAt} onOpeningComplete={() => {
    const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    setOpeningDoneAt(t)
  }} Header={Header} BottomNav={BottomNav} />

  // ── TRAINING ──────────────────────────────────────────────
  if (screen === 'training') return <TrainingScreen Header={Header} BottomNav={BottomNav} />

  // ── TV ──────────────────────────────────────────────
  if (screen === 'tv') return <TVScreen Header={Header} BottomNav={BottomNav} />

  // ── CASH ──────────────────────────────────────────────
  if (screen === 'cash') return <CashScreen cashCounts={cashCounts} onChange={(k, v) => setCashCounts(prev => ({ ...prev, [k]: v }))} Header={Header} BottomNav={BottomNav} />

  // ── SHIFT ──────────────────────────────────────────────
  if (screen === 'shift') return <ShiftScreen staffName={staffName} checkedTasks={checkedTasks} cashCounts={cashCounts} openingDoneAt={openingDoneAt} onClear={() => { localStorage.removeItem(shiftKey); setCheckedTasks({}); setCashCounts({}); setOpeningDoneAt(null); setScreen('dashboard') }} Header={Header} BottomNav={BottomNav} />

  // ── NOTIFICATIONS ──────────────────────────────────────────────
  if (screen === 'notifications') return <NotificationsScreen notifications={notifications} readIds={readIds} isManager={isManager} onMarkRead={markAllRead} onDelete={deleteNotification} onPost={postNotification} Header={Header} BottomNav={BottomNav} />

  // ── SCHEDULE ──────────────────────────────────────────────
  if (screen === 'schedule') return <ScheduleScreen staffName={staffName} Header={Header} BottomNav={BottomNav} />

  return null
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function ManagerPost({ onPost }: { onPost: (t: string) => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  return (
    <div style={{ marginBottom: 16 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{ ...S.ghostBtn, width: '100%' }}>+ Post Notification to Staff</button>
      ) : (
        <div style={S.card}>
          <label style={S.label}>Message to Staff</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} style={{ ...S.input, resize: 'vertical', marginBottom: 10 }} placeholder="Type a message..." />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { if (text.trim()) { onPost(text.trim()); setText(''); setOpen(false) } }} style={{ ...S.btn, flex: 1 }}>Post</button>
            <button onClick={() => setOpen(false)} style={{ ...S.ghostBtn }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChecklistScreen({ checkedTasks, onToggle, openingDoneAt, onOpeningComplete, Header, BottomNav }: {
  checkedTasks: Record<string, boolean>
  onToggle: (k: string) => void
  openingDoneAt: string | null
  onOpeningComplete: () => void
  Header: React.FC<{ title: string }>
  BottomNav: React.FC
}) {
  const [tab, setTab] = useState<'opening' | 'closing'>('opening')
  const tasks = tab === 'opening' ? OPENING_TASKS : CLOSING_TASKS
  const prefix = tab === 'opening' ? 'open-' : 'close-'
  const done = tasks.filter(t => checkedTasks[prefix + t]).length
  const pct = Math.round((done / tasks.length) * 100)
  const allOpeningDone = OPENING_TASKS.every(t => checkedTasks['open-' + t])

  return (
    <div style={S.page}>
      <Header title="Shift Checklist" />
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a20' }}>
        <button style={S.tab(tab === 'opening')} onClick={() => setTab('opening')}>Opening</button>
        <button style={S.tab(tab === 'closing')} onClick={() => setTab('closing')}>Closing</button>
      </div>
      <div style={S.body}>
        {/* Progress bar */}
        <div style={{ background: '#1a1a20', borderRadius: 999, height: 6, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: GRAD, borderRadius: 999, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 12, color: '#555', marginBottom: 16 }}>{done} of {tasks.length} complete · {pct}%</div>

        {tasks.map(t => {
          const key = prefix + t
          const checked = !!checkedTasks[key]
          return (
            <div key={key} onClick={() => onToggle(key)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid #111115', cursor: 'pointer' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked ? COPPER : '#333'}`, background: checked ? COPPER : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                {checked && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: checked ? '#555' : '#e2e2e8', textDecoration: checked ? 'line-through' : 'none' }}>{t}</span>
            </div>
          )
        })}

        {tab === 'opening' && (
          <div style={{ marginTop: 20 }}>
            {openingDoneAt ? (
              <div style={{ background: '#0a1f0a', border: '1px solid #22c55e44', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>✓ Opening Completed at {openingDoneAt}</div>
              </div>
            ) : (
              <button onClick={onOpeningComplete} disabled={!allOpeningDone} style={{ ...S.btn, opacity: allOpeningDone ? 1 : 0.35, cursor: allOpeningDone ? 'pointer' : 'not-allowed' }}>
                Mark Opening Complete
              </button>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function TrainingScreen({ Header, BottomNav }: { Header: React.FC<{ title: string }>; BottomNav: React.FC }) {
  const [tab, setTab] = useState<'modules' | 'recipes' | 'liquor'>('modules')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  return (
    <div style={S.page}>
      <Header title="Training" />
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a20' }}>
        {(['modules','recipes','liquor'] as const).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => { setTab(t); setSearch('') }}>
            {t === 'modules' ? 'Modules' : t === 'recipes' ? 'Mule Recipes' : 'Liquor List'}
          </button>
        ))}
      </div>
      <div style={S.body}>
        {tab === 'modules' && TRAINING_MODULES.map(m => (
          <div key={m.title} style={S.card}>
            <div onClick={() => setExpanded(expanded === m.title ? null : m.title)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e2e8' }}>{m.title}</span>
              <span style={{ color: COPPER, fontSize: 18 }}>{expanded === m.title ? '−' : '+'}</span>
            </div>
            {expanded === m.title && (
              <pre style={{ marginTop: 12, fontSize: 13, color: '#888', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif', margin: '12px 0 0' }}>
                {m.content}
              </pre>
            )}
          </div>
        ))}

        {tab === 'recipes' && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes..." style={{ ...S.input, marginBottom: 12 }} />
            {MULE_RECIPES.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase())).map(r => (
              <div key={r.name} style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(expanded === r.name ? null : r.name)}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COPPER }}>{r.name} Mule</span>
                  <span style={{ color: '#555', fontSize: 18 }}>{expanded === r.name ? '−' : '+'}</span>
                </div>
                {expanded === r.name && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#888', lineHeight: 1.6 }}>{r.ingredients}</div>
                )}
              </div>
            ))}
          </>
        )}

        {tab === 'liquor' && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search liquor..." style={{ ...S.input, marginBottom: 12 }} />
            {LIQUOR_LIST.map(tier => {
              const filtered = tier.items.filter(i => !search || i.toLowerCase().includes(search.toLowerCase()))
              if (filtered.length === 0) return null
              return (
                <div key={tier.tier} style={{ marginBottom: 16 }}>
                  <div style={{ ...S.pill(tier.color), marginBottom: 8, display: 'inline-block' }}>{tier.tier}</div>
                  {filtered.map(item => (
                    <div key={item} style={{ padding: '10px 0', borderBottom: '1px solid #111115', fontSize: 14, color: '#ccc' }}>{item}</div>
                  ))}
                </div>
              )
            })}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function TVScreen({ Header, BottomNav }: { Header: React.FC<{ title: string }>; BottomNav: React.FC }) {
  const [data, setData]       = useState<{ top5: string[]; nowOn: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tv')
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      setData(json)
    } catch {
      setError('Could not load TV schedule. Make sure the API is running.')
    }
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <Header title="TV Guide" />
      <div style={S.body}>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
          AI-powered schedule — top sports events + what's on right now, prioritized for Des Moines.
        </p>
        {!data && !loading && (
          <button onClick={load} style={S.btn}>Load Schedule</button>
        )}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#555', fontSize: 14 }}>Loading schedule...</div>
        )}
        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #ef444444', borderRadius: 10, padding: '14px', color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        {data && (
          <>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Top Sports Today</div>
            {data.top5.map((item, i) => (
              <div key={i} style={{ ...S.card, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: COPPER, fontWeight: 700, fontSize: 16, minWidth: 20 }}>{i + 1}</span>
                <span style={{ fontSize: 14, color: '#e2e2e8', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', margin: '20px 0 10px' }}>On Right Now</div>
            {data.nowOn.map((item, i) => (
              <div key={i} style={{ ...S.card, fontSize: 14, color: '#ccc', lineHeight: 1.5 }}>{item}</div>
            ))}
            <button onClick={load} style={{ ...S.ghostBtn, width: '100%', marginTop: 8 }}>Refresh</button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function CashScreen({ cashCounts, onChange, Header, BottomNav }: {
  cashCounts: Record<string, string>
  onChange: (k: string, v: string) => void
  Header: React.FC<{ title: string }>
  BottomNav: React.FC
}) {
  const total = DENOMINATIONS.reduce((sum, d) => sum + (parseFloat(cashCounts[d] || '0') * DENOM_VALUES[d]), 0)
  return (
    <div style={S.page}>
      <Header title="Cash Drawer" />
      <div style={S.body}>
        {DENOMINATIONS.map(d => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #111115' }}>
            <span style={{ flex: 1, fontSize: 14, color: '#ccc' }}>{d}</span>
            <input
              type="number"
              min="0"
              value={cashCounts[d] || ''}
              onChange={e => onChange(d, e.target.value)}
              placeholder="0"
              style={{ ...S.input, width: 80, textAlign: 'right', padding: '8px 12px' }}
            />
            <span style={{ width: 72, textAlign: 'right', fontSize: 14, color: '#555' }}>
              ${((parseFloat(cashCounts[d] || '0')) * DENOM_VALUES[d]).toFixed(2)}
            </span>
          </div>
        ))}
        <div style={{ marginTop: 20, padding: '16px', background: '#111115', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, color: '#888', fontWeight: 700 }}>TOTAL</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>${total.toFixed(2)}</span>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function ShiftScreen({ staffName, checkedTasks, cashCounts, openingDoneAt, onClear, Header, BottomNav }: {
  staffName: string
  checkedTasks: Record<string, boolean>
  cashCounts: Record<string, string>
  openingDoneAt: string | null
  onClear: () => void
  Header: React.FC<{ title: string }>
  BottomNav: React.FC
}) {
  const [stockNotes, setStockNotes]   = useState('')
  const [maintNotes, setMaintNotes]   = useState('')
  const [shiftNotes, setShiftNotes]   = useState('')
  const [sent, setSent]               = useState(false)

  const openDone  = OPENING_TASKS.filter(t => checkedTasks['open-' + t]).length
  const closeDone = CLOSING_TASKS.filter(t => checkedTasks['close-' + t]).length
  const openMissed  = OPENING_TASKS.filter(t => !checkedTasks['open-' + t])
  const closeMissed = CLOSING_TASKS.filter(t => !checkedTasks['close-' + t])
  const cashTotal   = DENOMINATIONS.reduce((s, d) => s + (parseFloat(cashCounts[d] || '0') * DENOM_VALUES[d]), 0)

  const buildReport = () => {
    const lines = [
      `SHIFT REPORT — ${staffName}`,
      `Date: ${getShiftDate()}`,
      ``,
      `OPENING: ${openDone}/${OPENING_TASKS.length} tasks${openingDoneAt ? ` — Completed at ${openingDoneAt}` : ''}`,
      openMissed.length ? `Missed: ${openMissed.join(', ')}` : '',
      ``,
      `CLOSING: ${closeDone}/${CLOSING_TASKS.length} tasks`,
      closeMissed.length ? `Missed: ${closeMissed.join(', ')}` : '',
      ``,
      `CASH DRAWER: $${cashTotal.toFixed(2)}`,
      ...DENOMINATIONS.map(d => cashCounts[d] ? `  ${d}: ${cashCounts[d]}` : ''),
      ``,
      stockNotes ? `INVENTORY NOTES:\n${stockNotes}` : '',
      maintNotes ? `MAINTENANCE:\n${maintNotes}` : '',
      shiftNotes ? `SHIFT NOTES:\n${shiftNotes}` : '',
    ].filter(l => l !== '')
    return lines.join('\n')
  }

  const sendReport = () => {
    const msg = buildReport()
    // Demo mode: show the report instead of sending SMS
    alert(`DEMO — Report would be texted to Eric:\n\n${msg}`)
    setSent(true)
    setTimeout(onClear, 1500)
  }

  return (
    <div style={S.page}>
      <Header title="End Shift Report" />
      <div style={S.body}>
        <div style={{ background: '#1a1500', border: '1px solid #f59e0b44', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#f59e0b', marginBottom: 16 }}>
          Demo Mode — report will not be sent via SMS
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Summary</div>
          <div style={{ fontSize: 14, color: '#888', lineHeight: 2 }}>
            <div>Opening: <span style={{ color: openDone === OPENING_TASKS.length ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{openDone}/{OPENING_TASKS.length}</span>{openingDoneAt ? ` @ ${openingDoneAt}` : ''}</div>
            <div>Closing: <span style={{ color: closeDone === CLOSING_TASKS.length ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{closeDone}/{CLOSING_TASKS.length}</span></div>
            <div>Cash: <span style={{ color: '#22c55e', fontWeight: 700 }}>${cashTotal.toFixed(2)}</span></div>
          </div>
        </div>

        {[
          { label: 'Inventory / Low Stock Notes', value: stockNotes, set: setStockNotes },
          { label: 'Broken / Maintenance Issues', value: maintNotes, set: setMaintNotes },
          { label: 'General Shift Notes',         value: shiftNotes, set: setShiftNotes },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={S.label}>{f.label}</label>
            <textarea value={f.value} onChange={e => f.set(e.target.value)} rows={3} style={{ ...S.input, resize: 'vertical' }} placeholder="Optional..." />
          </div>
        ))}

        {sent ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#22c55e', fontWeight: 700 }}>✓ Report sent — clearing shift data...</div>
        ) : (
          <button onClick={sendReport} style={S.btn}>Send Shift Report to Owner</button>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function NotificationsScreen({ notifications, readIds, isManager, onMarkRead, onDelete, onPost, Header, BottomNav }: {
  notifications: Array<{ id: string; text: string; postedAt: string }>
  readIds: string[]
  isManager: boolean
  onMarkRead: () => void
  onDelete: (id: string) => void
  onPost: (t: string) => void
  Header: React.FC<{ title: string }>
  BottomNav: React.FC
}) {
  useEffect(() => { onMarkRead() }, [])
  return (
    <div style={S.page}>
      <Header title="Notifications" />
      <div style={S.body}>
        {isManager && <ManagerPost onPost={onPost} />}
        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#444', fontSize: 14 }}>No notifications yet</div>
        )}
        {notifications.map(n => {
          const isUnread = !readIds.includes(n.id)
          return (
            <div key={n.id} style={{ ...S.card, borderColor: isUnread ? `${COPPER}55` : '#1e1e24' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#555' }}>{n.postedAt}</span>
                {isManager && (
                  <button onClick={() => onDelete(n.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>Delete</button>
                )}
              </div>
              <div style={{ fontSize: 14, color: '#e2e2e8', lineHeight: 1.6 }}>{n.text}</div>
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}

function ScheduleScreen({ staffName, Header, BottomNav }: { staffName: string; Header: React.FC<{ title: string }>; BottomNav: React.FC }) {
  const [view, setView] = useState<'all' | 'mine'>('all')
  const [timeOff, setTimeOff] = useState('')
  const [requested, setRequested] = useState(false)

  const demoSchedule = [
    { name: 'Emma',    shifts: ['Sun 5pm–2am', 'Mon 5pm–2am', 'Fri 5pm–2am'] },
    { name: 'Cael',    shifts: ['Tue 5pm–2am', 'Wed 5pm–2am', 'Sat 4pm–2am'] },
    { name: 'Owen',    shifts: ['Thu 5pm–2am', 'Fri 5pm–2am', 'Sat 4pm–2am'] },
    { name: 'Abby',    shifts: ['Sun 5pm–2am', 'Wed 5pm–2am', 'Thu 5pm–2am'] },
    { name: 'Sydney',  shifts: ['Mon 5pm–2am', 'Tue 5pm–2am', 'Sat 4pm–2am'] },
    { name: 'Demo',    shifts: ['Fri 5pm–2am', 'Sat 4pm–2am'] },
  ]

  const filtered = view === 'mine' ? demoSchedule.filter(s => s.name === staffName || s.name === 'Demo') : demoSchedule

  return (
    <div style={S.page}>
      <Header title="Schedule" />
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid #1a1a20' }}>
        <button onClick={() => setView('all')}  style={{ ...S.ghostBtn, flex: 1, background: view === 'all'  ? `${COPPER}22` : 'transparent' }}>All Staff</button>
        <button onClick={() => setView('mine')} style={{ ...S.ghostBtn, flex: 1, background: view === 'mine' ? `${COPPER}22` : 'transparent' }}>My Shifts</button>
      </div>
      <div style={S.body}>
        <div style={{ background: '#1a1500', border: '1px solid #f59e0b44', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#f59e0b', marginBottom: 16 }}>
          Demo schedule — in production this reads from schedule.xlsx
        </div>
        {filtered.map(s => (
          <div key={s.name} style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.name === staffName || s.name === 'Demo' ? COPPER : '#e2e2e8', marginBottom: 8 }}>{s.name}</div>
            {s.shifts.map(sh => (
              <div key={sh} style={{ fontSize: 13, color: '#888', padding: '4px 0', borderBottom: '1px solid #111115' }}>{sh}</div>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e2e8', marginBottom: 10 }}>Request Time Off</div>
          <textarea value={timeOff} onChange={e => setTimeOff(e.target.value)} rows={3} style={{ ...S.input, marginBottom: 10, resize: 'vertical' }} placeholder="Dates and reason..." />
          {requested ? (
            <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 700 }}>✓ Request sent to Eric (demo — no SMS sent)</div>
          ) : (
            <button onClick={() => { if (timeOff.trim()) setRequested(true) }} style={{ ...S.btn }}>Send Request</button>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
