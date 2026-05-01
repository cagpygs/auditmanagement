const CARDS = [
  { title: 'EXPENDITURE INTENSITY', desc: 'Net Paid vs Sanctioned Budget', threshold: '> 100%', risk: 'Critical', riskBg: 'rgba(239,68,68,.1)', riskColor: '#ef4444', iconBg: 'rgba(239,68,68,.08)', icon: '⚡', titleColor: '#ef4444' },
  { title: 'AGREEMENT SPLITTING', desc: 'Fragmented contracts in same ID', threshold: 'Detected', risk: 'High', riskBg: 'rgba(249,115,22,.1)', riskColor: '#ea580c', iconBg: 'rgba(234,179,8,.08)', icon: '⇄', titleColor: '#ca8a04' },
  { title: 'TS COMPLIANCE', desc: 'Agreements > TS Value', threshold: '> 5% Delta', risk: 'Medium', riskBg: 'rgba(37,99,235,.1)', riskColor: '#2563eb', iconBg: 'rgba(37,99,235,.08)', icon: '📊', titleColor: '#2563eb' },
  { title: 'REVISION VOLATILITY', desc: 'Frequent baseline modifications', threshold: '> 3 Revised', risk: 'Low', riskBg: '#f1f5f9', riskColor: '#64748b', iconBg: 'rgba(22,163,74,.08)', icon: '🔄', titleColor: '#16a34a' },
  { title: 'EXECUTION SYNC', desc: 'Civil vs Mech execution lag', threshold: '> 40% Gap', risk: 'Medium', riskBg: 'rgba(37,99,235,.1)', riskColor: '#2563eb', iconBg: 'rgba(100,116,139,.08)', icon: '⚙️', titleColor: '#64748b' },
  { title: 'LABOR CESS INTEGRITY', desc: 'BOCW 1% mismatch in MB', threshold: 'Unverified', risk: 'High', riskBg: 'rgba(249,115,22,.1)', riskColor: '#ea580c', iconBg: 'rgba(239,68,68,.08)', icon: '⚠️', titleColor: '#ef4444' },
  { title: 'ADVANCE RECOVERY', desc: 'Adv paid vs % Work Progress', threshold: '> 6 Months', risk: 'Critical', riskBg: 'rgba(239,68,68,.1)', riskColor: '#ef4444', iconBg: 'rgba(249,115,22,.08)', icon: '📈', titleColor: '#ea580c' },
]

export default function MSIPage() {
  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,.07)', borderRadius: 20, padding: '4px 12px', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Market Sensitivity Indicators</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 6 }}>MSI Overview</h1>
        <p style={{ fontSize: 14, color: '#64748b' }}>Key indicators for monitoring contract execution risk and project compliance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {CARDS.map((c) => (
          <div key={c.title} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '22px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>
              {c.icon}
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: c.titleColor, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 4 }}>{c.title}</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, lineHeight: 1.4 }}>{c.desc}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#cbd5e1', marginBottom: 3 }}>Threshold</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{c.threshold}</p>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.riskBg, color: c.riskColor }}>{c.risk}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
