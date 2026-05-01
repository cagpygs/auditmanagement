import { useEffect, useState } from 'react'
import { getAdminUsers, createAdminUser, updateAdminUser, getAdminSubmissions } from '../api/projects'
import type { AdminUser, AdminSubmission } from '../types'

type Tab = 'users' | 'submissions'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isAdmin ? 'rgba(124,58,237,.1)' : 'rgba(37,99,235,.1)', color: isAdmin ? '#7c3aed' : '#2563eb' }}>
      {role}
    </span>
  )
}

const MODULES = ['contract_management']

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [error, setError] = useState('')
  const [subSearch, setSubSearch] = useState('')

  // Create user form
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('operator')
  const [newModules, setNewModules] = useState<string[]>(['contract_management'])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoadingUsers(false))
  }, [])

  useEffect(() => {
    if (tab !== 'submissions') return
    setLoadingSubs(true)
    getAdminSubmissions()
      .then(setSubmissions)
      .catch(() => setError('Failed to load submissions.'))
      .finally(() => setLoadingSubs(false))
  }, [tab])

  async function handleCreate() {
    if (!newUsername.trim() || !newPassword.trim()) { setCreateError('Username and password are required.'); return }
    setCreating(true); setCreateError('')
    try {
      await createAdminUser({ username: newUsername, password: newPassword, role: newRole, allowed_modules: newModules.join(',') })
      const updated = await getAdminUsers()
      setUsers(updated)
      setNewUsername(''); setNewPassword(''); setNewRole('operator'); setNewModules(['contract_management'])
    } catch { setCreateError('Failed to create user.') }
    finally { setCreating(false) }
  }

  async function toggleActive(u: AdminUser) {
    try {
      await updateAdminUser(u.id, { is_active: !u.is_active })
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x))
    } catch { setError('Failed to update user.') }
  }

  async function toggleModule(u: AdminUser, mod: string) {
    const mods = u.allowed_modules ? u.allowed_modules.split(',').map(m => m.trim()).filter(Boolean) : []
    const next = mods.includes(mod) ? mods.filter(m => m !== mod) : [...mods, mod]
    try {
      await updateAdminUser(u.id, { allowed_modules: next.join(',') })
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, allowed_modules: next.join(',') } : x))
    } catch { setError('Failed to update user.') }
  }

  const filteredSubs = subSearch.trim()
    ? submissions.filter(s => s.name_of_project.toLowerCase().includes(subSearch.toLowerCase()) || s.estimate_number.toLowerCase().includes(subSearch.toLowerCase()))
    : submissions

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e8ecf1', borderRadius: 8, fontSize: 13, color: '#334155', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,.08)', borderRadius: 20, padding: '4px 12px', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Admin</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Admin Panel</h1>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 18px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e8ecf1', marginBottom: 24 }}>
        {(['users', 'submissions'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 20px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer',
            borderBottom: tab === t ? '2px solid #7c3aed' : '2px solid transparent',
            color: tab === t ? '#7c3aed' : '#94a3b8', marginBottom: -1, fontFamily: 'Inter, sans-serif', textTransform: 'capitalize',
          }}>
            {t === 'users' ? 'User Management' : 'Submission Review'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          {/* Create user */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Create New User</div>
            {createError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 14px', color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{createError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, display: 'block' }}>Username</label>
                <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. john_doe" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, display: 'block' }}>Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, display: 'block' }}>Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} style={inputStyle}>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, display: 'block' }}>Modules</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {MODULES.map(m => {
                    const active = newModules.includes(m)
                    return (
                      <button key={m} onClick={() => setNewModules(prev => active ? prev.filter(x => x !== m) : [...prev, m])}
                        style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? 'rgba(37,99,235,.1)' : '#f1f5f9', color: active ? '#2563eb' : '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                        {m.replace('_', ' ')}
                      </button>
                    )
                  })}
                </div>
              </div>
              <button onClick={handleCreate} disabled={creating} style={{ padding: '9px 20px', background: creating ? '#94a3b8' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
                {creating ? 'Creating…' : '+ Create'}
              </button>
            </div>
          </div>

          {/* Users table */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 1fr 1fr 1fr', gap: 16, padding: '11px 24px', borderBottom: '1px solid #f1f5f9' }}>
              {['ID', 'Username', 'Role', 'Active', 'Modules', 'Joined'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {loadingUsers && [...Array(4)].map((_, i) => <div key={i} style={{ height: 52, borderBottom: '1px solid #f8f9fb', background: '#fff' }} />)}
            {!loadingUsers && users.map(u => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '40px 1.5fr 1fr 1fr 1fr 1fr', gap: 16, padding: '13px 24px', borderBottom: '1px solid #f8f9fb', alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>{u.id}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{u.username}</div>
                <RoleBadge role={u.role} />
                <div>
                  <button onClick={() => toggleActive(u)} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: u.is_active ? 'rgba(22,163,74,.1)' : '#f1f5f9', color: u.is_active ? '#16a34a' : '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {MODULES.map(m => {
                    const mods = u.allowed_modules ? u.allowed_modules.split(',').map(x => x.trim()) : []
                    const has = mods.includes(m)
                    return (
                      <button key={m} onClick={() => toggleModule(u, m)} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', background: has ? 'rgba(37,99,235,.1)' : '#f1f5f9', color: has ? '#2563eb' : '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                        {m.replace('_', ' ')}
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(u.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'submissions' && (
        <>
          <div style={{ position: 'relative', marginBottom: 16, maxWidth: 340 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" value={subSearch} onChange={e => setSubSearch(e.target.value)} placeholder="Search submissions..."
              style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1px solid #e8ecf1', borderRadius: 10, fontSize: 13, color: '#334155', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 1fr 1fr 1fr', gap: 16, padding: '11px 24px', borderBottom: '1px solid #f1f5f9' }}>
              {['ID', 'Project', 'Estimate', 'User', 'Status', 'Date'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {loadingSubs && [...Array(4)].map((_, i) => <div key={i} style={{ height: 52, borderBottom: '1px solid #f8f9fb' }} />)}
            {!loadingSubs && filteredSubs.map(s => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '50px 2fr 1.5fr 1fr 1fr 1fr', gap: 16, padding: '13px 24px', borderBottom: '1px solid #f8f9fb', alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>#{s.id}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name_of_project}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.estimate_number} ({s.year_of_estimate})</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{s.created_by_user}</div>
                <div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.status === 'COMPLETED' ? 'rgba(22,163,74,.1)' : 'rgba(234,179,8,.1)', color: s.status === 'COMPLETED' ? '#16a34a' : '#a16207' }}>
                    {s.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(s.created_at)}</div>
              </div>
            ))}
            {!loadingSubs && filteredSubs.length === 0 && (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No submissions found.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
