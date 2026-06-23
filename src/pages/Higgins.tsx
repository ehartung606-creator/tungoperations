import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// SUPABASE (same project as Inventory, public schema)
// ─────────────────────────────────────────────
const supabase = createClient(
  'https://tuagjockdooglxarkbpj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YWdqb2NrZG9vZ2x4YXJrYnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTg2NzgsImV4cCI6MjA4OTg3NDY3OH0.rMk8x5yIxf6fC5_NFclWHmQoVNsSDAFTGEbe-nVjRzY'
)

// ─────────────────────────────────────────────
// PASSWORD GATE
// ─────────────────────────────────────────────
const HIGGINS_PW = 'wtpnd!1984'

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)

  const submit = () => {
    if (input === HIGGINS_PW) { onUnlock() }
    else { setShake(true); setTimeout(() => { setShake(false); setInput('') }, 600) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d0c', display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:'Georgia, serif' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24,
        animation: shake ? 'shake 0.5s ease' : 'none' }}>
        <div style={{ color:'#B8651A', fontSize:11, letterSpacing:6, textTransform:'uppercase' }}>Higgins</div>
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Password"
          autoFocus
          style={{ background:'#1a1a18', border:'1px solid #2c2c2a', borderRadius:8,
            padding:'12px 16px', color:'#e8e8e6', fontSize:15, fontFamily:'Georgia, serif',
            textAlign:'center', width:240 }}
        />
        <button onClick={submit} style={{ background:'#B8651A', color:'#fff', border:'none',
          borderRadius:8, padding:'10px 28px', fontSize:14, fontWeight:600, cursor:'pointer',
          fontFamily:'Georgia, serif' }}>Enter</button>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-8px)}80%{transform:translateX(8px)}}`}</style>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TASK BOARD
// ─────────────────────────────────────────────
interface Task {
  id: number
  title: string
  status: string
  category: string | null
  sort_order: number
  completed_at: string | null
  archived_at: string | null
}

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'Doing' },
  { key: 'done', label: 'Done' },
  { key: 'backburner', label: 'Back Burner' },
]

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [archived, setArchived] = useState<Task[]>([])
  const [view, setView] = useState<'board' | 'archive'>('board')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')

  async function cleanup() {
    const now = Date.now()
    const { data: doneTasks } = await supabase
      .from('life_os_tasks').select('*')
      .eq('status', 'done').is('archived_at', null)
    if (doneTasks) {
      for (const t of doneTasks) {
        if (t.completed_at && now - new Date(t.completed_at).getTime() > DAY) {
          await supabase.from('life_os_tasks')
            .update({ archived_at: new Date().toISOString() }).eq('id', t.id)
        }
      }
    }
    const cutoff = new Date(now - 30 * DAY).toISOString()
    await supabase.from('life_os_tasks').delete()
      .not('archived_at', 'is', null).lt('archived_at', cutoff)
  }

  async function load() {
    setLoading(true)
    await cleanup()
    const { data: active, error: e1 } = await supabase
      .from('life_os_tasks').select('*')
      .is('archived_at', null).order('sort_order', { ascending: true })
    const { data: arch } = await supabase
      .from('life_os_tasks').select('*')
      .not('archived_at', 'is', null).order('archived_at', { ascending: false })
    if (e1) setError(e1.message)
    else { setTasks(active || []); setArchived(arch || []) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function move(task: Task, newStatus: string) {
    const updates: any = { status: newStatus }
    updates.completed_at = newStatus === 'done' ? new Date().toISOString() : null
    await supabase.from('life_os_tasks').update(updates).eq('id', task.id)
    load()
  }

  async function addTask() {
    if (!newTitle.trim()) return
    await supabase.from('life_os_tasks').insert({ title: newTitle.trim(), status: 'todo' })
    setNewTitle('')
    load()
  }

  function doneAgoLabel(t: Task) {
    if (!t.completed_at) return ''
    const mins = Math.floor((Date.now() - new Date(t.completed_at).getTime()) / 60000)
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago · archives in ${24 - Math.floor(mins / 60)}h`
  }

  const card = (task: Task) => (
    <div key={task.id} style={{ background: '#0f0f0e', border: '1px solid #2c2c2a',
      borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
      <div style={{ fontSize: 13, lineHeight: 1.4 }}>{task.title}</div>
      {task.category && <div style={{ fontSize: 9, color: '#888',
        textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{task.category}</div>}
      {task.status === 'done' && <div style={{ fontSize: 9, color: '#6a6', marginTop: 4 }}>{doneAgoLabel(task)}</div>}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {COLUMNS.filter(c => c.key !== task.status).map(c => (
          <button key={c.key} onClick={() => move(task, c.key)}
            style={{ fontSize: 9, background: '#2c2c2a', color: '#ccc', border: 'none',
              borderRadius: 4, padding: '3px 7px', cursor: 'pointer' }}>
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0c', color: '#e8e8e6',
      fontFamily: '-apple-system, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#B8651A', fontSize: 11, fontWeight: 800,
            letterSpacing: 3, textTransform: 'uppercase' }}>Tung Operations · Higgins</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>Task Board</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '16px 0' }}>
          <button onClick={() => setView('board')} style={{ fontSize: 11, fontWeight: 700,
            padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: view === 'board' ? '#B8651A' : '#2c2c2a',
            color: view === 'board' ? '#fff' : '#aaa' }}>Board</button>
          <button onClick={() => setView('archive')} style={{ fontSize: 11, fontWeight: 700,
            padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: view === 'archive' ? '#B8651A' : '#2c2c2a',
            color: view === 'archive' ? '#fff' : '#aaa' }}>Archive ({archived.length})</button>
        </div>

        {view === 'board' && (
          <div style={{ display: 'flex', gap: 8, maxWidth: 500, margin: '0 auto 20px' }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add a task..."
              style={{ flex: 1, background: '#1a1a18', border: '1px solid #2c2c2a',
                borderRadius: 6, padding: '8px 12px', color: '#e8e8e6', fontSize: 13 }} />
            <button onClick={addTask} style={{ background: '#B8651A', color: '#fff', border: 'none',
              borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add</button>
          </div>
        )}

        {loading && <p style={{ color: '#888', textAlign: 'center' }}>Loading...</p>}
        {error && <p style={{ color: '#ef5350', textAlign: 'center' }}>Error: {error}</p>}

        {view === 'board' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {COLUMNS.map(col => (
              <div key={col.key} style={{ background: '#1a1a18', border: '1px solid #2c2c2a',
                borderRadius: 12, padding: 14, maxHeight: '70vh', overflowY: 'auto' }}>
                <h3 style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2,
                  textTransform: 'uppercase', color: '#B8651A', marginBottom: 12 }}>
                  {col.label} ({tasks.filter(t => t.status === col.key).length})</h3>
                {tasks.filter(t => t.status === col.key).map(card)}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {archived.length === 0 && <p style={{ color: '#888', textAlign: 'center' }}>Nothing archived yet.</p>}
            {archived.map(t => (
              <div key={t.id} style={{ background: '#1a1a18', border: '1px solid #2c2c2a',
                borderRadius: 8, padding: '10px 14px', marginBottom: 8, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#bbb' }}>✓ {t.title}</span>
                <span style={{ fontSize: 10, color: '#666' }}>
                  {t.archived_at ? new Date(t.archived_at).toLocaleDateString() : ''}</span>
              </div>
            ))}
            {archived.length > 0 && <p style={{ fontSize: 10, color: '#555', textAlign: 'center',
              marginTop: 16 }}>Archived tasks auto-delete after 30 days.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// PAGE (gate wraps board)
// ─────────────────────────────────────────────
export default function Higgins() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />
  return <TaskBoard />
}
