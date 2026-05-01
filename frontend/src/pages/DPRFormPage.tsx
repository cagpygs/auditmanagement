import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProjectDPR, upsertProjectDPR, uploadFile } from '../api/projects'
import type { DPRRecord } from '../types'

const UP_DISTRICTS = [
  'Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya','Ayodhya','Azamgarh',
  'Baghpat','Bahraich','Ballia','Balrampur','Banda','Barabanki','Bareilly','Basti',
  'Bhadohi','Bijnor','Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah',
  'Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar','Ghaziabad',
  'Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur','Hardoi','Hathras','Jalaun',
  'Jaunpur','Jhansi','Kannauj','Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi',
  'Kushinagar','Lakhimpur Kheri','Lalitpur','Lucknow','Maharajganj','Mahoba','Mainpuri',
  'Mathura','Mau','Meerut','Mirzapur','Moradabad','Muzaffarnagar','Pilibhit','Pratapgarh',
  'Prayagraj','Rae Bareli','Rampur','Saharanpur','Sambhal','Sant Kabir Nagar',
  'Shahjahanpur','Shamli','Shravasti','Siddharthnagar','Sitapur','Sonbhadra',
  'Sultanpur','Unnao','Varanasi',
]

const S: React.CSSProperties = { fontFamily: 'Inter, sans-serif' }

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4, display: 'block' }}>
      {text}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px', border: '1px solid #e8ecf1',
        borderRadius: 8, fontSize: 13, color: '#334155', background: '#fff',
        outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
      }}
    />
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px', border: '1px solid #e8ecf1',
        borderRadius: 8, fontSize: 13, color: '#334155', background: '#fff',
        outline: 'none', fontFamily: 'Inter, sans-serif',
      }}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#ea580c',
      letterSpacing: '1.5px', textTransform: 'uppercase',
      borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 16, marginTop: 24,
    }}>
      {title}
    </div>
  )
}

