import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tuagjockdooglxarkbpj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YWdqb2NrZG9vZ2x4YXJrYnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTg2NzgsImV4cCI6MjA4OTg3NDY3OH0.rMk8x5yIxf6fC5_NFclWHmQoVNsSDAFTGEbe-nVjRzY'
)

const HIGGINS_PW = 'wtpnd!1984'
const SHAKE_CSS = '@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}'

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const submit = () => {
    if (input === HIGGINS_PW) { onUnlock() }
    else { setShake(true); setTimeout(() => { setShake(false); setInput('') }, 600) }
  }
  return (
    <div style={{ minHeight:'100vh', background:'#1B3A5B', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia, serif', padding:24 }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24, animation: shake ? 'shake 0.5s ease' : 'none' }}>
        <div style={{ color:'#9E4A52', fontSize:11, letterSpacing:6, textTransform:'uppercase' }}>Higgins</div>
        <input type="password" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Password" autoFocus style={{ background:'#FAF8F2', border:'1px solid #d4d9e0', borderRadius:8, padding:'14px 16px', color:'#1a1a1a', fontSize:16, fontFamily:'Georgia, serif', textAlign:'center', width:240 }} />
        <button onClick={submit} style={{ background:'#9E4A52', color:'#fff', border:'none', borderRadius:8, padding:'12px 32px', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'Georgia, serif' }}>Enter</button>
        <style>{SHAKE_CSS}</style>
      </div>
    </div>
  )
}

interface Task { id: number; title: string; status: string; category: string | null; sort_order: number; completed_at: string | null; archived_at: string | null; due_date: string | null }
interface EventRow { id: number; title: string; event_date: string; event_time: string | null; note: string | null; source: string; category: string | null; location: string | null }
interface Trip { id: number; title: string; start_date: string | null; end_date: string | null; destination: string | null; notes: string | null }
interface Booking { id: number; trip_id: number; kind: string; label: string | null; date: string | null; time: string | null; confirmation: string | null; notes: string | null }

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'Doing' },
  { key: 'done', label: 'Done' },
  { key: 'backburner', label: 'Back Burner' },
]
const DAY = 24 * 60 * 60 * 1000

const VIOLET = '#9E4A52'
const COPPER = '#B8651A'
const SKY = '#2A6FA0'
const TEAL = '#1F8466'
const CRIMSON = '#C23A3F'
const CAT_COLORS: Record<string, string> = {
  personal: VIOLET, ops: COPPER, bar: COPPER, coppercup: COPPER,
  travel: SKY, trip: SKY, finance: TEAL, money: TEAL, financial: TEAL,
  legal: TEAL, urgent: CRIMSON,
}
function catColor(cat: string | null) {
  if (!cat) return '#888'
  return CAT_COLORS[cat.toLowerCase().trim()] || '#888'
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return isMobile
}

