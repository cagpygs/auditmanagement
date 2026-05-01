import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header bar */}
        <header style={{
          height: 56,
          minHeight: 56,
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 4px rgba(0,0,0,.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          {/* Left: badges + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: '#1e293b', color: '#fff',
              fontSize: 9, fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
              fontFamily: 'Inter, sans-serif',
            }}>Irrigation Dept</span>
            <span style={{
              background: '#475569', color: '#fff',
              fontSize: 9, fontWeight: 700, letterSpacing: '1.5px',
              textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
              fontFamily: 'Inter, sans-serif',
            }}>CAG · UP</span>
            <span style={{ color: '#cbd5e1', fontSize: 13, margin: '0 2px' }}>|</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', fontFamily: 'Inter, sans-serif', letterSpacing: 0.2 }}>IIDMS</span>
          </div>

          {/* Right: search + notification */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 8, padding: '6px 12px', minWidth: 220,
            }}>
              <svg width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                style={{
                  border: 'none', background: 'transparent', outline: 'none',
                  fontSize: 13, color: '#475569', fontFamily: 'Inter, sans-serif',
                  width: '100%',
                }}
              />
            </div>
            <button style={{
              width: 34, height: 34, borderRadius: 8,
              border: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <svg width="16" height="16" fill="none" stroke="#64748b" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', background: '#f8f9fb' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
