export default function Demo() {
  const demos: { id: string; title: string; description: string; color: string; status: string; href?: string }[] = [
    {
      id: 'inventory',
      href: '/demo/inventory',
      title: 'Inventory System',
      description: 'Scanner-driven bottle tracking for bars. Alias barcodes, live sync across devices, automatic order summaries.',
      color: '#aa3bff',
      status: 'live',
    },
    {
      id: 'staff',
      href: '/demo/staff',
      title: 'Staff App',
      description: 'PIN-based staff portal with shift checklists, notifications inbox, schedule viewer, and cash management.',
      color: '#bc6c25',
      status: 'live',
    },
    {
      id: 'social',
      href: '',
      title: 'Social Media Engine',
      description: 'AI-powered content generation using real bar photos, weekly specials, and national day hooks. Integrated with Publer.',
      color: '#22c55e',
      status: 'live',
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      fontFamily: 'Georgia, serif',
      color: '#e2e2e8',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #161616',
        padding: '24px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <a href="/" style={{
          color: '#444', fontSize: 11, letterSpacing: 4,
          textTransform: 'uppercase', textDecoration: 'none',
        }}>
          ← Tung Operations
        </a>
        <span style={{ color: '#222' }}>|</span>
        <span style={{ color: '#bc6c25', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>
          Demo Lab
        </span>
      </div>

      {/* Hero */}
      <div style={{
        padding: '64px 40px 48px',
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div style={{
          fontSize: 11, color: '#444', letterSpacing: 6,
          textTransform: 'uppercase', marginBottom: 16,
        }}>
          Tung Operations
        </div>
        <h1 style={{
          fontSize: 42, fontWeight: 400, margin: '0 0 16px',
          color: '#e2e2e8', lineHeight: 1.15,
        }}>
          Demo Lab
        </h1>
        <p style={{
          fontSize: 15, color: '#555', lineHeight: 1.7, margin: 0, maxWidth: 520,
        }}>
          A collection of AI-assisted tools built for The Copper Cup and beyond.
          Each demo is a working prototype you can interact with.
        </p>
      </div>

      {/* Demo cards */}
      <div style={{
        padding: '0 40px 80px',
        maxWidth: 900,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 20,
      }}>
        {demos.map(d => (
          <div key={d.id} style={{
            background: '#0f0f12',
            border: `1px solid ${d.color}22`,
            borderRadius: 16,
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            cursor: 'default',
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${d.color}55`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = `${d.color}22`)}
          >
            <div>
              <div style={{
                fontSize: 17, fontWeight: 700, color: '#e2e2e8', marginBottom: 8,
              }}>
                {d.title}
              </div>
              <div style={{
                fontSize: 13, color: '#555', lineHeight: 1.65,
              }}>
                {d.description}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
                color: d.color, fontFamily: "'IBM Plex Mono', monospace",
              }}>
                ● {d.status}
              </span>
              {d.href ? (
                <a href={d.href} style={{ fontSize: 11, color: d.color, letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', fontWeight: 700 }}>View Demo →</a>
              ) : (
                <span style={{ fontSize: 11, color: '#333', letterSpacing: 2, textTransform: 'uppercase' }}>Coming soon →</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
