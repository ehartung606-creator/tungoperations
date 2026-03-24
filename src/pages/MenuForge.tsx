export default function MenuForge() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0c0c0f', display: 'flex', flexDirection: 'column' }}>
      <iframe
        src="/menuforge.html"
        style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        title="MenuForge"
      />
    </div>
  )
}