function ymd(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function TaskBoard() {
  const isMobile = useIsMobile()
  const [tasks, setTasks] = useState<Task[]>([])
  const [archived, setArchived] = useState<Task[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [view, setView] = useState<'board' | 'week' | 'trips' | 'archive'>('board')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  // add-event form state
  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evTime, setEvTime] = useState('')
  const [evCat, setEvCat] = useState('personal')
  const [evNote, setEvNote] = useState('')

  // add-trip form state
  const [trTitle, setTrTitle] = useState('')
  const [trDest, setTrDest] = useState('')
  const [trStart, setTrStart] = useState('')
  const [trEnd, setTrEnd] = useState('')

  async function cleanup() {
    const now = Date.now()
    const { data: doneTasks } = await supabase.from('life_os_tasks').select('*').eq('status', 'done').is('archived_at', null)
    if (doneTasks) {
      for (const t of doneTasks) {
        if (t.completed_at && now - new Date(t.completed_at).getTime() > DAY) {
          await supabase.from('life_os_tasks').update({ archived_at: new Date().toISOString() }).eq('id', t.id)
        }
      }
    }
    const cutoff = new Date(now - 30 * DAY).toISOString()
    await supabase.from('life_os_tasks').delete().not('archived_at', 'is', null).lt('archived_at', cutoff)
  }

  async function load() {
    setLoading(true)
    await cleanup()
    const { data: active, error: e1 } = await supabase.from('life_os_tasks').select('*').is('archived_at', null).order('sort_order', { ascending: true })
    const { data: arch } = await supabase.from('life_os_tasks').select('*').not('archived_at', 'is', null).order('archived_at', { ascending: false })
    const { data: evs } = await supabase.from('life_os_events').select('*').order('event_date', { ascending: true })
    const { data: trs } = await supabase.from('life_os_trips').select('*').order('start_date', { ascending: true })
    const { data: bks } = await supabase.from('life_os_bookings').select('*').order('date', { ascending: true })
    if (e1) setError(e1.message)
    else { setTasks(active || []); setArchived(arch || []); setEvents(evs || []); setTrips(trs || []); setBookings(bks || []) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function move(task: Task, newStatus: string) {
    const updates: { status: string; completed_at: string | null } = { status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null }
    await supabase.from('life_os_tasks').update(updates).eq('id', task.id)
    load()
  }

  async function addTask() {
    if (!newTitle.trim()) return
    const maxSort = tasks.filter(t => t.status === 'todo').reduce((m, t) => Math.max(m, t.sort_order), 0)
    await supabase.from('life_os_tasks').insert({ title: newTitle.trim(), status: 'todo', sort_order: maxSort + 10 })
    setNewTitle('')
    load()
  }

  async function deleteTask(task: Task) {
    if (!window.confirm('Delete "' + task.title + '"?')) return
    await supabase.from('life_os_tasks').delete().eq('id', task.id)
    load()
  }

  function startEdit(task: Task) { setEditingId(task.id); setEditText(task.title) }
  async function saveEdit(task: Task) {
    if (editText.trim() && editText.trim() !== task.title) {
      await supabase.from('life_os_tasks').update({ title: editText.trim() }).eq('id', task.id)
    }
    setEditingId(null); setEditText('')
    load()
  }

  async function reorder(task: Task, dir: 'up' | 'down') {
    const colTasks = tasks.filter(t => t.status === task.status).sort((a, b) => a.sort_order - b.sort_order)
    const idx = colTasks.findIndex(t => t.id === task.id)
    const swapWith = dir === 'up' ? colTasks[idx - 1] : colTasks[idx + 1]
    if (!swapWith) return
    await supabase.from('life_os_tasks').update({ sort_order: swapWith.sort_order }).eq('id', task.id)
    await supabase.from('life_os_tasks').update({ sort_order: task.sort_order }).eq('id', swapWith.id)
    load()
  }

  async function setDue(task: Task, date: string) {
    await supabase.from('life_os_tasks').update({ due_date: date || null }).eq('id', task.id)
    load()
  }

  async function addEvent() {
    if (!evTitle.trim() || !evDate) { window.alert('Event needs a title and a date.'); return }
    await supabase.from('life_os_events').insert({ title: evTitle.trim(), event_date: evDate, event_time: evTime || null, category: evCat || null, note: evNote || null, source: 'manual' })
    setEvTitle(''); setEvDate(''); setEvTime(''); setEvCat('personal'); setEvNote('')
    load()
  }

  async function deleteEvent(ev: EventRow) {
    if (!window.confirm('Delete "' + ev.title + '"?')) return
    await supabase.from('life_os_events').delete().eq('id', ev.id)
    load()
  }

  async function addTrip() {
    if (!trTitle.trim()) { window.alert('Trip needs a title.'); return }
    await supabase.from('life_os_trips').insert({ title: trTitle.trim(), destination: trDest || null, start_date: trStart || null, end_date: trEnd || null })
    setTrTitle(''); setTrDest(''); setTrStart(''); setTrEnd('')
    load()
  }

  async function deleteTrip(tr: Trip) {
    if (!window.confirm('Delete trip "' + tr.title + '" and all its bookings?')) return
    await supabase.from('life_os_trips').delete().eq('id', tr.id)
    load()
  }

  async function addBooking(tripId: number, kind: string, label: string, date: string, time: string, confirmation: string) {
    if (!label.trim()) { window.alert('Booking needs a label.'); return }
    await supabase.from('life_os_bookings').insert({ trip_id: tripId, kind, label: label.trim(), date: date || null, time: time || null, confirmation: confirmation || null })
    load()
  }

  async function deleteBooking(b: Booking) {
    await supabase.from('life_os_bookings').delete().eq('id', b.id)
    load()
  }

  function doneAgoLabel(t: Task) {
    if (!t.completed_at) return ''
    const mins = Math.floor((Date.now() - new Date(t.completed_at).getTime()) / 60000)
    if (mins < 60) return mins + 'm ago'
    const hrs = Math.floor(mins / 60)
    return hrs + 'h ago · archives in ' + (24 - hrs) + 'h'
  }

  const btnFont = isMobile ? 13 : 9
  const btnPad = isMobile ? '8px 14px' : '3px 7px'
  const iconBtn = { fontSize: isMobile ? 15 : 12, background: 'transparent', color: '#778', border: 'none', cursor: 'pointer', padding: '2px 5px' }
  const tabStyle = (active: boolean) => ({ fontSize: 12, fontWeight: 700 as const, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? '#9E4A52' : '#FAF8F2', color: active ? '#fff' : '#556' })
  const fieldStyle = { background: '#FAF8F2', border: '1px solid #d4d9e0', borderRadius: 6, padding: '10px 12px', color: '#1a1a1a', fontSize: 14, colorScheme: 'light' as const }

  const card = (task: Task, colTasks: Task[]) => {
    const idx = colTasks.findIndex(t => t.id === task.id)
    const isEditing = editingId === task.id
    return (
      <div key={task.id} style={{ background: '#F1EEE6', border: '1px solid #d4d9e0', borderRadius: 8, padding: isMobile ? '14px 14px' : '10px 12px', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          {isEditing ? (
            <input value={editText} autoFocus onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(task); if (e.key === 'Escape') { setEditingId(null); setEditText('') } }} onBlur={() => saveEdit(task)} style={{ flex: 1, background: '#FAF8F2', border: '1px solid #9E4A52', borderRadius: 4, padding: '4px 8px', color: '#1a1a1a', fontSize: isMobile ? 15 : 13 }} />
          ) : (
            <div style={{ fontSize: isMobile ? 15 : 13, lineHeight: 1.4, flex: 1 }}>{task.title}</div>
          )}
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button title="Up" onClick={() => reorder(task, 'up')} disabled={idx === 0} style={{ ...iconBtn, opacity: idx === 0 ? 0.25 : 1 }}>▲</button>
            <button title="Down" onClick={() => reorder(task, 'down')} disabled={idx === colTasks.length - 1} style={{ ...iconBtn, opacity: idx === colTasks.length - 1 ? 0.25 : 1 }}>▼</button>
            <button title="Edit" onClick={() => startEdit(task)} style={iconBtn}>✎</button>
            <button title="Delete" onClick={() => deleteTask(task)} style={{ ...iconBtn, color: '#a55' }}>✕</button>
          </div>
        </div>
        {task.category && <div style={{ fontSize: isMobile ? 10 : 9, color: catColor(task.category), textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, fontWeight: 700 }}>{task.category}</div>}
        <div style={{ marginTop: 6 }}>
          <input type="date" value={task.due_date || ''} onChange={e => setDue(task, e.target.value)} style={{ fontSize: isMobile ? 11 : 10, background: '#FAF8F2', border: '1px solid #d4d9e0', borderRadius: 4, padding: '3px 6px', color: task.due_date ? '#9E4A52' : '#666', colorScheme: 'light' }} />
        </div>
        {task.status === 'done' && <div style={{ fontSize: isMobile ? 11 : 9, color: '#2e7d4f', marginTop: 4 }}>{doneAgoLabel(task)}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {COLUMNS.filter(c => c.key !== task.status).map(c => (
            <button key={c.key} onClick={() => move(task, c.key)} style={{ fontSize: btnFont, background: '#e6e9ee', color: '#333', border: 'none', borderRadius: 6, padding: btnPad, cursor: 'pointer' }}>{'\u2192 ' + c.label}</button>
          ))}
        </div>
      </div>
    )
  }

  const column = (col: { key: string; label: string }) => {
    const colTasks = tasks.filter(t => t.status === col.key).sort((a, b) => a.sort_order - b.sort_order)
    return (
      <div key={col.key} style={{ background: '#FAF8F2', border: '1px solid #d4d9e0', borderRadius: 12, padding: 14, maxHeight: isMobile ? 'none' : '70vh', overflowY: isMobile ? 'visible' : 'auto', marginBottom: isMobile ? 14 : 0 }}>
        <h3 style={{ fontSize: isMobile ? 12 : 10, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#9E4A52', marginBottom: 12 }}>{col.label} ({colTasks.length})</h3>
        {colTasks.map(t => card(t, colTasks))}
      </div>
    )
  }

  const weekView = () => {
    const today = new Date(); today.setHours(0,0,0,0)
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d })
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ background: '#FAF8F2', border: '1px solid #d4d9e0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9E4A52', marginBottom: 10 }}>Add an event</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="What is it?" style={fieldStyle} />
            <input type="date" value={evDate} onChange={e => setEvDate(e.target.value)} style={fieldStyle} />
            <input value={evTime} onChange={e => setEvTime(e.target.value)} placeholder="Time (e.g. 10:30 AM)" style={fieldStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr auto', gap: 8 }}>
            <select value={evCat} onChange={e => setEvCat(e.target.value)} style={fieldStyle}>
              <option value="personal">Personal</option>
              <option value="ops">Bar / Ops</option>
              <option value="travel">Travel</option>
              <option value="finance">Finance</option>
              <option value="urgent">Urgent</option>
            </select>
            <input value={evNote} onChange={e => setEvNote(e.target.value)} placeholder="Note (optional)" style={fieldStyle} />
            <button onClick={addEvent} style={{ background: '#9E4A52', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add</button>
          </div>
        </div>
        {days.map((d, i) => {
          const key = ymd(d)
          const dayEvents = events.filter(e => e.event_date === key)
          const dayTasks = tasks.filter(t => t.due_date === key)
          const isToday = i === 0
          return (
            <div key={key} style={{ background: '#FAF8F2', border: isToday ? '1px solid #9E4A52' : '1px solid #d4d9e0', borderRadius: 12, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: dayEvents.length || dayTasks.length ? 10 : 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: isToday ? '#9E4A52' : '#1a1a1a', textTransform: 'uppercase', letterSpacing: 1 }}>{isToday ? 'TODAY' : dayNames[d.getDay()]}</span>
                <span style={{ fontSize: 12, color: '#667' }}>{monthNames[d.getMonth()] + ' ' + d.getDate()}</span>
              </div>
              {dayEvents.map(e => (
                <div key={'e'+e.id} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: '1px solid #e2e5ea', alignItems: 'flex-start' }}>
                  {e.event_time && <span style={{ fontSize: 12, color: '#9E4A52', fontWeight: 700, minWidth: 64 }}>{e.event_time}</span>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14 }}>{e.title}{e.category && <span style={{ fontSize: 9, color: catColor(e.category), textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8, fontWeight: 700 }}>{e.category}</span>}</div>
                    {e.note && <div style={{ fontSize: 11, color: '#667', marginTop: 2 }}>{e.note}</div>}
                  </div>
                  <button onClick={() => deleteEvent(e)} style={{ ...iconBtn, color: '#a55' }}>✕</button>
                </div>
              ))}
              {dayTasks.map(t => (
                <div key={'t'+t.id} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: '1px solid #e2e5ea' }}>
                  <span style={{ fontSize: 12, color: '#2e7d4f', fontWeight: 700, minWidth: 64 }}>TASK</span>
                  <div style={{ fontSize: 14 }}>{t.title}</div>
                </div>
              ))}
              {!dayEvents.length && !dayTasks.length && <div style={{ fontSize: 12, color: '#99a' }}>Nothing scheduled</div>}
            </div>
          )
        })}
      </div>
    )
  }

  const tripsView = () => {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ background: '#FAF8F2', border: '1px solid #d4d9e0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9E4A52', marginBottom: 10 }}>Add a trip</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 2fr 1fr 1fr auto', gap: 8 }}>
            <input value={trTitle} onChange={e => setTrTitle(e.target.value)} placeholder="Trip name" style={fieldStyle} />
            <input value={trDest} onChange={e => setTrDest(e.target.value)} placeholder="Destination" style={fieldStyle} />
            <input type="date" value={trStart} onChange={e => setTrStart(e.target.value)} style={fieldStyle} />
            <input type="date" value={trEnd} onChange={e => setTrEnd(e.target.value)} style={fieldStyle} />
            <button onClick={addTrip} style={{ background: '#9E4A52', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add</button>
          </div>
        </div>
        {trips.length === 0 && <p style={{ color: '#667', textAlign: 'center' }}>No trips yet.</p>}
        {trips.map(tr => (
          <TripCard key={tr.id} trip={tr} bookings={bookings.filter(b => b.trip_id === tr.id)}
            onAddBooking={addBooking} onDeleteBooking={deleteBooking} onDeleteTrip={deleteTrip}
            fieldStyle={fieldStyle} iconBtn={iconBtn} isMobile={isMobile} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1B3A5B', color: '#1a1a1a', fontFamily: '-apple-system, sans-serif', padding: isMobile ? 16 : 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#9E4A52', fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' }}>Tung Operations · Higgins</div>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, marginTop: 4, color: '#FAF8F2' }}>{view === 'week' ? 'The Week' : view === 'trips' ? 'Trips' : 'Task Board'}</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '16px 0', flexWrap: 'wrap' }}>
          <button onClick={() => setView('board')} style={tabStyle(view === 'board')}>Board</button>
          <button onClick={() => setView('week')} style={tabStyle(view === 'week')}>Week</button>
          <button onClick={() => setView('trips')} style={tabStyle(view === 'trips')}>Trips</button>
          <button onClick={() => setView('archive')} style={tabStyle(view === 'archive')}>Archive ({archived.length})</button>
        </div>
        {view === 'board' && (
          <div style={{ display: 'flex', gap: 8, maxWidth: 500, margin: '0 auto 20px' }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="Add a task..." style={{ flex: 1, background: '#FAF8F2', border: '1px solid #d4d9e0', borderRadius: 6, padding: '12px 14px', color: '#1a1a1a', fontSize: 15 }} />
            <button onClick={addTask} style={{ background: '#9E4A52', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Add</button>
          </div>
        )}
        {view === 'board' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <a href="https://www.jigsawexplorer.com" target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 6, background: '#FAF8F2', border: '1px solid #d4d9e0', color: '#9E4A52', textDecoration: 'none' }}>🧩 Jigsaw</a>
            <a href="https://www.nytimes.com/puzzles/sudoku" target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 6, background: '#FAF8F2', border: '1px solid #d4d9e0', color: '#9E4A52', textDecoration: 'none' }}>🔢 Sudoku</a>
          </div>
        )}
        {loading && <p style={{ color: '#667', textAlign: 'center' }}>Loading...</p>}
        {error && <p style={{ color: '#ef5350', textAlign: 'center' }}>Error: {error}</p>}
        {view === 'board' && (isMobile ? (<div>{COLUMNS.map(column)}</div>) : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>{COLUMNS.map(column)}</div>))}
        {view === 'week' && weekView()}
        {view === 'trips' && tripsView()}
        {view === 'archive' && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {archived.length === 0 && <p style={{ color: '#667', textAlign: 'center' }}>Nothing archived yet.</p>}
            {archived.map(t => (
              <div key={t.id} style={{ background: '#FAF8F2', border: '1px solid #d4d9e0', borderRadius: 8, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: '#556' }}>{'\u2713 ' + t.title}</span>
                <span style={{ fontSize: 11, color: '#889', flexShrink: 0 }}>{t.archived_at ? new Date(t.archived_at).toLocaleDateString() : ''}</span>
              </div>
            ))}
            {archived.length > 0 && <p style={{ fontSize: 11, color: '#99a', textAlign: 'center', marginTop: 16 }}>Archived tasks auto-delete after 30 days.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function TripCard({ trip, bookings, onAddBooking, onDeleteBooking, onDeleteTrip, fieldStyle, iconBtn, isMobile }: any) {
  const [kind, setKind] = useState('flight')
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [conf, setConf] = useState('')
  const [open, setOpen] = useState(false)

  const kindIcon: Record<string, string> = { flight: '✈️', hotel: '🏨', car: '🚗', other: '📌' }

  return (
    <div style={{ background: '#FAF8F2', border: '1px solid #d4d9e0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{trip.title}</div>
          <div style={{ fontSize: 12, color: '#667', marginTop: 2 }}>
            {trip.destination ? trip.destination : ''}{trip.destination && (trip.start_date || trip.end_date) ? ' · ' : ''}
            {trip.start_date || ''}{trip.end_date ? ' → ' + trip.end_date : ''}
          </div>
        </div>
        <button onClick={() => onDeleteTrip(trip)} style={{ ...iconBtn, color: '#a55' }}>✕</button>
      </div>

      {bookings.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {bookings.map((b: Booking) => (
            <div key={b.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid #e2e5ea', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 15, minWidth: 24 }}>{kindIcon[b.kind] || '📌'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{b.label}</div>
                <div style={{ fontSize: 12, color: '#667', marginTop: 2 }}>
                  {b.date || ''}{b.time ? ' · ' + b.time : ''}
                  {b.confirmation ? <span> · Conf: <span style={{ color: '#9E4A52', fontWeight: 700 }}>{b.confirmation}</span></span> : null}
                </div>
              </div>
              <button onClick={() => onDeleteBooking(b)} style={{ ...iconBtn, color: '#a55' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div style={{ marginTop: 12, borderTop: '1px solid #e2e5ea', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <select value={kind} onChange={e => setKind(e.target.value)} style={fieldStyle}>
              <option value="flight">Flight</option>
              <option value="hotel">Hotel</option>
              <option value="car">Car</option>
              <option value="other">Other</option>
            </select>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. United DSM→EWR" style={fieldStyle} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={fieldStyle} />
            <input value={time} onChange={e => setTime(e.target.value)} placeholder="Time" style={fieldStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr auto auto', gap: 8 }}>
            <input value={conf} onChange={e => setConf(e.target.value)} placeholder="Confirmation #" style={fieldStyle} />
            <button onClick={() => { onAddBooking(trip.id, kind, label, date, time, conf); setLabel(''); setDate(''); setTime(''); setConf(''); setOpen(false) }} style={{ background: '#9E4A52', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            <button onClick={() => setOpen(false)} style={{ background: '#e6e9ee', color: '#333', border: 'none', borderRadius: 6, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{ marginTop: 12, background: '#e6e9ee', color: '#333', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add flight / hotel / confirmation</button>
      )}
    </div>
  )
}

export default function Higgins() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />
  return <TaskBoard />
}
