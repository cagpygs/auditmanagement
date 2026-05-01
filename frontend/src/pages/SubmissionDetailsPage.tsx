import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  getSubmission, updateSubmissionStatus, getTableColumns,
  saveTableSection, uploadFile, updateSubmissionAttachment,
} from '../api/projects'
import type { SubmissionDetail, TableColumn } from '../types'
import { useAuth } from '../hooks/useAuth'

const CONTRACT_TABLE_ORDER = [
  'contract_management_admin_financial_sanction',
  'contract_management_technical_sanction',
  'contract_management_tender_award_contract',
  'contract_management_contract_master',
  'contract_management_payments_recoveries',
  'contract_management_budget_summary',
  'contract_management_technical_inspection',
]

const TECH_INSPECTION_TABLE = 'contract_management_technical_inspection'

const INSPECTION_TYPES = [
  { key: 'ce', label: 'CE Site Inspection' },
  { key: 'se', label: 'SE Site Inspection' },
  { key: 'ee', label: 'EE Site Inspection' },
  { key: 'tac', label: 'TAC Inspection' },
] as const

const INSPECTION_FIELDS: { key: string; label: string }[] = [
  { key: 'contractual_compliance',            label: 'Contractual Compliance' },
  { key: 'functionality_design_intent',       label: 'Functionality & Design Intent' },
  { key: 'environmental_social_aspects',      label: 'Environmental & Social Aspects' },
  { key: 'safety_measures',                   label: 'Safety Measures' },
  { key: 'measurement_records',               label: 'Measurement & Records' },
  { key: 'progress_of_work',                  label: 'Progress of Work' },
  { key: 'workmanship_construction_quality',  label: 'Workmanship & Construction Quality' },
  { key: 'quality_of_materials',              label: 'Quality of Materials' },
  { key: 'conformity_design_drawings',        label: 'Conformity with Design & Drawings' },
]

const MONEY_KEYWORDS = ['expenditure', 'amount', 'cost', 'payment', 'value', 'budget']
const READONLY_COLS = ['estimate_number', 'year_of_estimate', 'name_of_project']

