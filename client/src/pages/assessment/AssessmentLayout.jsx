import { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { getAssessment } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Check, Circle, AlertCircle, Lock, Printer, History } from 'lucide-react';
import PrintView from '../../components/PrintView';
import AuditTimeline from '../../components/AuditTimeline';

const partNames = {
  1: 'Client Details',
  2: 'Housing Need',
  3: 'Tenancy Suitability',
  4: 'Challenge Mitigation',
  5: 'Summary & Recommendations',
  6: 'Approval',
};

function getPartCompletion(formData, partNum) {
  const part = formData?.[`part${partNum}`];
  if (!part || Object.keys(part).length === 0) return 'empty';

  const checks = {
    1: () => part.applicantName && part.assessorName,
    2: () => part.roughSleepingDuration && part.currentHousingStatus && part.housingNeedRating,
    3: () => part.antiSocialBehaviour && part.criminalHistory && part.grossChallengeRating,
    4: () => part.supportNetwork && part.residualChallengeRating,
    5: () => part.overallMatchChallenge && part.finalRecommendation,
    6: () => part.housingNeed && part.tenancyRisk && part.approvalPathway,
  };

  return checks[partNum]?.() ? 'complete' : 'partial';
}

export default function AssessmentLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const currentPart = parseInt(useParams().part || '1');

  useEffect(() => { loadAssessment(); }, [id]);

  async function loadAssessment() {
    setLoading(true);
    try {
      const res = await getAssessment(id);
      setAssessment(res.data);
    } catch (err) {
      console.error('Failed to load assessment:', err);
      navigate('/');
    }
    setLoading(false);
  }

  if (loading) return <div className="text-center py-8 text-slate-500">Loading assessment...</div>;
  if (!assessment) return <div className="text-center py-8 text-red-400">Assessment not found</div>;

  const isLocked = !!assessment.lockedAt;
  const isOwner = assessment.assessorId === user.id;

  if (showPrint) {
    return (
      <div>
        <button onClick={() => setShowPrint(false)} className="mb-4 text-sm text-cyan-400 hover:underline no-print">&larr; Back to Assessment</button>
        <PrintView assessment={assessment} />
      </div>
    );
  }

  if (showAudit) {
    return (
      <div>
        <button onClick={() => setShowAudit(false)} className="mb-4 text-sm text-cyan-400 hover:underline">&larr; Back to Assessment</button>
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Audit Trail - {assessment.applicantName}</h2>
          <AuditTimeline assessmentId={assessment.id} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-200">
            {assessment.applicantName}
            {isLocked && (
              <span className="ml-3 inline-flex items-center gap-1 text-sm font-normal text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                <Lock size={14} /> Approved - Read Only
              </span>
            )}
          </h2>
          {assessment.lastSavedAt && (
            <p className="text-sm text-slate-500">
              Last saved: {new Date(assessment.lastSavedAt).toLocaleString()}
              {assessment.lastSavedPart && ` (Part ${assessment.lastSavedPart})`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAudit(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 border border-white/15 rounded hover:bg-white/5">
            <History size={14} /> History
          </button>
          <button onClick={() => setShowPrint(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 border border-white/15 rounded hover:bg-white/5">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6].map((part) => {
          const completion = getPartCompletion(assessment.formData, part);
          const isActive = currentPart === part;

          return (
            <button
              key={part}
              onClick={() => navigate(`/assessment/${id}/${part}`)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'
              }`}
            >
              {completion === 'complete' ? (
                <Check size={16} className="text-emerald-400" />
              ) : completion === 'partial' ? (
                <AlertCircle size={16} className="text-yellow-400" />
              ) : (
                <Circle size={16} className="text-slate-500" />
              )}
              Part {part}
              <span className="hidden md:inline text-xs">- {partNames[part]}</span>
            </button>
          );
        })}
      </div>

      {/* Part Content */}
      <Outlet context={{ assessment, setAssessment, loadAssessment, isLocked, isOwner }} />
    </div>
  );
}
