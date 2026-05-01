import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getContracts, createContract, uploadFile, updateSubmissionAttachment } from '../api/projects'
import type { ContractRow } from '../types'
import Pagination from '../components/Pagination'
import { useAuth } from '../hooks/useAuth'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(22,163,74,.1)', color: '#16a34a' }}>
      COMPLETED
    </span>
  )
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(234,179,8,.1)', color: '#a16207' }}>
      DRAFT
    </span>
  )
}

export default function EstimateGroupPage() {
  const { projectName, estNo, estYr } = useParams<{ projectName: string; estNo: string; estYr: string }>()
  const decodedProject = decodeURIComponent(projectName ?? '')
  const decodedEstNo   = decodeURIComponent(estNo ?? '')
  const decodedEstYr   = decodeURIComponent(estYr ?? '')
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [uploading, setUploading] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<{ id: number; type: 'estimate' | 'sar' } | null>(null)

  const load = () => {
    setLoading(true)
    getContracts(decodedProject, decodedEstNo, decodedEstYr)
      .then(setContracts)
      .catch(() => setError('Failed to load contracts.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [decodedProject, decodedEstNo, decodedEstYr])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const target = uploadTargetRef.current
    if (!file || !target) return
    setUploading(target.id)
    try {
      const { path } = await uploadFile(file)
      await updateSubmissionAttachment(target.id, target.type, path)
      load()
    } catch { setError('Upload failed.') }
    finally { setUploading(null); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  function triggerUpload(id: number, type: 'estimate' | 'sar') {
    uploadTargetRef.current = { id, type }
    fileInputRef.current?.click()
  }

  const paged = contracts.slice((page - 1) * pageSize, page * pageSize)

  const handleNewContract = async () => {
    setCreating(true)
    try {
      const result = await createContract({
        project_name: decodedProject,
        estimate_number: decodedEstNo,
        year_of_estimate: decodedEstYr,
      })
      navigate(`/submissions/${result.master_id}`)
    } catch {
      setError('Failed to create contract.')
      setCreating(false)
    }
  }

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleUpload} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
        <Link to={`/projects/${encodeURIComponent(decodedProject)}`} style={{
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
              Estimate
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
            Contract for Estimate: <span style={{ color: '#2563eb' }}>{decodedEstNo}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', marginLeft: 8 }}>({decodedEstYr})</span>
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Review and manage contracts linked to this estimate.</p>
        </div>
      </div>

      {/* Estimate reference + action bar */}
      <div style={{
        background: 'rgba(37,99,235,.04)', border: '1px solid rgba(37,99,235,.15)',
        borderRadius: 12, padding: '14px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 2 }}>Estimate Reference</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{decodedEstNo} &mdash; {decodedEstYr}</p>
        </div>
        {!isAdmin && (
          <button
            onClick={handleNewContract}
            disabled={creating}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: creating ? '#94a3b8' : '#2563eb', color: '#fff',
              border: 'none', borderRadius: 8, padding: '9px 18px',
              fontSize: 13, fontWeight: 600, cursor: creating ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v16m8-8H4" />
            </svg>
            {creating ? 'Creating…' : 'Start New Contract for this Estimate'}
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 18px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf1', padding: '16px 24px', height: 60 }} />
          ))}
        </div>
      )}

      {!loading && contracts.length === 0 && !error && (
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1',
          padding: '50px 24px', textAlign: 'center', color: '#94a3b8',
        }}>
          <p style={{ fontSize: 14, fontWeight: 500 }}>No contracts found for this estimate yet.</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Click "+ New Contract" to start one.</p>
        </div>
      )}

      {!loading && contracts.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1',
          boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '50px 1fr 1fr 1fr 1fr 120px',
            gap: 16, padding: '11px 24px', borderBottom: '1px solid #f1f5f9',
          }}>
            {['S.No', 'Contract ID', 'User', 'Date', 'Status', 'Action'].map((h, i) => (
              <div key={h} style={{
                fontSize: 10, fontWeight: 700, color: '#94a3b8',
                letterSpacing: '1.2px', textTransform: 'uppercase',
                textAlign: i === 5 ? 'right' : 'left',
              }}>
                {h}
              </div>
            ))}
          </div>

          {paged.map((c, i) => (
            <div key={c.id} style={{
              display: 'grid', gridTemplateColumns: '50px 1fr 1fr 1fr 1fr 180px',
              gap: 16, padding: '14px 24px', borderBottom: '1px solid #f8f9fb',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>
                {String((page - 1) * pageSize + i + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>#{c.id}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{c.created_by_user}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(c.created_at)}</div>
              <div>
                <StatusBadge status={c.status} />
                {c.status === 'COMPLETED' && (
                  <div style={{ marginTop: 5 }}>
                    {c.estimate_attachment ? (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,.1)', padding: '2px 8px', borderRadius: 5 }}>
                        ✓ Estimate Uploaded
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', background: 'rgba(239,68,68,.08)', padding: '2px 8px', borderRadius: 5 }}>
                        ✗ Estimate Missing
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                {c.status === 'DRAFT' && !isAdmin ? (
                  <Link to={`/submissions/${c.id}`}
                    style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: 'rgba(37,99,235,.08)', padding: '4px 10px', borderRadius: 6, textDecoration: 'none' }}>
                    Resume
                  </Link>
                ) : (
                  <>
                    <Link to={`/submissions/${c.id}`}
                      style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: 'rgba(37,99,235,.08)', padding: '4px 10px', borderRadius: 6, textDecoration: 'none' }}>
                      View
                    </Link>
                    {c.status === 'COMPLETED' && (
                      <button onClick={() => triggerUpload(c.id, 'estimate')} disabled={uploading === c.id}
                        style={{ fontSize: 11, fontWeight: 600, color: '#ea580c', background: 'rgba(234,88,12,.08)', padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Upload
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <Pagination total={contracts.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1) }} />
        </div>
      )}
    </div>
  )
}