function tableSectionLabel(tableName: string) {
  return tableName
    .replace(/^contract_management_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function fieldLabel(col: string) {
  const base = col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return MONEY_KEYWORDS.some(k => col.toLowerCase().includes(k)) ? `${base} (INR)` : base
}

function isDateCol(col: string, dtype: string) {
  if (col === 'created_at' || col === 'updated_at' || col === 'year_of_estimate') return false
  if (dtype === 'date') return true
  const parts = col.split('_')
  return parts.includes('date') || col.startsWith('date_') || col.endsWith('_date') || col.includes('_date_')
}

type FormValues = Record<string, string>

function SectionForm({
  subId, tableName, columns, existingRow, masterFields, onSaved, readOnly,
}: {
  subId: number
  tableName: string
  columns: TableColumn[]
  existingRow: Record<string, unknown> | undefined
  masterFields: { estimate_number: string; year_of_estimate: string; name_of_project: string }
  onSaved: () => void
  readOnly: boolean
}) {
  const [values, setValues] = useState<FormValues>(() => {
    const init: FormValues = {}
    for (const c of columns) {
      if (READONLY_COLS.includes(c.column_name)) {
        init[c.column_name] = String(masterFields[c.column_name as keyof typeof masterFields] ?? '')
      } else {
        const existing = existingRow?.[c.column_name]
        init[c.column_name] = existing != null ? String(existing) : ''
      }
    }
    return init
  })
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  async function handleSave() {
    if (readOnly) return
    setSaving(true)
    setFlash(null)
    try {
      await saveTableSection(subId, tableName, values as Record<string, unknown>)
      setFlash({ type: 'ok', msg: `${tableSectionLabel(tableName)} saved successfully.` })
      onSaved()
    } catch {
      setFlash({ type: 'err', msg: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const displayCols = columns.filter(c => c.column_name !== 'created_at')
  const left = displayCols.filter((_, i) => i % 2 === 0)
  const right = displayCols.filter((_, i) => i % 2 === 1)

  const inputStyle = (isRO: boolean): React.CSSProperties => ({
    width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8,
    border: '1px solid #e2e8f0', background: isRO ? '#f8fafc' : '#fff',
    color: isRO ? '#94a3b8' : '#1e293b', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  })

  function renderField(c: TableColumn) {
    const col = c.column_name
    const dtype = c.data_type
    const label = fieldLabel(col)
    const val = values[col] ?? ''
    const isRO = READONLY_COLS.includes(col) || readOnly

    let field: React.ReactNode
    if (isRO) {
      field = <input value={val} readOnly style={inputStyle(true)} />
    } else if (dtype === 'boolean' || dtype === 'bool') {
      field = (
        <select value={val} onChange={e => setValues(v => ({ ...v, [col]: e.target.value }))} style={inputStyle(false)}>
          <option value="">—</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      )
    } else if (dtype === 'integer' || dtype === 'bigint' || dtype === 'smallint') {
      field = <input type="number" step="1" value={val} onChange={e => setValues(v => ({ ...v, [col]: e.target.value }))} style={inputStyle(false)} />
    } else if (dtype === 'numeric' || dtype === 'double precision' || dtype === 'real') {
      field = <input type="number" value={val} onChange={e => setValues(v => ({ ...v, [col]: e.target.value }))} style={inputStyle(false)} />
    } else if (isDateCol(col, dtype)) {
      field = <input type="date" value={val ? val.slice(0, 10) : ''} onChange={e => setValues(v => ({ ...v, [col]: e.target.value }))} style={inputStyle(false)} />
    } else {
      field = <input type="text" value={val} onChange={e => setValues(v => ({ ...v, [col]: e.target.value }))} style={inputStyle(false)} />
    }

    return (
      <div key={col} style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 5 }}>
          {label}
        </label>
        {field}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      {flash && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
          background: flash.type === 'ok' ? 'rgba(22,163,74,.08)' : 'rgba(239,68,68,.08)',
          border: `1px solid ${flash.type === 'ok' ? 'rgba(22,163,74,.2)' : 'rgba(239,68,68,.2)'}`,
          color: flash.type === 'ok' ? '#16a34a' : '#dc2626',
        }}>
          {flash.msg}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <div>{left.map(renderField)}</div>
        <div>{right.map(renderField)}</div>
      </div>
      {!readOnly && (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 4 }}>
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: saving ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            {saving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      )}
    </div>
  )
}

function TechnicalInspectionForm({
  subId, existingRow, masterFields, onSaved, readOnly,
}: {
  subId: number
  existingRow: Record<string, unknown> | undefined
  masterFields: { estimate_number: string; year_of_estimate: string; name_of_project: string }
  onSaved: () => void
  readOnly: boolean
}) {
  const [activeType, setActiveType] = useState<'ce' | 'se' | 'ee' | 'tac'>('ce')
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const type of INSPECTION_TYPES) {
      for (const field of INSPECTION_FIELDS) {
        const col = `${type.key}_${field.key}`
        const existing = existingRow?.[col]
        init[col] = existing != null ? String(existing) : ''
      }
    }
    return init
  })
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  async function handleSave() {
    if (readOnly) return
    setSaving(true)
    setFlash(null)
    const payload: Record<string, unknown> = {
      ...masterFields,
    }
    for (const field of INSPECTION_FIELDS) {
      const col = `${activeType}_${field.key}`
      payload[col] = values[col] || null
    }
    try {
      await saveTableSection(subId, TECH_INSPECTION_TABLE, payload)
      setFlash({ type: 'ok', msg: 'Inspection data saved successfully.' })
      onSaved()
    } catch {
      setFlash({ type: 'err', msg: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8,
    border: '1px solid #e2e8f0', background: readOnly ? '#f8fafc' : '#fff',
    color: readOnly ? '#94a3b8' : '#1e293b', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  }

  const currentFields = INSPECTION_FIELDS.map(f => ({
    ...f,
    col: `${activeType}_${f.key}`,
  }))
  const left = currentFields.filter((_, i) => i % 2 === 0)
  const right = currentFields.filter((_, i) => i % 2 === 1)

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Sub-tabs: CE / SE / EE / TAC */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e8ecf1', marginBottom: 20 }}>
        {INSPECTION_TYPES.map(t => (
          <button key={t.key} onClick={() => { setActiveType(t.key); setFlash(null) }} style={{
            padding: '7px 18px', fontSize: 12, fontWeight: 600, border: 'none',
            background: 'none', cursor: 'pointer',
            borderBottom: activeType === t.key ? '2px solid #2563eb' : '2px solid transparent',
            color: activeType === t.key ? '#2563eb' : '#94a3b8',
            marginBottom: -1, fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {flash && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
          background: flash.type === 'ok' ? 'rgba(22,163,74,.08)' : 'rgba(239,68,68,.08)',
          border: `1px solid ${flash.type === 'ok' ? 'rgba(22,163,74,.2)' : 'rgba(239,68,68,.2)'}`,
          color: flash.type === 'ok' ? '#16a34a' : '#dc2626',
        }}>
          {flash.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <div>
          {left.map(f => (
            <div key={f.col} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 5 }}>
                {f.label}
              </label>
              <input
                type="text"
                value={values[f.col] ?? ''}
                readOnly={readOnly}
                onChange={e => !readOnly && setValues(v => ({ ...v, [f.col]: e.target.value }))}
                style={inputStyle}
                placeholder={readOnly ? '' : 'Enter value'}
              />
            </div>
          ))}
        </div>
        <div>
          {right.map(f => (
            <div key={f.col} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 5 }}>
                {f.label}
              </label>
              <input
                type="text"
                value={values[f.col] ?? ''}
                readOnly={readOnly}
                onChange={e => !readOnly && setValues(v => ({ ...v, [f.col]: e.target.value }))}
                style={inputStyle}
                placeholder={readOnly ? '' : 'Enter value'}
              />
            </div>
          ))}
        </div>
      </div>

      {!readOnly && (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 4 }}>
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: saving ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            {saving ? 'Saving...' : 'Save Section'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function SubmissionDetailsPage() {
  const { subId } = useParams<{ subId: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [sub, setSub] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(CONTRACT_TABLE_ORDER[0])
  const [tableColumns, setTableColumns] = useState<Record<string, TableColumn[]>>({})
  const [colsLoading, setColsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingEst, setUploadingEst] = useState(false)

  const fetchSub = useCallback(() => {
    if (!subId) return
    getSubmission(Number(subId))
      .then(setSub)
      .catch(() => setError('Submission not found or access denied.'))
      .finally(() => setLoading(false))
  }, [subId])

  useEffect(() => { fetchSub() }, [fetchSub])

  useEffect(() => {
    const load = async () => {
      const results: Record<string, TableColumn[]> = {}
      await Promise.all(
        CONTRACT_TABLE_ORDER.map(async t => {
          try {
            const cols = await getTableColumns(t)
            if (cols.length > 0) results[t] = cols
          } catch { /* skip */ }
        })
      )
      setTableColumns(results)
      setColsLoading(false)
    }
    load()
  }, [])

  async function handleEstimateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !subId) return
    setUploadingEst(true)
    try {
      const { path } = await uploadFile(file)
      await updateSubmissionAttachment(Number(subId), 'estimate', path)
      fetchSub()
    } catch { setError('Upload failed.') }
    finally { setUploadingEst(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  async function handleSubmit() {
    if (!sub || !subId) return
    setSubmitting(true)
    try {
      await updateSubmissionStatus(Number(subId), 'COMPLETED')
      navigate(
        sub.name_of_project && sub.estimate_number && sub.year_of_estimate
          ? `/projects/${encodeURIComponent(sub.name_of_project)}/estimates/${encodeURIComponent(sub.estimate_number)}/${encodeURIComponent(sub.year_of_estimate)}`
          : sub.name_of_project ? `/projects/${encodeURIComponent(sub.name_of_project)}` : '/projects'
      )
    } catch { setError('Failed to submit.'); setSubmitting(false) }
  }

  const availableTables = CONTRACT_TABLE_ORDER.filter(t => tableColumns[t])
  const isCompleted = sub?.status === 'COMPLETED'

  const completedCount = sub
    ? availableTables.filter(t => (sub.table_data[t]?.length ?? 0) > 0).length
    : 0
  const totalCount = availableTables.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const progressColor = percentage < 40 ? '#dc2626' : percentage < 75 ? '#d97706' : '#059669'

  const firstTable = availableTables[0]
  const firstHasData = sub ? (sub.table_data[firstTable]?.length ?? 0) > 0 : false

  const incompleteSections = availableTables.filter(t => (sub?.table_data[t]?.length ?? 0) === 0)
  const canSubmit = incompleteSections.length === 0 && !isCompleted

  const backTo = sub?.name_of_project && sub.estimate_number && sub.year_of_estimate
    ? `/projects/${encodeURIComponent(sub.name_of_project)}/estimates/${encodeURIComponent(sub.estimate_number)}/${encodeURIComponent(sub.year_of_estimate)}`
    : sub?.name_of_project ? `/projects/${encodeURIComponent(sub.name_of_project)}` : '/projects'

  if (loading) return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ height: 24, width: 200, background: '#f1f5f9', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '28px', height: 200 }} />
    </div>
  )

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleEstimateUpload} />

      {/* Back link */}
      <div style={{ marginBottom: 20 }}>
        <Link to={backTo} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500,
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#2563eb'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
          Back
        </Link>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {sub && (
        <>
          {/* Module header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Module
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#1a3a6b' }}>
                {sub.module.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 13.5 }}>
              Fill in all sections below to complete your audit application.
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8ecf1', padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Application Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: progressColor }}>{percentage}% Complete</span>
            </div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percentage}%`, background: progressColor, borderRadius: 999, transition: 'width .4s ease' }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
              {completedCount} of {totalCount} sections filled in
            </div>
          </div>

          {/* Completion banner */}
          {percentage === 100 && (
            <div style={{
              background: 'rgba(5,150,105,.07)', border: '1px solid rgba(5,150,105,.25)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>🎉</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>All Sections Complete!</div>
                <div style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>Scroll down to review and submit your complete application.</div>
              </div>
            </div>
          )}

          {/* Already submitted banner */}
          {isCompleted && (
            <div style={{
              background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.2)',
              borderRadius: 12, padding: '14px 20px', marginBottom: 20,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                ✓ This application has been submitted and is read-only.
              </span>
            </div>
          )}

          {/* Section tabs + form */}
          {colsLoading ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ height: 32, background: '#f8f9fb', borderRadius: 6 }} />)}
            </div>
          ) : availableTables.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              No contract tables found in the database.
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', overflow: 'hidden', marginBottom: 24 }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', overflowX: 'auto', padding: '0 8px' }}>
                {availableTables.map(t => {
                  const hasData = (sub.table_data[t]?.length ?? 0) > 0
                  const isActive = activeTab === t
                  return (
                    <button key={t} onClick={() => setActiveTab(t)} style={{
                      padding: '11px 16px', fontSize: 11, fontWeight: 700, border: 'none',
                      background: 'none', cursor: 'pointer', letterSpacing: '0.8px',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                      borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                      color: isActive ? '#2563eb' : '#94a3b8',
                      fontFamily: 'Inter, sans-serif', marginBottom: -1,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: hasData ? '#16a34a' : '#f59e0b',
                        boxShadow: hasData ? '0 0 0 2px rgba(22,163,74,.15)' : '0 0 0 2px rgba(245,158,11,.15)',
                      }} />
                      {tableSectionLabel(t)}
                    </button>
                  )
                })}
              </div>

              {/* Active section */}
              {availableTables.map(t => {
                if (t !== activeTab || !tableColumns[t]) return null
                const isFirst = t === firstTable
                const isLocked = !isFirst && !firstHasData
                const isTechInspection = t === TECH_INSPECTION_TABLE

                return (
                  <div key={t}>
                    {/* Section helper */}
                    <div style={{
                      margin: '16px 24px 0',
                      padding: '12px 16px', borderRadius: 8,
                      background: isLocked ? 'rgba(234,179,8,.06)' : 'rgba(37,99,235,.04)',
                      border: `1px solid ${isLocked ? 'rgba(234,179,8,.25)' : 'rgba(37,99,235,.12)'}`,
                      fontSize: 13, color: isLocked ? '#a16207' : '#334155',
                    }}>
                      {isLocked ? (
                        <><strong>Please complete the first section first.</strong> You must save the first section before proceeding.</>
                      ) : (
                        <><strong>How to fill this section:</strong> {isTechInspection ? <>Select an inspection type below, fill the fields, then click <strong>Save Section</strong>.</> : <>Fill all fields below then click <strong>Save Section</strong> at the bottom. You can edit any time before submitting.</>}</>
                      )}
                    </div>

                    {isLocked ? null : isTechInspection ? (
                      <TechnicalInspectionForm
                        subId={Number(subId)}
                        existingRow={sub.table_data[t]?.[0] as Record<string, unknown> | undefined}
                        masterFields={{
                          estimate_number: sub.estimate_number,
                          year_of_estimate: sub.year_of_estimate,
                          name_of_project: sub.name_of_project,
                        }}
                        onSaved={fetchSub}
                        readOnly={isCompleted || isAdmin}
                      />
                    ) : (
                      <SectionForm
                        subId={Number(subId)}
                        tableName={t}
                        columns={tableColumns[t]}
                        existingRow={sub.table_data[t]?.[0] as Record<string, unknown> | undefined}
                        masterFields={{
                          estimate_number: sub.estimate_number,
                          year_of_estimate: sub.year_of_estimate,
                          name_of_project: sub.name_of_project,
                        }}
                        onSaved={fetchSub}
                        readOnly={isCompleted}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Estimate file upload */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 14 }}>
              Estimate File Upload
            </div>
            {sub.estimate_attachment && (
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                On record: <span style={{ fontWeight: 600, color: '#2563eb' }}>{sub.estimate_attachment.split('/').pop()}</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingEst}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1px solid #e8ecf1', background: uploadingEst ? '#f8fafc' : '#fff',
                color: uploadingEst ? '#94a3b8' : '#334155', cursor: uploadingEst ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {uploadingEst ? 'Uploading…' : sub.estimate_attachment ? 'Replace Estimate File' : 'Upload Estimate'}
            </button>
          </div>

          {/* Submit CTA */}
          <div style={{
            background: 'rgba(37,99,235,.04)', border: '1px solid rgba(37,99,235,.15)',
            borderRadius: 14, padding: '24px', marginBottom: 8,
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a3a6b', marginBottom: 6 }}>
              🚀 Ready to Submit Your Application?
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              Once all sections are complete, submit your full application for review.
            </div>

            {isCompleted ? (
              <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                ✓ Application has been submitted successfully.
              </div>
            ) : incompleteSections.length > 0 ? (
              <>
                <div style={{
                  background: 'rgba(234,179,8,.06)', border: '1px solid rgba(234,179,8,.25)',
                  borderRadius: 8, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: '#a16207',
                }}>
                  Some sections are still incomplete. Complete all sections before submitting.
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {incompleteSections.map((s, idx) => (
                      <span key={s} style={{ fontSize: 12 }}>
                        &nbsp;&nbsp;<strong>{idx + 1}.</strong> {tableSectionLabel(s)}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
                  Progress: {completedCount}/{totalCount} sections complete.
                </div>
                <button disabled style={{
                  width: '100%', padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: '#e2e8f0', color: '#94a3b8', border: 'none', cursor: 'not-allowed',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  🚀 Submit My Complete Application
                </button>
              </>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%', padding: '11px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: submitting ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {submitting ? 'Submitting…' : '🚀 Submit My Complete Application'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