export default function DPRFormPage() {
  const { projectName } = useParams<{ projectName: string }>()
  const decoded = decodeURIComponent(projectName ?? '')
  const navigate = useNavigate()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [activeRevTab, setActiveRevTab] = useState(1)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadFieldRef = useRef<keyof DPRRecord | null>(null)

  // Form state
  const [f, setF] = useState<Partial<DPRRecord>>({})

  useEffect(() => {
    if (!decoded) return
    getProjectDPR(decoded).then(existing => {
      if (existing) setF(existing)
    })
  }, [decoded])

  const set = (key: keyof DPRRecord) => (v: string) => setF(prev => ({ ...prev, [key]: v }))

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const field = uploadFieldRef.current
    if (!file || !field) return
    setUploading(field as string)
    try {
      const { path } = await uploadFile(file)
      setF(prev => ({ ...prev, [field]: path }))
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function triggerUpload(field: keyof DPRRecord) {
    uploadFieldRef.current = field
    fileInputRef.current?.click()
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await upsertProjectDPR(decoded, f)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save DPR. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const DOC_FIELDS: { key: keyof DPRRecord; label: string }[] = [
    { key: 'upload_complete_dpr_file_name', label: 'Complete DPR Document' },
    { key: 'investment_clearence_file_name', label: 'Investment Clearance (GOI)' },
    { key: 'cwc_clearence_file_name', label: 'CWC Clearance' },
    { key: 'dpr_approval_by_efc_file_name', label: 'EFC Approval' },
    { key: 'survey_reports_file_name', label: 'Survey Reports' },
  ]

  return (
    <div style={{ padding: '32px 36px', ...S }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFileUpload} />
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
            background: 'rgba(234,88,12,.08)', borderRadius: 20, padding: '4px 12px', marginBottom: 6,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Detailed Project Report
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{decoded}</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Official project scope and approved parameters</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,.1)', padding: '6px 14px', borderRadius: 8 }}>
              ✓ Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#94a3b8' : '#2563eb', color: '#fff',
              border: 'none', borderRadius: 8, padding: '9px 20px',
              fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {saving ? 'Saving…' : '🖫 Save DPR'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 18px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Form Card */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '28px 32px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          {/* LEFT COLUMN */}
          <div>
            <SectionHeader title="Administrative Classification" />
            <div style={{ marginBottom: 14 }}>
              <Label text="Category of Project" />
              <Select value={f.category_of_project || '-- Select --'} onChange={set('category_of_project')} options={['-- Select --', 'Irrigation', 'Multipurpose']} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label text="Type of Project" />
              <Select value={f.type_of_project || '-- Select --'} onChange={set('type_of_project')} options={['-- Select --', 'Storage', 'Diversion']} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label text="Location of Head Works" />
              <Input value={f.location_of_head_works || ''} onChange={set('location_of_head_works')} placeholder="e.g. Haridwar, Uttarakhand" />
            </div>

            <SectionHeader title="Statutory Clearances" />
            <div style={{ marginBottom: 14 }}>
              <Label text="Investment Clearance (GOI)" />
              <Input value={f.date_of_investement_clearance_by_goi || ''} onChange={set('date_of_investement_clearance_by_goi')} placeholder="DD-MM-YYYY" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label text="CWC Clearance Date" />
              <Input value={f.date_of_cwc_clearence || ''} onChange={set('date_of_cwc_clearence')} placeholder="DD-MM-YYYY" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label text="EFC Approval Date" />
              <Input value={f.date_of_approval_of_efc || ''} onChange={set('date_of_approval_of_efc')} placeholder="DD-MM-YYYY" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label text="Districts Covered" />
              <select
                multiple
                value={(f.districts_covered || '').split(',').map(s => s.trim()).filter(Boolean)}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions).map(o => o.value)
                  setF(prev => ({ ...prev, districts_covered: selected.join(', ') }))
                }}
                style={{
                  width: '100%', height: 130, padding: '6px', border: '1px solid #e8ecf1',
                  borderRadius: 8, fontSize: 12, color: '#334155', background: '#fff',
                  outline: 'none', fontFamily: 'Inter, sans-serif',
                }}
              >
                {UP_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                Hold Ctrl/Cmd to select multiple. Selected: {f.districts_covered || 'None'}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <SectionHeader title="Technical Parameters & Potential" />
            {[
              { key: 'gross_command_area' as keyof DPRRecord, label: 'Gross Command Area (Ha)' },
              { key: 'cca' as keyof DPRRecord, label: 'CCA (Ha)' },
              { key: 'irrigation_potential_in_rabi' as keyof DPRRecord, label: 'Irrigation Potential – Rabi (Ha)' },
              { key: 'irrigation_potential_in_kharif' as keyof DPRRecord, label: 'Irrigation Potential – Kharif (Ha)' },
              { key: 'requirement_of_water_for_project' as keyof DPRRecord, label: 'Water Requirement (MCM)' },
              { key: 'availability_of_water_against_the_requirement' as keyof DPRRecord, label: 'Available Water (MCM)' },
            ].map(({ key, label }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <Label text={label} />
                <Input value={(f[key] as string) || ''} onChange={set(key)} placeholder="Enter value" />
              </div>
            ))}

            <SectionHeader title="Crop Patterns" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Pre-Project</p>
                <div style={{ marginBottom: 12 }}>
                  <Label text="Rabi" />
                  <Input value={f.pre_project_crop_pattern_in_rabi || ''} onChange={set('pre_project_crop_pattern_in_rabi')} placeholder="e.g. Wheat 60%" />
                </div>
                <div>
                  <Label text="Kharif" />
                  <Input value={f.pre_project_crop_pattern_in_kharif || ''} onChange={set('pre_project_crop_pattern_in_kharif')} placeholder="e.g. Paddy 40%" />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Post-Project</p>
                <div style={{ marginBottom: 12 }}>
                  <Label text="Rabi" />
                  <Input value={f.post_project_crop_pattern_in_rabi || ''} onChange={set('post_project_crop_pattern_in_rabi')} placeholder="e.g. Wheat 70%" />
                </div>
                <div>
                  <Label text="Kharif" />
                  <Input value={f.post_project_crop_pattern_in_kharif || ''} onChange={set('post_project_crop_pattern_in_kharif')} placeholder="e.g. Paddy 55%" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '24px 32px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>
          Document Attachments
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {DOC_FIELDS.map(({ key, label }) => {
            const hasFile = !!(f[key] as string)
            const isUp = uploading === (key as string)
            return (
              <div key={key} style={{ border: '1px dashed #e2e8f0', borderRadius: 10, padding: '14px 12px', textAlign: 'center', background: hasFile ? 'rgba(22,163,74,.04)' : '#fafafa' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, lineHeight: 1.4 }}>{label}</div>
                {hasFile && (
                  <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginBottom: 8 }}>✓ Uploaded</div>
                )}
                <button
                  onClick={() => triggerUpload(key)}
                  disabled={isUp}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6, border: 'none', cursor: isUp ? 'not-allowed' : 'pointer',
                    background: hasFile ? 'rgba(22,163,74,.1)' : 'rgba(37,99,235,.08)',
                    color: hasFile ? '#16a34a' : '#2563eb',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {isUp ? 'Uploading…' : hasFile ? 'Replace' : '↑ Upload'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* DPR Revisions */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '24px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>
          DPR Revisions
        </div>
        {/* Revision tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e8ecf1', marginBottom: 20 }}>
          {[1,2,3,4,5,6].map(i => (
            <button key={i} onClick={() => setActiveRevTab(i)} style={{
              padding: '7px 16px', fontSize: 12, fontWeight: 600, border: 'none',
              background: 'none', cursor: 'pointer', borderBottom: activeRevTab === i ? '2px solid #2563eb' : '2px solid transparent',
              color: activeRevTab === i ? '#2563eb' : '#94a3b8', marginBottom: -1,
              fontFamily: 'Inter, sans-serif',
            }}>
              v{i}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { key: `date_of_approval_revised_dpr_revision_${activeRevTab}` as keyof DPRRecord, label: 'Date of Approval (Revised)' },
            { key: `amount_of_revised_dpr_revision_${activeRevTab}` as keyof DPRRecord, label: 'Amount of Revised DPR' },
            { key: `target_date_to_complete_project_revision_${activeRevTab}` as keyof DPRRecord, label: 'Target Completion Date' },
          ].map(({ key, label }) => (
            <div key={key}>
              <Label text={label} />
              <Input value={(f[key] as string) || ''} onChange={set(key)} placeholder="Enter value" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
