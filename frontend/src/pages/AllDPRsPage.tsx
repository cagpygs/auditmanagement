import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGlobalDPRs } from '../api/projects'
import type { GlobalDPR } from '../types'
import Pagination from '../components/Pagination'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AllDPRsPage() {
  const [dprs, setDprs] = useState<GlobalDPR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    getGlobalDPRs()
      .then(setDprs)
      .catch(() => setError('Failed to load DPRs.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? dprs.filter(d => d.project_name.toLowerCase().includes(q)) : dprs
  }, [dprs, search])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(234,88,12,.08)', borderRadius: 20, padding: '4px 12px', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Registry</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>All DPRs</h1>
        </div>
        {!loading && <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</div>}
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search DPRs..."
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
          <p style={{ fontSize: 14, fontWeight: 500 }}>{search ? 'No DPRs match your search' : 'No DPRs on record'}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 2fr 1fr', gap: 16, padding: '11px 24px', borderBottom: '1px solid #f1f5f9' }}>
            {['Project Name', 'Category', 'Type', 'Districts', 'Last Updated'].map((h, i) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>
          {paged.map(d => (
            <Link key={d.project_name} to={`/projects/${encodeURIComponent(d.project_name)}/dpr`} style={{ textDecoration: 'none', display: 'block' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 2fr 1fr', gap: 16, padding: '14px 24px', borderBottom: '1px solid #f8f9fb', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.project_name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{d.category_of_project || '—'}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{d.type_of_project || '—'}</div>
                <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.districts_covered || '—'}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>{formatDate(d.updated_at || d.created_at)}</div>
              </div>
            </Link>
          ))}
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
        </div>
      )}
    </div>
  )
}
