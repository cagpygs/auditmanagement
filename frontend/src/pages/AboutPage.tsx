const INFO_CARDS = [
  {
    emoji: '🏛️',
    label: 'MANDATE',
    body: 'To maximize irrigation potential through major, medium, and minor irrigation projects while ensuring efficient operation and maintenance of existing networks.',
  },
  {
    emoji: '〰️',
    label: 'NETWORK SCOPE',
    body: 'Supervising over 74,000 km of canal networks and 28,000+ state tube wells serving millions of hectares of agricultural land.',
  },
  {
    emoji: '👥',
    label: 'ADMINISTRATIVE HIERARCHY',
    body: 'Governed by the Principal Secretary, supported by Engineer-in-Chiefs and Chief Engineers across specialized zones and divisions.',
  },
]

export default function AboutPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl">

        {/* Hero banner */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1a1f2e] via-[#2d3748] to-[#4a5568] px-10 py-12 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-base">🏛️</span>
            <span className="text-xs font-bold tracking-[2.5px] text-blue-400 uppercase">
              Institutional Profile
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-1">
            Irrigation Department
          </h1>
          <h2 className="text-4xl font-extrabold text-blue-400 leading-tight mb-6">
            Government of Uttar Pradesh
          </h2>
          <p className="text-slate-300 text-base leading-relaxed max-w-xl">
            Ensuring regional prosperity through the systematic management of water
            resources, extensive canal networks, and the implementation of
            state-of-the-art agricultural irrigation standards.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {INFO_CARDS.map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <div className="text-3xl mb-4">{c.emoji}</div>
              <p className="text-xs font-bold tracking-[2px] text-blue-600 uppercase mb-3">{c.label}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
