import { useState, useEffect } from 'react';
import { getReportSummary, getReportTrends, getReportAssessors, getReportOverrides } from '../api/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import { Download, BarChart3, TrendingUp, Users, AlertTriangle } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [assessors, setAssessors] = useState([]);
  const [overrides, setOverrides] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, t, a, o] = await Promise.all([
        getReportSummary(),
        getReportTrends(),
        getReportAssessors(),
        getReportOverrides(),
      ]);
      setSummary(s.data);
      setTrends(t.data.map((d) => ({ ...d, month: new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) })));
      setAssessors(a.data);
      setOverrides(o.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
    setLoading(false);
  }

  function exportCSV() {
    window.open('/api/reports/export', '_blank');
  }

  if (loading) return <div className="text-center py-8 text-slate-500">Loading reports...</div>;

  const statusData = (summary?.byStatus || []).map((s) => ({
    name: s.status,
    value: parseInt(s.count),
  }));

  const riskData = (summary?.byRisk || []).map((r) => ({
    name: r.overallMatchChallenge,
    value: parseInt(r.count),
  }));

  const riskColors = { High: '#EF4444', Medium: '#F59E0B', Low: '#10B981' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          <BarChart3 size={24} />
          Reports & Analytics
        </h2>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 btn-ghost rounded-lg"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-slate-500">Total Assessments</p>
          <p className="text-3xl font-bold text-slate-200">{summary?.total || 0}</p>
        </div>
        {['High', 'Medium', 'Low'].map((level) => {
          const count = riskData.find((r) => r.name === level)?.value || 0;
          return (
            <div key={level} className="glass rounded-xl p-4">
              <p className="text-sm text-slate-500">{level} Risk</p>
              <p className="text-3xl font-bold" style={{ color: riskColors[level] }}>{count}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assessment Trends */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Assessment Trends
          </h3>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={12} tick={{ fill: '#94a3b8' }} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Assessments" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-8">No trend data yet</p>
          )}
        </div>

        {/* Risk Distribution */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Risk Level Distribution</h3>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" fontSize={12} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={12} tick={{ fill: '#94a3b8' }} />
                <RechartsTooltip />
                <Bar dataKey="value" name="Count">
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={riskColors[entry.name] || '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-8">No risk data yet</p>
          )}
        </div>

        {/* Status Distribution */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4">Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-8">No status data yet</p>
          )}
        </div>

        {/* Override Stats */}
        <div className="glass rounded-xl p-6">
          <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} /> Professional Judgment Overrides
          </h3>
          {overrides && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-200">{overrides.total}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{overrides.withOverride}</p>
                  <p className="text-xs text-slate-500">With Override</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{overrides.overrideRate}%</p>
                  <p className="text-xs text-slate-500">Override Rate</p>
                </div>
              </div>
              {overrides.overrides?.length > 0 && (
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <p className="text-sm font-medium text-slate-300">Recent Overrides:</p>
                  {overrides.overrides.slice(0, 5).map((o) => (
                    <div key={o.id} className="text-sm text-slate-400">
                      <span className="font-medium text-slate-300">{o.applicantName}</span> - {o.assessor?.fullName}
                      <p className="text-xs text-slate-500">
                        {o.professionalJudgementOverride?.originalScore} → {o.professionalJudgementOverride?.adjustedScore}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assessor Stats */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Users size={18} /> Assessor Statistics
        </h3>
        {assessors.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className="px-4 py-2 text-left text-slate-400">Assessor</th>
                <th className="px-4 py-2 text-left text-slate-400">Total</th>
                <th className="px-4 py-2 text-left text-slate-400">Approved</th>
                <th className="px-4 py-2 text-left text-slate-400">Drafts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {assessors.map((a, i) => (
                <tr key={i} className="hover:bg-white/5">
                  <td className="px-4 py-2 font-medium text-slate-300">{a.assessor?.fullName || 'Unknown'}</td>
                  <td className="px-4 py-2 text-slate-300">{a.totalAssessments}</td>
                  <td className="px-4 py-2 text-emerald-400">{a.approved}</td>
                  <td className="px-4 py-2 text-slate-500">{a.drafts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-center py-4">No assessor data yet</p>
        )}
      </div>
    </div>
  );
}
