import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProjectDetail } from '../api/projects'
import type { ProjectDetail } from '../types'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function EstimateBadge({ status, completed, total }: { status: string; completed: number; total: number }) {
  if (status === 'COMPLETED' || (completed === total && total > 0))
    return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(22,163,74,.1)', color: '#16a34a' }}>Completed</span>
  if (completed === 0)
    return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(234,179,8,.1)', color: '#a16207' }}>Draft</span>
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(37,99,235,.1)', color: '#2563eb' }}>In Progress</span>
}

function ContractBadge({ status }: { status: string }) {
  if (status === 'COMPLETED')
    return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(22,163,74,.1)', color: '#16a34a' }}>COMPLETED</span>
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(234,179,8,.1)', color: '#a16207' }}>DRAFT</span>
}

const STAT_ICONS = [
  <path key="a" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  <><circle key="b1" cx="12" cy="12" r="10" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/><path key="b2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3"/></>,
  <path key="c" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  <path key="d" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
]

export default function ProjectDetailPage() {
  const { projectName } = useParams<{ projectName: string }>()
  const decoded = decodeURIComponent(projectName ?? '')

  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'dpr' | 'estimates' | 'contracts'>('dpr')

  useEffect(() => {
    if (!decoded) return
    getProjectDetail(decoded)
      .then(setDetail)
      .catch(() => setError('Failed to load project details.'))
      .finally(() => setLoading(false))
  }, [decoded])

  const statCards = detail ? [
    { label: 'TOTAL ESTIMATES',  value: detail.estimate_count,  sub: 'Registered estimates' },
    { label: 'DPR STATUS',       value: detail.has_dpr ? '✓' : '—', sub: detail.has_dpr ? 'On record' : 'Not yet filed' },
    { label: 'CONTRACTS',        value: detail.contract_count,  sub: 'Total agreement entries' },
    { label: 'COMPLETED',        value: detail.completed_count, sub: 'Finished contracts' },
  ] : []

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
        <Link to="/projects" style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid #e8ecf1',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#64748b', textDecoration: 'none', flexShrink: 0, marginTop: 2,
          boxShadow: '0 1px 4px rgba(0,0,0,.05)',
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,.07)', borderRadius: 20, padding: '4px 12px', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Projects / Detail</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, maxWidth: 700 }}>
            {loading ? <span style={{ display: 'inline-block', width: 320, height: 26, background: '#f1f5f9', borderRadius: 6 }} /> : decoded}
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>EXECUTING DIVISION: IRRIGATION</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ height: 10, background: '#f1f5f9', borderRadius: 4, width: '60%', marginBottom: 14 }} />
              <div style={{ height: 32, background: '#f1f5f9', borderRadius: 4, width: '40%', marginBottom: 8 }} />
              <div style={{ height: 10, background: '#f1f5f9', borderRadius: 4, width: '50%' }} />
            </div>
          ))
        ) : (
          statCards.map((c, i) => (
            <div key={c.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(234,88,12,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <svg width="18" height="18" fill="none" stroke="#ea580c" viewBox="0 0 24 24">{STAT_ICONS[i]}</svg>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</p>
              <p style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: 4 }}>{c.value}</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{c.sub}</p>
            </div>
          ))
        )}
      </div>

      {/* Tabs */}
      {!loading && detail && (
        <>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #e8ecf1' }}>
            {([
              { key: 'dpr',       label: 'DPR Details' },
              { key: 'estimates', label: `Estimates (${detail.estimate_count})` },
              { key: 'contracts', label: `Contracts (${detail.contract_count})` },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '9px 18px', fontSize: 13, fontWeight: 600, border: 'none',
                background: 'none', cursor: 'pointer',
                borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
                color: tab === t.key ? '#2563eb' : '#94a3b8', marginBottom: -1,
                fontFamily: 'Inter, sans-serif', transition: 'color 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* DPR tab */}
          {tab === 'dpr' && (
            detail.has_dpr ? (
              <div>
                <div style={{
                  background: 'rgba(22,163,74,.05)', border: '1px solid rgba(22,163,74,.2)',
                  borderRadius: 14, padding: '18px 24px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>✓</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>DPR on Record</p>
                      <p style={{ fontSize: 11, color: '#4ade80' }}>Detailed Project Report has been filed for this project.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/projects/${encodeURIComponent(decoded)}/dpr`} style={{
                      fontSize: 12, fontWeight: 600, color: '#16a34a',
                      background: 'rgba(22,163,74,.1)', padding: '7px 14px',
                      borderRadius: 8, textDecoration: 'none',
                    }}>View DPR</Link>
                    <Link to={`/projects/${encodeURIComponent(decoded)}/dpr/edit`} style={{
                      fontSize: 12, fontWeight: 600, color: '#2563eb',
                      background: 'rgba(37,99,235,.08)', padding: '7px 14px',
                      borderRadius: 8, textDecoration: 'none',
                    }}>Update DPR</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(37,99,235,.05)', border: '1px solid rgba(37,99,235,.18)',
                borderRadius: 14, padding: '28px 24px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>
                  No DPR has been created for this project yet.
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                  Create a DPR to enable estimates for this project.
                </p>
                <Link to={`/projects/${encodeURIComponent(decoded)}/dpr/edit`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600,
                  padding: '9px 20px', borderRadius: 8, textDecoration: 'none',
                }}>
                  + Create DPR
                </Link>
              </div>
            )
          )}

          {/* Estimates tab */}
          {tab === 'estimates' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                {detail.has_dpr ? (
                  <Link to={`/projects/${encodeURIComponent(decoded)}/estimates/new`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600,
                    padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                  }}>
                    + Add New Estimate
                  </Link>
                ) : (
                  <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                    Create the DPR first to enable estimates
                  </span>
                )}
              </div>

              {detail.estimates.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '50px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>No estimates found for this project.</p>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 3fr 1fr 1fr 1.5fr 1fr', gap: 16, padding: '11px 24px', borderBottom: '1px solid #f1f5f9' }}>
                    {['#', 'Estimate No.', 'Year', 'Contracts', 'Last Updated', 'Status'].map((h, i) => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', textAlign: i === 0 || i === 1 ? 'left' : i === 5 ? 'right' : 'center' }}>{h}</div>
                    ))}
                  </div>
                  {detail.estimates.map((est, i) => (
                    <div key={`${est.estimate_number}-${est.year_of_estimate}`} style={{ display: 'grid', gridTemplateColumns: '40px 3fr 1fr 1fr 1.5fr 1fr', gap: 16, padding: '14px 24px', borderBottom: '1px solid #f8f9fb', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</div>
                      <div>
                        <Link
                          to={`/projects/${encodeURIComponent(decoded)}/estimates/${encodeURIComponent(est.estimate_number)}/${encodeURIComponent(est.year_of_estimate)}`}
                          style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#0f172a')}
                        >
                          {est.estimate_number}
                        </Link>
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>{est.year_of_estimate}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', textAlign: 'center' }}>{est.completed_count}/{est.contract_count}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>{formatDate(est.latest_date)}</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <EstimateBadge status={est.status} completed={est.completed_count} total={est.contract_count} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contracts tab */}
          {tab === 'contracts' && (
            <div>
              {detail.contracts.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '50px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>No contracts found for this project yet.</p>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 1fr 1fr 100px', gap: 16, padding: '11px 24px', borderBottom: '1px solid #f1f5f9' }}>
                    {['S.No', 'ID', 'Estimate', 'User', 'Date', 'Status'].map((h, i) => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', textAlign: i === 5 ? 'right' : 'left' }}>{h}</div>
                    ))}
                  </div>
                  {detail.contracts.map((c, i) => (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 1fr 1fr 100px', gap: 16, padding: '14px 24px', borderBottom: '1px solid #f8f9fb', alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</div>
                      <Link to={`/submissions/${c.id}`} style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')} onMouseLeave={e => (e.currentTarget.style.color = '#0f172a')}>
                        #{c.id}
                      </Link>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{c.estimate_number} ({c.year_of_estimate})</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{c.created_by_user}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(c.created_at)}</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><ContractBadge status={c.status} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
