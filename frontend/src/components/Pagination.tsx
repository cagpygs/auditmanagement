interface Props {
  total: number
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}

const SIZES = [10, 25, 50, 100]

export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= SIZES[0]) return null

  const btn = (label: string, disabled: boolean, onClick: () => void) => (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 7, border: '1px solid #e8ecf1',
        background: disabled ? '#f8fafc' : '#fff', color: disabled ? '#cbd5e1' : '#334155',
        fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderTop: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>ROWS PER PAGE</span>
        <select
          value={pageSize}
          onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1) }}
          style={{ padding: '4px 8px', border: '1px solid #e8ecf1', borderRadius: 6, fontSize: 12, color: '#334155', background: '#fff', fontFamily: 'Inter, sans-serif' }}
        >
          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {btn('«', page === 1, () => onPageChange(1))}
        {btn('‹', page === 1, () => onPageChange(page - 1))}
        <span style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#2563eb' }}>
          {page} / {totalPages}
        </span>
        {btn('›', page === totalPages, () => onPageChange(page + 1))}
        {btn('»', page === totalPages, () => onPageChange(totalPages))}
      </div>
    </div>
  )
}
