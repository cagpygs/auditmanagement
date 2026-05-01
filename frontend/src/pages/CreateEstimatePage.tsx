import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { createEstimate } from '../api/projects'

const YEAR_OPTIONS = (() => {
  const years: string[] = []
  for (let y = new Date().getFullYear() + 1; y >= 2000; y--) {
    years.push(`${y}-${String(y + 1).slice(-2)}`)
  }
  return years
})()

export default function CreateEstimatePage() {
  const { projectName } = useParams<{ projectName: string }>()
  const decoded = decodeURIComponent(projectName ?? '')
  const navigate = useNavigate()

  const [estNo, setEstNo] = useState('')
  const [estYr, setEstYr] = useState(YEAR_OPTIONS[1])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!estNo.trim()) { setError('Estimate number is required.'); return }
    setLoading(true)
    setError('')
    try {
      await createEstimate(decoded, { estimate_number: estNo.trim(), year_of_estimate: estYr })
      navigate(`/projects/${encodeURIComponent(decoded)}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Failed to create estimate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif', maxWidth: 560 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
        <Link to={`/projects/${encodeURIComponent(decoded)}`} style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid #e8ecf1',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#64748b', textDecoration: 'none', flexShrink: 0, marginTop: 2,
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
        </Link>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(37,99,235,.07)', borderRadius: 20, padding: '4px 12px', marginBottom: 6,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Estimate Creation
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>New Estimate</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Fill in the estimate details for this project</p>
        </div>
      </div>

      {/* Project context */}
      <div style={{
        background: 'rgba(37,99,235,.05)', border: '1px solid rgba(37,99,235,.15)',
        borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <svg width="16" height="16" fill="none" stroke="#2563eb" viewBox="0 0 24 24" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7h18M3 12h18M3 17h18" />
        </svg>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Project</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{decoded}</p>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '24px 28px' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 18 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
              Estimate Number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={estNo}
              onChange={e => setEstNo(e.target.value)}
              placeholder="e.g. EST/2024/001"
              style={{
                width: '100%', padding: '9px 12px', border: '1px solid #e8ecf1',
                borderRadius: 8, fontSize: 13, color: '#334155', background: '#fff',
                outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6 }}>
              Year of Estimate <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={estYr}
              onChange={e => setEstYr(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', border: '1px solid #e8ecf1',
                borderRadius: 8, fontSize: 13, color: '#334155', background: '#fff',
                outline: 'none', fontFamily: 'Inter, sans-serif',
              }}
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1, background: loading ? '#94a3b8' : '#2563eb', color: '#fff',
              border: 'none', borderRadius: 8, padding: '10px',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Creating…' : 'Create Estimate'}
          </button>
          <Link
            to={`/projects/${encodeURIComponent(decoded)}`}
            style={{
              flex: 1, textAlign: 'center', background: '#f8fafc', color: '#64748b',
              border: '1px solid #e8ecf1', borderRadius: 8, padding: '10px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
