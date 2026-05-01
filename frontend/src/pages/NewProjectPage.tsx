import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../api/projects'
import { useAuth } from '../hooks/useAuth'

const PREDEFINED = [
  'Upper Ganga Canal Rehabilitation',
  'Sharda Canal Modernization',
  'Eastern Feeder Channel Restoration',
  'Bund Strengthening and Safety Upgrade',
  'Irrigation Pump Station Renewal',
]

function toDisplayName(key: string) {
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function NewProjectPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const modules = user?.allowed_modules
    ? user.allowed_modules.split(',').map(m => m.trim()).filter(Boolean)
    : []

  const [selectedModule, setSelectedModule] = useState(() =>
    user?.allowed_modules ? (user.allowed_modules.split(',')[0] ?? '').trim() : ''
  )
  const [projectName, setProjectName] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDrop, setShowDrop] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.allowed_modules) {
      setSelectedModule(user.allowed_modules.split(',')[0].trim())
    }
  }, [user])

  useEffect(() => {
    getProjects().then(ps => {
      const dbNames = ps.map(p => p.project_name)
      const merged = [...PREDEFINED]
      for (const n of dbNames) {
        if (!merged.some(m => m.toLowerCase() === n.toLowerCase())) merged.push(n)
      }
      setSuggestions(merged)
    }).catch(() => setSuggestions(PREDEFINED))
  }, [])

  const filtered = projectName.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(projectName.trim().toLowerCase()))
    : suggestions

  function handleSelect(name: string) {
    setProjectName(name)
    setShowDrop(false)
    setError('')
  }

  function handleSubmit() {
    if (!selectedModule) { setError('No module assigned to your account.'); return }
    const name = projectName.trim()
    if (!name) { setError('Please enter or select a project name.'); return }
    navigate(`/projects/${encodeURIComponent(name)}`)
  }

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 18, border: '1px solid #e8ecf1', boxShadow: '0 4px 24px rgba(0,0,0,.07)', padding: '36px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(37,99,235,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            📂
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Start New Project</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Select or enter a project to begin audit workflow.</div>
          </div>
        </div>

        {/* Module */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>
            Module
          </label>
          {modules.length === 0 ? (
            <div style={{ padding: '9px 12px', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', background: '#fef2f2' }}>
              No modules assigned to your account.
            </div>
          ) : modules.length === 1 ? (
            <div style={{ padding: '9px 12px', border: '1px solid #e8ecf1', borderRadius: 8, fontSize: 13, color: '#334155', background: '#f8fafc', fontWeight: 600 }}>
              {toDisplayName(modules[0])}
            </div>
          ) : (
            <select value={selectedModule} onChange={e => setSelectedModule(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e8ecf1', borderRadius: 8, fontSize: 13, color: '#334155', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const }}>
              {modules.map(m => (
                <option key={m} value={m}>{toDisplayName(m)}</option>
              ))}
            </select>
          )}
        </div>

        {/* Project name input with dropdown */}
        <div style={{ marginBottom: 20, position: 'relative' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, display: 'block' }}>
            Project Name
          </label>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={projectName}
              onChange={e => { setProjectName(e.target.value); setError(''); setShowDrop(true) }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              placeholder="Select or type a project name..."
              style={{ width: '100%', padding: '9px 36px 9px 12px', border: `1px solid ${error ? '#fca5a5' : '#e8ecf1'}`, borderRadius: 8, fontSize: 13, color: '#334155', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
            />
            {/* Chevron */}
            <svg style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Dropdown */}
          {showDrop && filtered.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e8ecf1', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)', zIndex: 100, marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
              {filtered.map(name => (
                <div key={name} onMouseDown={() => handleSelect(name)}
                  style={{ padding: '9px 14px', fontSize: 13, color: '#334155', cursor: 'pointer', borderBottom: '1px solid #f8f9fb' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0f6ff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}>
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/projects')}
            style={{ flex: 1, padding: '10px 16px', background: '#f8fafc', border: '1px solid #e8ecf1', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Cancel
          </button>
          <button onClick={handleSubmit}
            style={{ flex: 2, padding: '10px 16px', background: '#2563eb', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Select Project →
          </button>
        </div>
      </div>
    </div>
  )
}
