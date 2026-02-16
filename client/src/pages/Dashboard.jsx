import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import {
  getAssessments, searchAssessments, createAssessment,
  approveAssessment, rejectAssessment, deferAssessment,
  completeDeferral, deleteAssessment,
} from '../api/client';
import {
  Plus, Eye, ArrowRight, Trash2, CheckCircle, XCircle, Pause,
  Clock, FileText, AlertTriangle, BarChart3,
} from 'lucide-react';

const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_manager: 'Pending Manager',
  pending_senior: 'Pending Senior',
  approved: 'Approved',
  rejected: 'Rejected',
  deferred: 'Deferred',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  pending_manager: 'bg-yellow-100 text-yellow-700',
  pending_senior: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  deferred: 'bg-purple-100 text-purple-700',
};

const riskColors = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-green-100 text-green-700',
};

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newApplicant, setNewApplicant] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [deferData, setDeferData] = useState({ reason: '', timeframe: '', actions: '', followUpDate: '' });

  useEffect(() => { loadAssessments(); }, []);

  async function loadAssessments() {
    setLoading(true);
    try {
      const res = await getAssessments();
      setAssessments(res.data);
    } catch (err) {
      console.error('Failed to load assessments:', err);
    }
    setLoading(false);
  }

  async function handleSearch(params) {
    setLoading(true);
    try {
      const hasParams = Object.values(params).some(Boolean);
      const res = hasParams ? await searchAssessments(params) : await getAssessments();
      setAssessments(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newApplicant.trim()) return;
    setCreating(true);
    try {
      const res = await createAssessment(newApplicant.trim());
      navigate(`/assessment/${res.data.id}/1`);
    } catch (err) {
      console.error('Create failed:', err);
    }
    setCreating(false);
  }

  async function handleApprove(id) {
    try {
      await approveAssessment(id, actionNotes);
      setActionModal(null);
      setActionNotes('');
      loadAssessments();
    } catch (err) {
      console.error('Approve failed:', err);
    }
  }

  async function handleReject(id) {
    try {
      await rejectAssessment(id, actionNotes);
      setActionModal(null);
      setActionNotes('');
      loadAssessments();
    } catch (err) {
      console.error('Reject failed:', err);
    }
  }

  async function handleDefer(id) {
    try {
      await deferAssessment(id, { ...deferData, notes: actionNotes });
      setActionModal(null);
      setActionNotes('');
      setDeferData({ reason: '', timeframe: '', actions: '', followUpDate: '' });
      loadAssessments();
    } catch (err) {
      console.error('Defer failed:', err);
    }
  }

  async function handleCompleteDeferral(id) {
    try {
      await completeDeferral(id);
      loadAssessments();
    } catch (err) {
      console.error('Complete deferral failed:', err);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this draft assessment?')) return;
    try {
      await deleteAssessment(id);
      loadAssessments();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  // Stats
  const myDrafts = assessments.filter(a => a.status === 'draft' && a.assessorId === user.id).length;
  const myPending = assessments.filter(a => ['pending_manager', 'pending_senior', 'submitted'].includes(a.status) && a.assessorId === user.id).length;
  const myApproved = assessments.filter(a => a.status === 'approved' && a.assessorId === user.id).length;
  const pendingMyApproval = assessments.filter(a =>
    (a.status === 'pending_manager' && hasRole('manager')) ||
    (a.status === 'pending_senior' && hasRole('senior_manager'))
  ).length;
  const deferredCount = assessments.filter(a => a.status === 'deferred').length;
  const overrideCount = assessments.filter(a => a.professionalJudgementOverride).length;

  const pendingApprovalList = assessments.filter(a =>
    (a.status === 'pending_manager' && hasRole('manager', 'senior_manager')) ||
    (a.status === 'pending_senior' && hasRole('senior_manager'))
  );

  const deferredList = assessments.filter(a => a.status === 'deferred');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hasRole('assessor') && (
          <>
            <StatCard title="My Drafts" value={myDrafts} icon={FileText} color="text-gray-600" />
            <StatCard title="Pending Approval" value={myPending} icon={Clock} color="text-yellow-600" />
            <StatCard title="Approved" value={myApproved} icon={CheckCircle} color="text-green-600" />
            <StatCard title="Total" value={assessments.length} icon={BarChart3} color="text-blue-600" />
          </>
        )}
        {hasRole('manager', 'senior_manager') && (
          <>
            <StatCard title="Pending My Approval" value={pendingMyApproval} icon={Clock} color="text-yellow-600" />
            <StatCard title="Total Assessments" value={assessments.length} icon={BarChart3} color="text-blue-600" />
            <StatCard title="Deferred" value={deferredCount} icon={Pause} color="text-purple-600" />
            <StatCard title="Overrides" value={overrideCount} icon={AlertTriangle} color="text-orange-600" />
          </>
        )}
      </div>

      {/* Actions & Search */}
      <div className="flex items-center gap-3">
        {hasRole('assessor') && (
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            New Assessment
          </button>
        )}
      </div>

      <SearchBar onSearch={handleSearch} showAssessorFilter={hasRole('manager', 'senior_manager')} />

      {/* Pending Approval Queue (Managers) */}
      {hasRole('manager', 'senior_manager') && pendingApprovalList.length > 0 && (
        <div className="bg-white rounded-lg border border-yellow-200 shadow-sm">
          <div className="px-4 py-3 border-b border-yellow-200 bg-yellow-50 rounded-t-lg">
            <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
              <Clock size={18} />
              Pending My Approval ({pendingApprovalList.length})
            </h3>
          </div>
          <div className="divide-y">
            {pendingApprovalList.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{a.applicantName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>
                      {statusLabels[a.status]}
                    </span>
                    {a.overallMatchChallenge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${riskColors[a.overallMatchChallenge]}`}>
                        {a.overallMatchChallenge} Risk
                      </span>
                    )}
                    {a.professionalJudgementOverride && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        Override Applied
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    by {a.assessor?.fullName} - {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/assessment/${a.id}/5`)} className="text-sm px-3 py-1.5 text-blue-600 border border-blue-200 rounded hover:bg-blue-50">
                    <Eye size={14} className="inline mr-1" />View
                  </button>
                  <button onClick={() => setActionModal({ type: 'approve', id: a.id, name: a.applicantName })} className="text-sm px-3 py-1.5 text-green-600 border border-green-200 rounded hover:bg-green-50">
                    <CheckCircle size={14} className="inline mr-1" />Approve
                  </button>
                  <button onClick={() => setActionModal({ type: 'reject', id: a.id, name: a.applicantName })} className="text-sm px-3 py-1.5 text-red-600 border border-red-200 rounded hover:bg-red-50">
                    <XCircle size={14} className="inline mr-1" />Reject
                  </button>
                  <button onClick={() => setActionModal({ type: 'defer', id: a.id, name: a.applicantName })} className="text-sm px-3 py-1.5 text-orange-600 border border-orange-200 rounded hover:bg-orange-50">
                    <Pause size={14} className="inline mr-1" />Defer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deferred Queue */}
      {hasRole('manager', 'senior_manager') && deferredList.length > 0 && (
        <div className="bg-white rounded-lg border border-purple-200 shadow-sm">
          <div className="px-4 py-3 border-b border-purple-200 bg-purple-50 rounded-t-lg">
            <h3 className="font-semibold text-purple-800 flex items-center gap-2">
              <Pause size={18} />
              Deferred Assessments ({deferredList.length})
            </h3>
          </div>
          <div className="divide-y">
            {deferredList.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <span className="font-medium text-gray-900">{a.applicantName}</span>
                  <p className="text-sm text-gray-500">Reason: {a.deferralReason || 'Not specified'}</p>
                  {a.deferralFollowUpDate && (
                    <p className="text-sm text-gray-500">Follow-up: {a.deferralFollowUpDate}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/assessment/${a.id}/5`)} className="text-sm px-3 py-1.5 text-blue-600 border border-blue-200 rounded hover:bg-blue-50">View</button>
                  <button onClick={() => handleCompleteDeferral(a.id)} className="text-sm px-3 py-1.5 text-green-600 border border-green-200 rounded hover:bg-green-50">Complete Follow-up</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Assessments Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">
            {hasRole('assessor') ? 'My Assessments' : 'All Assessments'}
          </h3>
        </div>
        {loading ? (
          <p className="p-4 text-gray-500">Loading...</p>
        ) : assessments.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No assessments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Applicant</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Assessor</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Risk</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Last Saved</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assessments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[a.status]}`}>
                        {statusLabels[a.status]}
                        {a.status === 'draft' && a.lastSavedPart ? ` (Part ${a.lastSavedPart})` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{a.applicantName}</td>
                    <td className="px-4 py-3 text-gray-600">{a.assessor?.fullName}</td>
                    <td className="px-4 py-3">
                      {a.overallMatchChallenge && (
                        <span className={`text-xs px-2 py-1 rounded-full ${riskColors[a.overallMatchChallenge]}`}>
                          {a.overallMatchChallenge}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {a.lastSavedAt ? new Date(a.lastSavedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {a.status === 'draft' && a.assessorId === user.id ? (
                          <>
                            <button onClick={() => navigate(`/assessment/${a.id}/${a.lastSavedPart || 1}`)} className="text-blue-600 hover:text-blue-800 p-1" title="Continue">
                              <ArrowRight size={16} />
                            </button>
                            <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => navigate(`/assessment/${a.id}/5`)} className="text-blue-600 hover:text-blue-800 p-1" title="View">
                            <Eye size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Assessment Modal */}
      {showNewModal && (
        <Modal onClose={() => setShowNewModal(false)}>
          <h3 className="text-lg font-semibold mb-4">New Assessment</h3>
          <form onSubmit={handleCreate}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name</label>
            <input
              type="text"
              value={newApplicant}
              onChange={(e) => setNewApplicant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter applicant's full name"
              required
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Creating...' : 'Start Assessment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Action Modal (Approve/Reject/Defer) */}
      {actionModal && (
        <Modal onClose={() => { setActionModal(null); setActionNotes(''); setDeferData({ reason: '', timeframe: '', actions: '', followUpDate: '' }); }}>
          <h3 className="text-lg font-semibold mb-2 capitalize">{actionModal.type} Assessment</h3>
          <p className="text-sm text-gray-600 mb-4">Applicant: {actionModal.name}</p>

          {actionModal.type === 'defer' && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select
                  value={deferData.reason}
                  onChange={(e) => setDeferData({ ...deferData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="Insufficient information">Insufficient information</option>
                  <option value="Awaiting external report">Awaiting external report</option>
                  <option value="Support services not in place">Support services not in place</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Timeframe</label>
                <input type="text" value={deferData.timeframe} onChange={(e) => setDeferData({ ...deferData, timeframe: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., 2 weeks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Actions</label>
                <textarea value={deferData.actions} onChange={(e) => setDeferData({ ...deferData, actions: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input type="date" value={deferData.followUpDate} onChange={(e) => setDeferData({ ...deferData, followUpDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes {actionModal.type === 'reject' ? '*' : '(optional)'}
            </label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="3"
              required={actionModal.type === 'reject'}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setActionModal(null); setActionNotes(''); }} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => {
                if (actionModal.type === 'approve') handleApprove(actionModal.id);
                else if (actionModal.type === 'reject') handleReject(actionModal.id);
                else if (actionModal.type === 'defer') handleDefer(actionModal.id);
              }}
              className={`px-4 py-2 text-white rounded-lg ${
                actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                actionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              Confirm {actionModal.type}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon size={24} className={color} />
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
