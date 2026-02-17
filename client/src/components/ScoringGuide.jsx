import { X, Printer } from 'lucide-react';

const sections = [
  {
    title: 'Part 2: Housing Need Urgency',
    description: 'Scores determine Housing Need Rating.',
    categories: [
      {
        name: 'Rough Sleeping Duration',
        options: [
          { label: 'Not applicable', score: 0 },
          { label: 'Housed but at risk', score: 1 },
          { label: 'Episodic (< 3 months)', score: 2 },
          { label: 'Chronic (3–12 months)', score: 3 },
          { label: 'Long-term (> 12 months)', score: 4 },
        ],
      },
      {
        name: 'Current Housing Status',
        options: [
          { label: 'Stable temporary', score: 1 },
          { label: 'Overcrowding', score: 2 },
          { label: 'Unsuitable current housing', score: 2 },
          { label: 'Unstable temporary', score: 2 },
          { label: 'Couch surfing', score: 3 },
          { label: 'Emergency accommodation', score: 3 },
        ],
      },
    ],
    thresholds: [
      { rating: 'Low', range: '0–3', meaning: 'Standard allocation pipeline' },
      { rating: 'Medium', range: '4–6', meaning: 'Should be prioritised appropriately' },
      { rating: 'High', range: '7–10', meaning: 'Immediate or priority housing response required' },
    ],
  },
  {
    title: 'Part 3: Tenancy Challenge',
    description: 'Scores add to Gross Challenge Score.',
    categories: [
      {
        name: 'Anti-Social Behaviour',
        options: [
          { label: 'Positive history / no previous tenancy', score: 0 },
          { label: 'Minor issues resolved', score: 1 },
          { label: 'Eviction(s) with mitigating factors', score: 2 },
          { label: 'Neighbour disputes', score: 3 },
          { label: 'Multiple evictions', score: 4 },
        ],
      },
      {
        name: 'Criminal History',
        options: [
          { label: 'No concerns', score: 0 },
          { label: 'Historical, now resolved', score: 1 },
          { label: 'Drug related', score: 3 },
          { label: 'Intimidation / assault', score: 4 },
          { label: 'Violence', score: 4 },
        ],
      },
      {
        name: 'Gang Affiliations',
        options: [
          { label: 'No concerns', score: 0 },
          { label: 'Historical, now resolved', score: 1 },
          { label: 'Recent gang association', score: 3 },
          { label: 'Gang member', score: 4 },
        ],
      },
      {
        name: 'Third Party Association',
        options: [
          { label: 'No concerns', score: 0 },
          { label: 'Historical, now resolved', score: 1 },
          { label: 'Potential concern', score: 2 },
          { label: 'Known concern', score: 4 },
        ],
      },
      {
        name: 'Property Damage',
        options: [
          { label: 'No damage history', score: 0 },
          { label: 'Minor / one-off resolved', score: 1 },
          { label: 'Serious or repeated', score: 3 },
          { label: 'Damage arrears', score: 3 },
        ],
      },
      {
        name: 'Rent',
        options: [
          { label: 'No concerns', score: 0 },
          { label: 'Rent arrears history', score: 2 },
        ],
      },
      {
        name: 'Tenant Responsibility',
        options: [
          { label: 'Strong responsibility', score: 0 },
          { label: 'Moderate responsibility', score: 1 },
          { label: 'Limited responsibility', score: 2 },
          { label: 'No capacity currently', score: 3 },
        ],
      },
    ],
  },
  {
    title: 'Part 4: Health & Wellbeing',
    description: 'Scores add to Gross Challenge Score.',
    categories: [
      {
        name: 'Physical Health',
        options: [
          { label: 'No significant needs', score: 0 },
          { label: 'Managed chronic condition', score: 1 },
          { label: 'Multiple / poorly managed', score: 2 },
          { label: 'Acute / hospital-level', score: 3 },
        ],
      },
      {
        name: 'Mental Health',
        options: [
          { label: 'No concerns', score: 0 },
          { label: 'Diagnosed but stable', score: 1 },
          { label: 'Active challenges', score: 2 },
          { label: 'Co-occurring disorders', score: 3 },
        ],
      },
      {
        name: 'Substance Abuse',
        options: [
          { label: 'No concerns', score: 0 },
          { label: 'Diagnosed but stable', score: 1 },
          { label: 'Active challenges', score: 3 },
          { label: 'Co-occurring disorders', score: 3 },
        ],
      },
    ],
  },
  {
    title: 'Part 5: Support Networks (Mitigation)',
    description: 'Negative scores reduce the Gross Challenge Score.',
    categories: [
      {
        name: 'Support Network Strength',
        options: [
          { label: 'Strong support', score: -3 },
          { label: 'Moderate support', score: -2 },
          { label: 'Minimal support', score: -1 },
          { label: 'No support', score: 0 },
        ],
      },
      {
        name: 'Accessibility Needs',
        options: [
          { label: 'No accessibility needs', score: -2 },
          { label: 'Minor needs', score: -1 },
          { label: 'Significant needs', score: 0 },
          { label: 'Severe needs', score: 0 },
        ],
      },
      {
        name: 'Cultural / Community Connections',
        options: [
          { label: 'Strong connections', score: -2 },
          { label: 'Moderate connections', score: -1 },
          { label: 'Limited connections', score: 0 },
          { label: 'No connections', score: 0 },
        ],
      },
    ],
  },
];

