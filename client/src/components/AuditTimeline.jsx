import { useState, useEffect } from 'react';
import { getAuditTrail } from '../api/client';
import { Clock, Save, Send, CheckCircle, XCircle, Pause, AlertTriangle, Plus, FileText } from 'lucide-react';

const actionConfig = {
  create: { color: 'bg-blue-500', icon: Plus, label: 'Created' },
  save: { color: 'bg-gray-400', icon: Save, label: 'Saved' },
  submit: { color: 'bg-blue-600', icon: Send, label: 'Submitted' },
  approve: { color: 'bg-green-500', icon: CheckCircle, label: 'Approved' },
  reject: { color: 'bg-red-500', icon: XCircle, label: 'Rejected' },
  defer: { color: 'bg-orange-500', icon: Pause, label: 'Deferred' },
  defer_complete: { color: 'bg-orange-300', icon: CheckCircle, label: 'Deferral Completed' },
  override: { color: 'bg-purple-500', icon: AlertTriangle, label: 'Professional Override' },
  amend: { color: 'bg-indigo-500', icon: FileText, label: 'Amended' },
  delete: { color: 'bg-red-400', icon: XCircle, label: 'Deleted' },
};

export default function AuditTimeline({ assessmentId }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assessmentId) loadLogs();
  }, [assessmentId, filter]);

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await getAuditTrail(assessmentId, filter || undefined);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    }
    setLoading(false);
  }

  function exportCSV() {
    const csv = [
      'Timestamp,User,Action,Details',
      ...logs.map((log) =>
        `"${new Date(log.createdAt).toISOString()}","${log.user?.fullName || ''}","${log.action}","${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${assessmentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="text-gray-500">Loading audit trail...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Actions</option>
            {Object.entries(actionConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={exportCSV}
          className="text-sm text-blue-600 hover:underline"
        >
          Export CSV
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">No audit entries found.</p>
      ) : (
        <div className="space-y-0">
          {logs.map((log, i) => {
            const config = actionConfig[log.action] || { color: 'bg-gray-400', icon: Clock, label: log.action };
            const Icon = config.icon;
            return (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  {i < logs.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-800">{config.label}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    by {log.user?.fullName || 'System'}
                    {log.details?.partNumber && ` - Part ${log.details.partNumber}`}
                  </p>
                  {log.details?.notes && (
                    <p className="text-sm text-gray-500 mt-1 italic">"{log.details.notes}"</p>
                  )}
                  {log.details?.justification && (
                    <p className="text-sm text-gray-500 mt-1">
                      Override: {log.details.originalScore} → {log.details.adjustedScore}
                      <br />
                      <span className="italic">"{log.details.justification}"</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
