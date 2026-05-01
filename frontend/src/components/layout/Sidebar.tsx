import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../api/auth'
import { useAuth } from '../../hooks/useAuth'

const NAV_MAIN = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>,
  },
  {
    to: '/analysis',
    label: 'Analysis',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  },
  {
    to: '/msi',
    label: 'MSI',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  },
  {
    to: '/about',
    label: 'About Department',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" strokeWidth={2.5}/><path d="M12 12v5"/></svg>,
  },
]

const NAV_REGISTRY = [
  {
    to: '/all-dprs',
    label: 'All DPRs',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  },
  {
    to: '/all-estimates',
    label: 'All Estimates',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>,
  },
]

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/projects' ? false : undefined}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 20px', margin: '1px 10px', borderRadius: 10,
        color: isActive ? '#ffffff' : 'rgba(255,255,255,.55)',
        textDecoration: 'none', fontSize: 14,
        fontWeight: isActive ? 600 : 500, fontFamily: 'Inter, sans-serif',
        transition: 'all 0.18s ease',
        background: isActive ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'transparent',
        boxShadow: isActive ? '0 4px 14px rgba(37,99,235,.35)' : 'none',
      })}
      onMouseEnter={e => {
        const el = e.currentTarget
        if (!el.style.background.includes('2563eb')) {
          el.style.background = 'rgba(255,255,255,.06)'
          el.style.color = 'rgba(255,255,255,.85)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        if (!el.style.background.includes('2563eb')) {
          el.style.background = 'transparent'
          el.style.color = 'rgba(255,255,255,.55)'
        }
      }}
    >
      <span style={{ width: 18, height: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const username = user?.username ?? 'User'
  const role = user?.role ?? 'operator'
  const initial = username[0]?.toUpperCase() ?? 'U'

  async function handleLogout() {
    await logout()
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <aside style={{
      width: 230,
      minWidth: 230,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #192231 0%, #1b2740 100%)',
      boxShadow: '2px 0 16px rgba(0,0,0,.18)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '22px 20px',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        marginBottom: 8,
      }}>
        <div style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>II</span>
        </div>
        <div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: 0.3 }}>IIDMS</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,.35)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>IRRIGATION DEPT</div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0 0 8px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '16px 20px 8px' }}>
          Navigation
        </div>
        {NAV_MAIN.map(({ to, label, icon }) => (
          <NavItem key={to} to={to} label={label} icon={icon} />
        ))}

        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '16px 20px 8px' }}>
          Registry
        </div>
        {NAV_REGISTRY.map(({ to, label, icon }) => (
          <NavItem key={to} to={to} label={label} icon={icon} />
        ))}

        {role === 'admin' && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '16px 20px 8px' }}>
              Admin
            </div>
            <NavItem
              to="/admin"
              label="Admin Panel"
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
            />
          </>
        )}
      </nav>

      {/* User card */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 20px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#334155', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            flexShrink: 0, textTransform: 'uppercase',
          }}>
            {initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {username}
            </div>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.30)', letterSpacing: 0.5, fontFamily: 'Inter, sans-serif' }}>
              {role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'block', width: 'calc(100% - 40px)',
            margin: '4px 20px 14px',
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,.10)',
            color: 'rgba(255,255,255,.45)',
            background: 'transparent',
            fontSize: 12, fontWeight: 600, textAlign: 'center',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,.45)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,.10)' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
