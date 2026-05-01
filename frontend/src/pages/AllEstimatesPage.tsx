import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGlobalEstimates } from '../api/projects'
import type { GlobalEstimate } from '../types'
import Pagination from '../components/Pagination'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ completed, total }: { completed: number; total: number }) {
  if (total === 0) return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#94a3b8' }}>No Contracts</span>
  if (completed === total) return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(22,163,74,.1)', color: '#16a34a' }}>Completed</span>
  if (completed === 0) return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(234,179,8,.1)', color: '#a16207' }}>Draft</span>
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(37,99,235,.1)', color: '#2563eb' }}>In Progress</span>
}

export default function AllEstimatesPage() {
  const [estimates, setEstimates] = useState<GlobalEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    getGlobalEstimates()
      .then(setEstimates)
      .catch(() => setError('Failed to load estimates.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? estimates.filter(e => e.project_name.toLowerCase().includes(q) || e.estimate_number.toLowerCase().includes(q)) : estimates
  }, [estimates, search])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,.07)', borderRadius: 20, padding: '4px 12px', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Registry</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>All Estimates</h1>
        </div>
        {!loading && <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>}
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search estimates..."
          style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1px solid #e8ecf1', borderRadius: 10, fontSize: 13, color: '#334155', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }} />
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>{error}</div>}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf1', padding: '18px 24px', height: 50 }} />)}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: 14, fontWeight: 500 }}>{search ? 'No estimates match your search' : 'No estimates on record'}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 1.5fr', gap: 16, padding: '11px 24px', borderBottom: '1px solid #f1f5f9' }}>
            {['Project', 'Estimate No.', 'Year', 'Contracts', 'Last Updated', 'Status'].map((h, i) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', textAlign: i >= 4 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          {paged.map((e, idx) => (
            <Link key={idx} to={`/projects/${encodeURIComponent(e.project_name)}/estimates/${encodeURIComponent(e.estimate_number)}/${encodeURIComponent(e.year_of_estimate)}`}
              style={{ textDecoration: 'none', display: 'block' }}
              onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = '#f8fafc' }}
              onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1fr 1.5fr', gap: 16, padding: '14px 24px', borderBottom: '1px solid #f8f9fb', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{e.project_name}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>{e.estimate_number}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{e.year_of_estimate}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  {e.completed_count}/{e.contract_count}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{formatDate(e.latest_date)}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <StatusBadge completed={e.completed_count} total={e.contract_count} />
                </div>
              </div>
            </Link>
          ))}
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
        </div>
      )}
    </div>
  )
}
