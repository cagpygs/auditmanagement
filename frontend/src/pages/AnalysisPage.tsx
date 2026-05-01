import { useState } from 'react'

const CHECKS = [
  {
    name: 'EXPENDITURE INTENSITY',
    desc: 'Net Paid vs Sanctioned Budget',
    threshold: '> 100%',
    risk: 'Critical',
    riskClass: 'bg-red-100 text-red-700',
    nameColor: 'text-red-600',
    iconColor: '#ef4444',
    iconBg: 'bg-red-50',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    ),
  },
  {
    name: 'AGREEMENT SPLITTING',
    desc: 'Fragmented contracts in same ID',
    threshold: 'Detected',
    risk: 'High',
    riskClass: 'bg-orange-100 text-orange-700',
    nameColor: 'text-yellow-700',
    iconColor: '#ca8a04',
    iconBg: 'bg-yellow-50',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    ),
  },
  {
    name: 'TS COMPLIANCE',
    desc: 'Agreements > TS Value',
    threshold: '> 5% Delta',
    risk: 'Medium',
    riskClass: 'bg-blue-100 text-blue-700',
    nameColor: 'text-blue-600',
    iconColor: '#3b82f6',
    iconBg: 'bg-blue-50',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
  {
    name: 'STATUTORY VELOCITY',
    desc: 'Delayed EFC/CWC clearances',
    threshold: '> 24 Months',
    risk: 'High',
    riskClass: 'bg-orange-100 text-orange-700',
    nameColor: 'text-orange-600',
    iconColor: '#f97316',
    iconBg: 'bg-orange-50',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    name: 'GEOMETRIC INTEGRITY',
    desc: 'CCA / GCA Ratio Anomaly',
    threshold: '> 0.95',
    risk: 'Medium',
    riskClass: 'bg-green-100 text-green-700',
    nameColor: 'text-green-700',
    iconColor: '#22c55e',
    iconBg: 'bg-green-50',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        <circle cx="12" cy="12" r="4"  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      </>
    ),
  },
  {
    name: 'REVISION VOLATILITY',
    desc: 'Frequent baseline modifications',
    threshold: '> 3 Revised',
    risk: 'Low',
    riskClass: 'bg-gray-100 text-gray-600',
    nameColor: 'text-blue-600',
    iconColor: '#3b82f6',
    iconBg: 'bg-blue-50',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    ),
  },
  {
    name: 'EXECUTION SYNC',
    desc: 'Civil vs Mech execution lag',
    threshold: '> 40% Gap',
    risk: 'Medium',
    riskClass: 'bg-blue-100 text-blue-700',
    nameColor: 'text-slate-600',
    iconColor: '#64748b',
    iconBg: 'bg-slate-50',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    ),
  },
  {
    name: 'LABOR CESS INTEGRITY',
    desc: 'BOCW 1% mismatch in MB',
    threshold: 'Unverified',
    risk: 'High',
    riskClass: 'bg-orange-100 text-orange-700',
    nameColor: 'text-red-600',
    iconColor: '#ef4444',
    iconBg: 'bg-red-50',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
  },
]

const CHIPS = [
  'Compare DPR sanctioned cost vs actual agreement value for all Division IV projects.',
  'Identify discrepancies between BOCW payments and scheduled labor components in Sharda Modernization.',
  'Retrieve all revised technical sanctions where the increase exceeds 20% of A&F.',
  'Cross-verify MB entries with site inspection reports for Upper Ganga project.',
]

export default function AnalysisPage() {
  const [query, setQuery] = useState('')

  return (
    <div className="p-8">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full mb-3">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Project Checks</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Project Analysis &amp; Checks</h1>
          <p className="text-gray-500 text-sm mt-1">Verify data and check for issues across the project list.</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">System Active</span>
        </div>
      </div>

      {/* Query card */}
      <div className="rounded-2xl bg-[#0f1117] p-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">Project Query</span>
        </div>
        <p className="text-gray-400 text-xs mb-4">
          Query across the entire project list using simple words. The system will check for errors between reports and estimates.
        </p>
        <div className="flex items-center gap-2 bg-[#1a1f2e] rounded-xl px-4 py-3 mb-4">
          <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Compare DPR sanctioned cost vs actual agreement value for all projects..."
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none"
          />
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ANALYZE
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map(c => (
            <button
              key={c}
              onClick={() => setQuery(c)}
              className="px-3 py-1.5 bg-[#1a1f2e] hover:bg-[#252b3b] border border-gray-700 hover:border-gray-500 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors text-left"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance checks header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-bold text-gray-800">Project Compliance Checks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Checking Projects</span>
        </div>
      </div>

      {/* Check cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {CHECKS.map(c => (
          <div key={c.name} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.iconBg}`}>
              <svg width="18" height="18" fill="none" stroke={c.iconColor} viewBox="0 0 24 24">
                {c.icon}
              </svg>
            </div>
            <p className={`text-[11px] font-bold tracking-wider uppercase mb-1 ${c.nameColor}`}>{c.name}</p>
            <p className="text-xs text-gray-400 mb-4">{c.desc}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-300 mb-0.5">Threshold</p>
                <p className="text-sm font-bold text-gray-700">{c.threshold}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-300 mb-0.5">Risk</p>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${c.riskClass}`}>{c.risk}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
