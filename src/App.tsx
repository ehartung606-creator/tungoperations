export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'center',
      }}>
        <div style={{ color: '#444', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>
          Tung Operations
        </div>
        <a href="/payroll" style={{
          display: 'block',
          padding: '20px 40px',
          background: '#111',
          border: '1px solid #bc6c2533',
          borderRadius: 12,
          color: '#bc6c25',
          textDecoration: 'none',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 1,
        }}>
          📊 Payroll Dashboard
        </a>
      </div>
    </div>
  )
}
