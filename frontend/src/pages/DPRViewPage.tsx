import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProjectDPR } from '../api/projects'
import type { DPRRecord } from '../types'

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FieldCard({ title, badge, fields }: {
  title: string
  badge?: string
  fields: { label: string; value: string | null | undefined }[]
}) {
  const filled = fields.filter(f => f.value).length
  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1',
      boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '20px 24px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {title}
        </span>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            background: filled > 0 ? 'rgba(22,163,74,.1)' : '#f1f5f9',
            color: filled > 0 ? '#16a34a' : '#94a3b8',
          }}>
            {filled}/{fields.length}
          </span>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
        {fields.map(f => (
          <div key={f.label}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>
              {f.label}
            </p>
            <p style={{ fontSize: 13, color: f.value ? '#1e293b' : '#cbd5e1', fontWeight: f.value ? 500 : 400 }}>
              {f.value || '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DPRViewPage() {
  const { projectName } = useParams<{ projectName: string }>()
  const decoded = decodeURIComponent(projectName ?? '')

  const [dpr, setDpr] = useState<DPRRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!decoded) return
    getProjectDPR(decoded)
      .then(setDpr)
      .catch(() => setError('Failed to load DPR.'))
      .finally(() => setLoading(false))
  }, [decoded])

  if (loading) return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ height: 24, width: 300, background: '#f1f5f9', borderRadius: 6, marginBottom: 32 }} />
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 24px', marginBottom: 16, height: 120 }} />
      ))}
    </div>
  )

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
        <Link to={`/projects/${encodeURIComponent(decoded)}`} style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid #e8ecf1',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#64748b', textDecoration: 'none', flexShrink: 0, marginTop: 2,
        }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(37,99,235,.07)', borderRadius: 20,
            padding: '4px 12px', marginBottom: 6,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              DPR Profile
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: 2 }}>{decoded}</h1>
          {dpr && (
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Last updated: {formatDate(dpr.updated_at)}
              {dpr.dpr_file_name && ` · File: ${dpr.dpr_file_name}`}
            </p>
          )}
        </div>
        <Link to={`/projects/${encodeURIComponent(decoded)}/dpr/edit`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#2563eb', color: '#fff',
          fontSize: 12, fontWeight: 600,
          padding: '8px 16px', borderRadius: 8,
          textDecoration: 'none',
        }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Update DPR
        </Link>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {!dpr && !error && (
        <div style={{ background: 'rgba(37,99,235,.05)', border: '1px solid rgba(37,99,235,.18)', borderRadius: 14, padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>No DPR found for this project.</p>
          <Link to={`/projects/${encodeURIComponent(decoded)}/dpr/edit`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600,
            padding: '8px 18px', borderRadius: 8, textDecoration: 'none',
          }}>
            + Create DPR
          </Link>
        </div>
      )}

      {dpr && (
        <>
          <FieldCard
            title="Administrative Classification"
            badge="true"
            fields={[
              { label: 'Category of Project', value: dpr.category_of_project },
              { label: 'Type of Project', value: dpr.type_of_project },
              { label: 'Location of Head Works', value: dpr.location_of_head_works },
            ]}
          />
          <FieldCard
            title="Statutory Clearances"
            badge="true"
            fields={[
              { label: 'Investment Clearance (GOI)', value: dpr.date_of_investement_clearance_by_goi },
              { label: 'CWC Clearance Date', value: dpr.date_of_cwc_clearence },
              { label: 'EFC Approval Date', value: dpr.date_of_approval_of_efc },
              { label: 'Districts Covered', value: dpr.districts_covered },
            ]}
          />
          <FieldCard
            title="Technical Parameters & Potential"
            badge="true"
            fields={[
              { label: 'Gross Command Area (Ha)', value: dpr.gross_command_area },
              { label: 'CCA (Ha)', value: dpr.cca },
              { label: 'Irrigation Potential – Rabi (Ha)', value: dpr.irrigation_potential_in_rabi },
              { label: 'Irrigation Potential – Kharif (Ha)', value: dpr.irrigation_potential_in_kharif },
              { label: 'Water Requirement (MCM)', value: dpr.requirement_of_water_for_project },
              { label: 'Available Water (MCM)', value: dpr.availability_of_water_against_the_requirement },
            ]}
          />
          <FieldCard
            title="Crop Patterns (Pre vs Post)"
            badge="true"
            fields={[
              { label: 'Pre-Project Rabi', value: dpr.pre_project_crop_pattern_in_rabi },
              { label: 'Pre-Project Kharif', value: dpr.pre_project_crop_pattern_in_kharif },
              { label: 'Post-Project Rabi', value: dpr.post_project_crop_pattern_in_rabi },
              { label: 'Post-Project Kharif', value: dpr.post_project_crop_pattern_in_kharif },
            ]}
          />
          <FieldCard
            title="Supporting Documents"
            badge="true"
            fields={[
              { label: 'Complete DPR', value: dpr.upload_complete_dpr_file_name },
              { label: 'Investment Clearance', value: dpr.investment_clearence_file_name },
              { label: 'CWC Clearance', value: dpr.cwc_clearence_file_name },
              { label: 'DPR Approval by EFC', value: dpr.dpr_approval_by_efc_file_name },
              { label: 'Survey Reports', value: dpr.survey_reports_file_name },
            ]}
          />

          {/* Revisions */}
          {[1,2,3,4,5,6].some(i => dpr[`amount_of_revised_dpr_revision_${i}` as keyof DPRRecord]) && (
            <FieldCard
              title="DPR Revisions"
              fields={[1,2,3,4,5,6].flatMap(i => [
                { label: `Rev ${i} – Approval Date`, value: dpr[`date_of_approval_revised_dpr_revision_${i}` as keyof DPRRecord] as string },
                { label: `Rev ${i} – Amount`, value: dpr[`amount_of_revised_dpr_revision_${i}` as keyof DPRRecord] as string },
                { label: `Rev ${i} – Target Date`, value: dpr[`target_date_to_complete_project_revision_${i}` as keyof DPRRecord] as string },
              ]).filter(f => f.value)}
            />
          )}
        </>
      )}
    </div>
  )
}
