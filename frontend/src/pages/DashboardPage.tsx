import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardMiniStats } from '../api/projects'
import type { MiniStats } from '../types'

export default function DashboardPage() {
  const [mini, setMini]       = useState<MiniStats | null>(null)
  const [miniLoad, setMiniLoad] = useState(true)

  useEffect(() => {
    getDashboardMiniStats()
      .then(setMini)
      .catch(() => {})
      .finally(() => setMiniLoad(false))
  }, [])

  const dprTotal  = mini?.dpr.total ?? 0
  const estDone   = mini?.estimates.completed ?? 0
  const estTotal  = estDone + (mini?.estimates.incomplete ?? 0)
  const conTotal  = (mini?.contracts.completed ?? 0) + (mini?.contracts.incomplete ?? 0)
  const estVal    = estTotal ? `${estDone}/${estTotal}` : '0/0'

  return (
    <div style={{ padding: '32px 36px', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 16, padding: '32px 40px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 24px rgba(0,0,0,.18)',
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,.75)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>
            &mdash; GOVERNMENT OF UTTAR PRADESH | CAG OF INDIA
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
            Irrigation Data Management System
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(148,163,184,.75)', maxWidth: 480 }}>
            A system to manage irrigation projects, track spending, and review documents.
          </p>
        </div>
        <Link to="/projects" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(37,99,235,.9)', color: '#fff',
          borderRadius: 10, padding: '11px 22px',
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
          letterSpacing: '0.5px', whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,.12)', flexShrink: 0,
        }}>
          ⊕ OPEN PROJECT
        </Link>
      </div>

      {/* ── Top Row: Project Summary + Recent Updates ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, marginBottom: 24 }}>

        {/* Project Summary card */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Project Summary</h3>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 3, background: '#3b82f6', borderRadius: 2, display: 'inline-block' }} />
                CHECKS
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 3, background: '#fb7185', borderRadius: 2, display: 'inline-block' }} />
                ISSUES
              </span>
            </div>
          </div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 16 }}>
            ESTIMATES CHECKED VS. ISSUES FOUND
          </p>

          <svg width="100%" height="220" viewBox="0 0 600 220" preserveAspectRatio="none" style={{ overflow: 'visible', display: 'block' }}>
            <defs>
              <linearGradient id="dashBlueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
              <filter id="dashShadow" x="-20%" y="-20%" width="160%" height="160%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.10" floodColor="#000" />
              </filter>
              <style>{`
                @keyframes dashDrawLine {
                  from { stroke-dashoffset: 1000; }
                  to   { stroke-dashoffset: 0; }
                }
                @keyframes dashFadeIn {
                  from { opacity: 0; }
                  to   { opacity: 1; }
                }
                @keyframes dashRiseUp {
                  from { opacity: 0; transform: translateY(8px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                .dash-blue-line {
                  stroke-dasharray: 1000;
                  stroke-dashoffset: 1000;
                  animation: dashDrawLine 1.6s cubic-bezier(0.4,0,0.2,1) 0.2s forwards;
                }
                .dash-red-line {
                  stroke-dasharray: 1000;
                  stroke-dashoffset: 1000;
                  animation: dashDrawLine 1.6s cubic-bezier(0.4,0,0.2,1) 0.5s forwards;
                }
                .dash-blue-fill {
                  opacity: 0;
                  animation: dashFadeIn 1.2s ease 0.9s forwards;
                }
                .dash-ax1 { opacity:0; animation: dashRiseUp 0.4s ease 1.0s forwards; }
                .dash-ax2 { opacity:0; animation: dashRiseUp 0.4s ease 1.1s forwards; }
                .dash-ax3 { opacity:0; animation: dashRiseUp 0.4s ease 1.2s forwards; }
                .dash-ax4 { opacity:0; animation: dashRiseUp 0.4s ease 1.3s forwards; }
                .dash-ax5 { opacity:0; animation: dashRiseUp 0.4s ease 1.4s forwards; }
                .dash-hg { opacity: 0; transition: opacity 0.22s cubic-bezier(0.4,0,0.2,1); cursor: crosshair; }
                .dash-hg:hover { opacity: 1; }
                .dash-hz { fill: transparent; }
              `}</style>
            </defs>

            {/* Grid lines */}
            <line x1="0" y1="40"  x2="600" y2="40"  stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
            <line x1="0" y1="100" x2="600" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
            <line x1="0" y1="160" x2="600" y2="160" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

            {/* Blue area fill */}
            <path className="dash-blue-fill"
              d="M 0 130 C 40 130, 80 90, 120 90 S 180 110, 240 110 S 300 60, 360 60 S 420 25, 480 25 S 530 15, 580 15 L 600 15 L 600 180 L 0 180 Z"
              fill="url(#dashBlueFill)" />

            {/* Blue solid line (CHECKS) */}
            <path className="dash-blue-line"
              d="M 0 130 C 40 130, 80 90, 120 90 S 180 110, 240 110 S 300 60, 360 60 S 420 25, 480 25 S 530 15, 580 15 L 600 15"
              fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

            {/* Red dashed line (ISSUES) */}
            <path className="dash-red-line"
              d="M 0 160 C 40 160, 80 165, 120 165 S 180 150, 240 150 S 300 175, 360 175 S 420 185, 480 185 S 530 185, 580 185 L 600 185"
              fill="none" stroke="#fb7185" strokeWidth="2" strokeDasharray="6,4" strokeLinecap="round" />

            {/* X Axis Labels */}
            <text className="dash-ax1" x="120" y="212" fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">W2</text>
            <text className="dash-ax2" x="240" y="212" fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">W3</text>
            <text className="dash-ax3" x="360" y="212" fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">W4</text>
            <text className="dash-ax4" x="480" y="212" fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">W5</text>
            <text className="dash-ax5" x="580" y="212" fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" textAnchor="middle">W6</text>

            {/* Hover Group W2 */}
            <g className="dash-hg">
              <rect className="dash-hz" x="60"  y="0" width="120" height="220" />
              <line x1="120" y1="0" x2="120" y2="190" stroke="#cbd5e1" strokeWidth="1" />
              <circle cx="120" cy="90"  r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <circle cx="120" cy="165" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
              <g transform="translate(130, 60)">
                <rect x="0" y="0" width="108" height="68" rx="9" fill="#fff" filter="url(#dashShadow)" />
                <text x="12" y="22" fill="#0f172a" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">W2</text>
                <text x="12" y="40" fill="#fb7185" fontSize="11" fontFamily="Inter, sans-serif">anomalies : 3</text>
                <text x="12" y="57" fill="#3b82f6" fontSize="11" fontFamily="Inter, sans-serif">throughput : 55</text>
              </g>
            </g>

            {/* Hover Group W3 */}
            <g className="dash-hg">
              <rect className="dash-hz" x="180" y="0" width="120" height="220" />
              <line x1="240" y1="0" x2="240" y2="190" stroke="#cbd5e1" strokeWidth="1" />
              <circle cx="240" cy="110" r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <circle cx="240" cy="150" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
              <g transform="translate(250, 80)">
                <rect x="0" y="0" width="108" height="68" rx="9" fill="#fff" filter="url(#dashShadow)" />
                <text x="12" y="22" fill="#0f172a" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">W3</text>
                <text x="12" y="40" fill="#fb7185" fontSize="11" fontFamily="Inter, sans-serif">anomalies : 2</text>
                <text x="12" y="57" fill="#3b82f6" fontSize="11" fontFamily="Inter, sans-serif">throughput : 45</text>
              </g>
            </g>

            {/* Hover Group W4 */}
            <g className="dash-hg">
              <rect className="dash-hz" x="300" y="0" width="120" height="220" />
              <line x1="360" y1="0" x2="360" y2="190" stroke="#cbd5e1" strokeWidth="1" />
              <circle cx="360" cy="60"  r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <circle cx="360" cy="175" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
              <g transform="translate(370, 30)">
                <rect x="0" y="0" width="108" height="68" rx="9" fill="#fff" filter="url(#dashShadow)" />
                <text x="12" y="22" fill="#0f172a" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">W4</text>
                <text x="12" y="40" fill="#fb7185" fontSize="11" fontFamily="Inter, sans-serif">anomalies : 5</text>
                <text x="12" y="57" fill="#3b82f6" fontSize="11" fontFamily="Inter, sans-serif">throughput : 70</text>
              </g>
            </g>

            {/* Hover Group W5 */}
            <g className="dash-hg">
              <rect className="dash-hz" x="420" y="0" width="110" height="220" />
              <line x1="480" y1="0" x2="480" y2="190" stroke="#cbd5e1" strokeWidth="1" />
              <circle cx="480" cy="25"  r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <circle cx="480" cy="185" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
              <g transform="translate(370, 5)">
                <rect x="0" y="0" width="108" height="68" rx="9" fill="#fff" filter="url(#dashShadow)" />
                <text x="12" y="22" fill="#0f172a" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">W5</text>
                <text x="12" y="40" fill="#fb7185" fontSize="11" fontFamily="Inter, sans-serif">anomalies : 1</text>
                <text x="12" y="57" fill="#3b82f6" fontSize="11" fontFamily="Inter, sans-serif">throughput : 88</text>
              </g>
            </g>

            {/* Hover Group W6 */}
            <g className="dash-hg">
              <rect className="dash-hz" x="530" y="0" width="70" height="220" />
              <line x1="580" y1="0" x2="580" y2="190" stroke="#cbd5e1" strokeWidth="1" />
              <circle cx="580" cy="15"  r="4" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
              <circle cx="580" cy="185" r="4" fill="#fb7185" stroke="#fff" strokeWidth="2" />
              <g transform="translate(462, 5)">
                <rect x="0" y="0" width="108" height="68" rx="9" fill="#fff" filter="url(#dashShadow)" />
                <text x="12" y="22" fill="#0f172a" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">W6</text>
                <text x="12" y="40" fill="#fb7185" fontSize="11" fontFamily="Inter, sans-serif">anomalies : 2</text>
                <text x="12" y="57" fill="#3b82f6" fontSize="11" fontFamily="Inter, sans-serif">throughput : 95</text>
              </g>
            </g>
          </svg>
        </div>

        {/* Recent Updates card */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Recent Updates</h3>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>No recent updates.</div>
        </div>
      </div>

      {/* ── Work Progress Section ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="16" height="16" fill="none" stroke="#64748b" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Work Progress</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

          {/* DPR Doc Status */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '20px 24px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,99,235,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="20" height="20" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 4 }}>DPR DOC STATUS</p>
            {miniLoad
              ? <div style={{ height: 32, width: 60, background: '#f1f5f9', borderRadius: 6, marginBottom: 6 }} />
              : <p style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: 4 }}>{dprTotal}</p>
            }
            <p style={{ fontSize: 12, color: '#94a3b8' }}>DPRs Filed</p>
          </div>

          {/* Estimate Queue */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '20px 24px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(234,88,12,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="20" height="20" fill="none" stroke="#ea580c" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 4 }}>ESTIMATE QUEUE</p>
            {miniLoad
              ? <div style={{ height: 32, width: 60, background: '#f1f5f9', borderRadius: 6, marginBottom: 6 }} />
              : <p style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: 4 }}>{estVal}</p>
            }
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Estimates Loaded</p>
          </div>

          {/* Contract Ledger */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', boxShadow: '0 2px 8px rgba(0,0,0,.05)', padding: '20px 24px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="20" height="20" fill="none" stroke="#7c3aed" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 4 }}>CONTRACT LEDGER</p>
            {miniLoad
              ? <div style={{ height: 32, width: 60, background: '#f1f5f9', borderRadius: 6, marginBottom: 6 }} />
              : <p style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', lineHeight: 1, marginBottom: 4 }}>{conTotal}</p>
            }
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Agreements Tracked</p>
          </div>
        </div>
      </div>

      {/* ── Project Sections ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <svg width="16" height="16" fill="none" stroke="#64748b" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Project Sections</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>

          {/* DPR */}
          <Link to="/all-dprs" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 22px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,.02)' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 16px rgba(0,0,0,.06)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 12px rgba(0,0,0,.02)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,99,235,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="20" height="20" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>DPR</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Project baseline setup, approvals, and tracking.</div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(22,163,74,.1)', color: '#16a34a' }}>OPERATIONAL</span>
            </div>
          </Link>

          {/* Estimates */}
          <Link to="/all-estimates" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 22px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,.02)' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 16px rgba(0,0,0,.06)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 4px 12px rgba(0,0,0,.02)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,99,235,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="20" height="20" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Estimates</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Management of estimates and agreements.</div>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(22,163,74,.1)', color: '#16a34a' }}>ACTIVE</span>
            </div>
          </Link>

          {/* Analysis & Checks (no link yet) */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 22px', boxShadow: '0 4px 12px rgba(0,0,0,.02)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,99,235,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="20" height="20" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Analysis & Checks</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Check documents for compliance and errors.</div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(22,163,74,.1)', color: '#16a34a' }}>ACTIVE</span>
          </div>

          {/* Financial Monitoring (no link yet) */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8ecf1', padding: '20px 22px', boxShadow: '0 4px 12px rgba(0,0,0,.02)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="20" height="20" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Financial Monitoring</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Monitor spending against budget.</div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,.1)', color: '#dc2626' }}>ACTIVE</span>
          </div>
        </div>
      </div>

    </div>
  )
}
