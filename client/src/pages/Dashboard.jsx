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
  Clock, FileText, AlertTriangle, BarChart3, BookOpen,
} from 'lucide-react';
import ScoringGuide from '../components/ScoringGuide';

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
  draft: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  submitted: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  pending_manager: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  pending_senior: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
  deferred: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const riskColors = {
  High: 'bg-red-500/20 text-red-400 border border-red-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
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
  const [showScoringGuide, setShowScoringGuide] = useState(false);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hasRole('assessor') && (
          <>
            <StatCard title="My Drafts" value={myDrafts} icon={FileText} glowClass="glow-blue" iconColor="text-cyan-400" />
            <StatCard title="Pending Approval" value={myPending} icon={Clock} glowClass="glow-orange" iconColor="text-yellow-400" />
            <StatCard title="Approved" value={myApproved} icon={CheckCircle} glowClass="glow-green" iconColor="text-emerald-400" />
            <StatCard title="Total" value={assessments.length} icon={BarChart3} glowClass="glow-purple" iconColor="text-purple-400" />
          </>
        )}
        {hasRole('manager', 'senior_manager') && (
          <>
            <StatCard title="Pending My Approval" value={pendingMyApproval} icon={Clock} glowClass="glow-orange" iconColor="text-yellow-400" />
            <StatCard title="Total Assessments" value={assessments.length} icon={BarChart3} glowClass="glow-blue" iconColor="text-cyan-400" />
            <StatCard title="Deferred" value={deferredCount} icon={Pause} glowClass="glow-purple" iconColor="text-purple-400" />
            <StatCard title="Overrides" value={overrideCount} icon={AlertTriangle} glowClass="glow-orange" iconColor="text-orange-400" />
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {hasRole('assessor') && (
          <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-5 py-2.5 btn-neon rounded-lg font-medium">
            <Plus size={18} /> New Assessment
          </button>
        )}
        <button onClick={() => setShowScoringGuide(true)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg font-medium">
          <BookOpen size={18} /> Scoring Guide
        </button>
      </div>

      <SearchBar onSearch={handleSearch} showAssessorFilter={hasRole('manager', 'senior_manager')} />

      {hasRole('manager', 'senior_manager') && pendingApprovalList.length > 0 && (
        <div className="glass rounded-xl overflow-hidden glow-orange">
          <div className="px-5 py-3 border-b border-yellow-500/20 bg-yellow-500/5">
            <h3 className="font-semibold text-yellow-400 flex items-center gap-2">
              <Clock size={18} /> Pending My Approval ({pendingApprovalList.length})
            </h3>
          </div>
          <div className="divide-y divide-white/5">
            {pendingApprovalList.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/3 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-200">{a.applicantName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>{statusLabels[a.status]}</span>
                    {a.overallMatchChallenge && <span className={`text-xs px-2 py-0.5 rounded-full ${riskColors[a.overallMatchChallenge]}`}>{a.overallMatchChallenge} Risk</span>}
                    {a.professionalJudgementOverride && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Override</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">by {a.assessor?.fullName} - {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/assessment/${a.id}/5`)} className="text-sm px-3 py-1.5 btn-ghost rounded-lg"><Eye size={14} className="inline mr-1" />View</button>
                  <button onClick={() => setActionModal({ type: 'approve', id: a.id, name: a.applicantName })} className="text-sm px-3 py-1.5 btn-neon-green rounded-lg"><CheckCircle size={14} className="inline mr-1" />Approve</button>
                  <button onClick={() => setActionModal({ type: 'reject', id: a.id, name: a.applicantName })} className="text-sm px-3 py-1.5 btn-neon-red rounded-lg"><XCircle size={14} className="inline mr-1" />Reject</button>
                  <button onClick={() => setActionModal({ type: 'defer', id: a.id, name: a.applicantName })} className="text-sm px-3 py-1.5 btn-neon-orange rounded-lg"><Pause size={14} className="inline mr-1" />Defer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasRole('manager', 'senior_manager') && deferredList.length > 0 && (
        <div className="glass rounded-xl overflow-hidden glow-purple">
          <div className="px-5 py-3 border-b border-purple-500/20 bg-purple-500/5">
            <h3 className="font-semibold text-purple-400 flex items-center gap-2"><Pause size={18} /> Deferred ({deferredList.length})</h3>
          </div>
          <div className="divide-y divide-white/5">
            {deferredList.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/3 transition-colors">
                <div>
                  <span className="font-medium text-slate-200">{a.applicantName}</span>
                  <p className="text-sm text-slate-500">Reason: {a.deferralReason || 'Not specified'}</p>
                  {a.deferralFollowUpDate && <p className="text-sm text-slate-500">Follow-up: {a.deferralFollowUpDate}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/assessment/${a.id}/5`)} className="text-sm px-3 py-1.5 btn-ghost rounded-lg">View</button>
                  <button onClick={() => handleCompleteDeferral(a.id)} className="text-sm px-3 py-1.5 btn-neon-green rounded-lg">Complete Follow-up</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h3 className="font-semibold text-slate-200">{hasRole('assessor') ? 'My Assessments' : 'All Assessments'}</h3>
        </div>
        {loading ? (
          <p className="p-4 text-slate-500">Loading...</p>
        ) : assessments.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No assessments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm glass-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Applicant</th>
                  <th className="px-4 py-3 text-left">Assessor</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Last Saved</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[a.status]}`}>{statusLabels[a.status]}{a.status === 'draft' && a.lastSavedPart ? ` (Part ${a.lastSavedPart})` : ''}</span></td>
                    <td className="px-4 py-3 font-medium text-slate-200">{a.applicantName}</td>
                    <td className="px-4 py-3 text-slate-400">{a.assessor?.fullName}</td>
                    <td className="px-4 py-3">{a.overallMatchChallenge && <span className={`text-xs px-2 py-1 rounded-full ${riskColors[a.overallMatchChallenge]}`}>{a.overallMatchChallenge}</span>}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{a.lastSavedAt ? new Date(a.lastSavedAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {a.status === 'draft' && a.assessorId === user.id ? (
                          <>
                            <button onClick={() => navigate(`/assessment/${a.id}/${a.lastSavedPart || 1}`)} className="text-cyan-400 hover:text-cyan-300 p-1" title="Continue"><ArrowRight size={16} /></button>
                            <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 p-1" title="Delete"><Trash2 size={16} /></button>
                          </>
                        ) : (
                          <button onClick={() => navigate(`/assessment/${a.id}/5`)} className="text-cyan-400 hover:text-cyan-300 p-1" title="View"><Eye size={16} /></button>
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

      {showNewModal && (
        <Modal onClose={() => setShowNewModal(false)}>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">New Assessment</h3>
          <form onSubmit={handleCreate}>
            <label className="block text-sm font-medium text-slate-400 mb-1">Applicant Name</label>
            <input type="text" value={newApplicant} onChange={(e) => setNewApplicant(e.target.value)} className="w-full px-3 py-2 rounded-lg input-glass" placeholder="Enter applicant's full name" required autoFocus />
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowNewModal(false)} className="px-4 py-2 btn-ghost rounded-lg">Cancel</button>
              <button type="submit" disabled={creating} className="px-4 py-2 btn-neon rounded-lg disabled:opacity-50">{creating ? 'Creating...' : 'Start Assessment'}</button>
            </div>
          </form>
        </Modal>
      )}

      {actionModal && (
        <Modal onClose={() => { setActionModal(null); setActionNotes(''); setDeferData({ reason: '', timeframe: '', actions: '', followUpDate: '' }); }}>
          <h3 className="text-lg font-semibold text-slate-200 mb-2 capitalize">{actionModal.type} Assessment</h3>
          <p className="text-sm text-slate-400 mb-4">Applicant: {actionModal.name}</p>
          {actionModal.type === 'defer' && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Reason *</label>
                <select value={deferData.reason} onChange={(e) => setDeferData({ ...deferData, reason: e.target.value })} className="w-full px-3 py-2 rounded-lg input-glass" required>
                  <option value="">Select reason...</option>
                  <option value="Insufficient information">Insufficient information</option>
                  <option value="Awaiting external report">Awaiting external report</option>
                  <option value="Support services not in place">Support services not in place</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Estimated Timeframe</label>
                <input type="text" value={deferData.timeframe} onChange={(e) => setDeferData({ ...deferData, timeframe: e.target.value })} className="w-full px-3 py-2 rounded-lg input-glass" placeholder="e.g., 2 weeks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Required Actions</label>
                <textarea value={deferData.actions} onChange={(e) => setDeferData({ ...deferData, actions: e.target.value })} className="w-full px-3 py-2 rounded-lg input-glass" rows="2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Follow-up Date</label>
                <input type="date" value={deferData.followUpDate} onChange={(e) => setDeferData({ ...deferData, followUpDate: e.target.value })} className="w-full px-3 py-2 rounded-lg input-glass" />
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-1">Notes {actionModal.type === 'reject' ? '*' : '(optional)'}</label>
            <textarea value={actionNotes} onChange={(e) => setActionNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg input-glass" rows="3" required={actionModal.type === 'reject'} />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setActionModal(null); setActionNotes(''); }} className="px-4 py-2 btn-ghost rounded-lg">Cancel</button>
            <button
              onClick={() => { if (actionModal.type === 'approve') handleApprove(actionModal.id); else if (actionModal.type === 'reject') handleReject(actionModal.id); else if (actionModal.type === 'defer') handleDefer(actionModal.id); }}
              className={`px-4 py-2 rounded-lg ${actionModal.type === 'approve' ? 'btn-neon-green' : actionModal.type === 'reject' ? 'btn-neon-red' : 'btn-neon-orange'}`}
            >Confirm {actionModal.type}</button>
          </div>
        </Modal>
      )}

      {showScoringGuide && <ScoringGuide onClose={() => setShowScoringGuide(false)} />}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, glowClass, iconColor }) {
  return (
    <div className={`glass rounded-xl p-4 ${glowClass} transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
        <Icon size={24} className={iconColor} />
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