const formulaSteps = [
  { label: 'Housing Need Score', formula: 'Rough Sleeping + Housing Status', range: '0–7' },
  { label: 'Gross Challenge Score', formula: 'Tenancy Challenge (Part 3) + Health & Wellbeing (Part 4)', range: '0–30+' },
  { label: 'Total Mitigation', formula: 'Support Network + Accessibility + Cultural (Part 5)', range: '-7 to 0' },
  { label: 'Residual Challenge Score', formula: 'Gross Challenge + Mitigation (min 0)', range: '0–30+' },
];

const ratingThresholds = [
  { measure: 'Housing Need', low: '0–3', medium: '4–6', high: '7–10' },
  { measure: 'Gross Challenge', low: '0–5', medium: '6–12', high: '13+' },
  { measure: 'Residual Challenge', low: '0–3', medium: '4–8', high: '9+' },
];

const propertyRecommendations = [
  { rating: 'Low (0–3)', types: 'Stand-alone or Housing complex (2–10)' },
  { rating: 'Medium (4–8)', types: 'Housing complex (2–10) or (11–20)' },
  { rating: 'High (9+)', types: 'Housing complex (20+) or Institutional' },
  { rating: 'Severe Accessibility', types: 'Stand-alone (purpose-built) or Institutional' },
];

const approvalPathways = [
  { rating: 'Low', approval: 'Frontline Approval (self-approved by assessor)' },
  { rating: 'Medium', approval: 'Manager Approval Required' },
  { rating: 'High', approval: 'Senior Manager Approval Required' },
];

export default function ScoringGuide({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-200">Scoring Guide</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-1.5 text-sm btn-ghost rounded-lg no-print"
            >
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg no-print">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Score Calculation Formula */}
        <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Score Calculation Formula</h3>
          <div className="space-y-2">
            {formulaSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-slate-300 w-48">{step.label}</span>
                <span className="text-slate-500">=</span>
                <span className="text-slate-400 flex-1">{step.formula}</span>
                <span className="text-xs text-slate-500 font-mono">({step.range})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Thresholds */}
        <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Rating Thresholds</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-1 px-2">Measure</th>
                <th className="text-center py-1 px-2"><span className="text-emerald-400">Low</span></th>
                <th className="text-center py-1 px-2"><span className="text-yellow-400">Medium</span></th>
                <th className="text-center py-1 px-2"><span className="text-red-400">High</span></th>
              </tr>
            </thead>
            <tbody>
              {ratingThresholds.map((row, i) => (
                <tr key={i} className="text-slate-300">
                  <td className="py-1 px-2 font-medium">{row.measure}</td>
                  <td className="py-1 px-2 text-center font-mono text-xs">{row.low}</td>
                  <td className="py-1 px-2 text-center font-mono text-xs">{row.medium}</td>
                  <td className="py-1 px-2 text-center font-mono text-xs">{row.high}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed Scoring by Section */}
        <div className="space-y-6">
          {sections.map((section, si) => (
            <div key={si}>
              <h3 className="text-sm font-semibold text-slate-200 mb-1">{section.title}</h3>
              <p className="text-xs text-slate-500 mb-3">{section.description}</p>
              <div className="space-y-3">
                {section.categories.map((cat, ci) => (
                  <div key={ci} className="p-3 rounded-lg border border-white/5 bg-white/3">
                    <div className="text-xs font-medium text-slate-300 mb-2">{cat.name}</div>
                    <div className="space-y-1">
                      {cat.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{opt.label}</span>
                          <span className={`font-mono px-2 py-0.5 rounded ${
                            opt.score > 0 ? 'bg-orange-500/15 text-orange-400'
                            : opt.score < 0 ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-slate-500/15 text-slate-500'
                          }`}>
                            {opt.score > 0 ? '+' : ''}{opt.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {section.thresholds && (
                <div className="mt-3 p-3 rounded-lg border border-white/5 bg-white/3">
                  <div className="text-xs font-medium text-slate-300 mb-2">Rating Thresholds</div>
                  {section.thresholds.map((t, ti) => (
                    <div key={ti} className="text-xs text-slate-400">
                      <span className="font-medium">{t.rating}</span> ({t.range}): {t.meaning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Property Type Recommendations */}
        <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Property Type Recommendation</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-1 px-2">Residual Rating</th>
                <th className="text-left py-1 px-2">Recommended Housing</th>
              </tr>
            </thead>
            <tbody>
              {propertyRecommendations.map((row, i) => (
                <tr key={i} className="text-slate-300">
                  <td className="py-1 px-2 font-medium text-xs">{row.rating}</td>
                  <td className="py-1 px-2 text-xs">{row.types}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Approval Pathways */}
        <div className="mt-6 p-4 rounded-lg border border-white/10 bg-white/5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Approval Pathways</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-1 px-2">Final Rating</th>
                <th className="text-left py-1 px-2">Approval Required</th>
              </tr>
            </thead>
            <tbody>
              {approvalPathways.map((row, i) => (
                <tr key={i} className="text-slate-300">
                  <td className="py-1 px-2 font-medium text-xs">{row.rating}</td>
                  <td className="py-1 px-2 text-xs">{row.approval}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end no-print">
          <button onClick={onClose} className="px-4 py-2 btn-ghost rounded-lg text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
