import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../api/projects'
import type { Project } from '../types'
import Pagination from '../components/Pagination'

function healthStyle(pct: number) {
  if (pct >= 90) return { background: 'rgba(22,163,74,.1)', color: '#16a34a', dot: '#16a34a' }
  if (pct >= 60) return { background: 'rgba(234,179,8,.1)', color: '#a16207', dot: '#ca8a04' }
  return { background: 'rgba(239,68,68,.1)', color: '#dc2626', dot: '#dc2626' }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError('Failed to load projects.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? projects.filter(p => p.project_name.toLowerCase().includes(q)) : projects
  }, [projects, search])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const COL = '3fr 180px 160px 120px 160px'

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>

      {/* 3-column header matching Streamlit layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(37,99,235,.07)', borderRadius: 20, padding: '4px 12px', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Institutional Record Hub
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Project Registry</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Centralized list of irrigation projects under audit review.</div>
        </div>

        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Filter by Project Name/Scheme..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1px solid #e8ecf1', borderRadius: 10, fontSize: 13, color: '#334155', background: '#fff', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' as const }} />
        </div>

        <div style={{ textAlign: 'right' }}>
          <Link to="/projects/new"
            style={{ display: 'inline-block', padding: '9px 18px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
            + &nbsp;Register Project
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(5)].map((_, i) => <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf1', height: 58 }} />)}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
          <svg width="44" height="44" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24"
            style={{ margin: '0 auto 12px', display: 'block' }} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 500 }}>
            {search ? 'No projects match the selected filter.' : 'No projects yet'}
          </p>
          {!search && <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>Click "Register Project" to add your first project.</p>}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: COL, padding: '11px 24px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
            {['PROJECT IDENTITY & LOCATION', 'SANCTIONED VALUE', 'PROJECT HEALTH', 'STATUS', 'AUDIT WORKSPACE'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '0 6px' }}>
                {h}
              </div>
            ))}
          </div>

          {paged.map(p => {
            const hpct = p.health_pct ?? 0
            const hs = healthStyle(hpct)
            const isCompleted = hpct === 100
            return (
              <div key={p.project_name}
                style={{ display: 'grid', gridTemplateColumns: COL, padding: '14px 24px', borderBottom: '1px solid #f8f9fb', alignItems: 'center', transition: 'background .12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>

                {/* Col 1: Project identity & location */}
                <div style={{ padding: '0 6px' }}>
                  <Link to={`/projects/${encodeURIComponent(p.project_name)}`}
                    style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#2563eb' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#0f172a' }}>
                    {p.project_name}
                  </Link>
                  {(p.type_of_project || p.dpr_location) && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      {p.type_of_project && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: 'rgba(37,99,235,.08)', color: '#2563eb' }}>
                          {p.type_of_project}
                        </span>
                      )}
                      {p.dpr_location && (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.dpr_location}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Col 2: Sanctioned value */}
                <div style={{ padding: '0 6px' }}>
                  {p.sanctioned_amount ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>&#8377;{p.sanctioned_amount}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Approved Budget</div>
                    </>
                  ) : (
                    <span style={{ color: '#cbd5e1', fontSize: 16, fontWeight: 400 }}>&mdash;</span>
                  )}
                </div>

                {/* Col 3: Project health */}
                <div style={{ padding: '0 6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: hs.background, color: hs.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: hs.dot, flexShrink: 0 }} />
                    HEALTH: {hpct}%
                  </span>
                </div>

                {/* Col 4: Status */}
                <div style={{ padding: '0 6px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: isCompleted ? 'rgba(22,163,74,.1)' : 'rgba(37,99,235,.1)',
                    color: isCompleted ? '#16a34a' : '#2563eb',
                  }}>
                    {isCompleted ? 'COMPLETED' : 'ONGOING'}
                  </span>
                </div>

                {/* Col 5: Audit workspace */}
                <div style={{ padding: '0 6px' }}>
                  <Link to={`/projects/${encodeURIComponent(p.project_name)}`}
                    style={{ display: 'inline-block', padding: '6px 14px', background: '#fff', border: '1px solid #e8ecf1', borderRadius: 7, fontSize: 12, fontWeight: 600, color: '#334155', textDecoration: 'none' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0f6ff'; el.style.borderColor = '#2563eb'; el.style.color = '#2563eb' }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#e8ecf1'; el.style.color = '#334155' }}>
                    Open Project &rsaquo;
                  </Link>
                </div>
              </div>
            )
          })}

          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
        </div>
      )}
    </div>
  )
}
