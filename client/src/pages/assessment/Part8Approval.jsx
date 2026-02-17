import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart, submitAssessment, overrideAssessment, getUsers } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AuditTimeline from '../../components/AuditTimeline';
import Tooltip from '../../components/Tooltip';
import { Save, Send, ArrowLeft, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const recommendationOptions = [
  { value: 'proceed_without_conditions', label: 'Proceed with housing allocation without conditions', when: 'Recommended for Low Residual Challenge' },
  { value: 'proceed_with_conditions', label: 'Proceed with housing allocation with conditions', when: 'Recommended for Medium/High Residual Challenge where support plan can mitigate risk' },
  { value: 'defer', label: 'Defer allocation pending further supports or approvals', when: 'Recommended for High Residual Challenge with very low mitigation' },
  { value: 'decline', label: 'Decline allocation', when: 'Reserved for extreme, unmitigated High Risk (e.g. active violence + gang + no support)' },
];

function formatDateDDMMYYYY(date) {
  const d = date || new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function Part8Approval() {
  const { assessment, loadAssessment, isLocked, isOwner } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const part = assessment.formData?.part8 || {};
  const p7 = assessment.formData?.part7 || {};

  // Auto-populated from Part 7
  const housingNeedRating = p7.housingNeedRating || '';
  const residualRating = p7.residualChallengeRating || '';

  // Users for pre-populating approval fields
  const [managers, setManagers] = useState([]);
  const [seniorManagers, setSeniorManagers] = useState([]);

  useEffect(() => {
    getUsers('manager').then(res => setManagers(res.data)).catch(() => {});
    getUsers('senior_manager').then(res => setSeniorManagers(res.data)).catch(() => {});
  }, []);

  const [data, setData] = useState({
    finalRecommendation: part.finalRecommendation || '',
    conditions: part.conditions || '',
  });

  const [showOverride, setShowOverride] = useState(!!assessment.professionalJudgementOverride);
  const [override, setOverride] = useState({
    originalScore: assessment.professionalJudgementOverride?.originalScore || '',
    adjustedScore: assessment.professionalJudgementOverride?.adjustedScore || '',
    justification: assessment.professionalJudgementOverride?.justification || '',
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  // The original automatic score is the residual rating from Part 7
  const originalScore = residualRating;

  // The effective final rating: if override is active and has an adjusted score, use that; otherwise use original
  const finalRating = useMemo(() => {
    if (showOverride && override.adjustedScore) {
      return override.adjustedScore;
    }
    return originalScore;
  }, [showOverride, override.adjustedScore, originalScore]);

  // The original rating for determining approval pathway when override is used
  // Rule 5: "If override changes High → Low: Approval = Senior Manager (because original was High)"
  const approvalDeterminingRating = useMemo(() => {
    if (showOverride && override.adjustedScore) {
      // Use whichever is higher: original or adjusted
      const levels = { High: 3, Medium: 2, Low: 1 };
      return (levels[originalScore] || 0) >= (levels[override.adjustedScore] || 0)
        ? originalScore
        : override.adjustedScore;
    }
    return originalScore;
  }, [showOverride, override.adjustedScore, originalScore]);

  // Auto-determined approval pathway
  const approvalPathway = useMemo(() => {
    if (approvalDeterminingRating === 'High') return 'High';
    if (approvalDeterminingRating === 'Medium') return 'Medium';
    return 'Low';
  }, [approvalDeterminingRating]);

  const approvalLabel = useMemo(() => {
    if (approvalPathway === 'High') return 'Senior Manager Approval Required';
    if (approvalPathway === 'Medium') return 'Manager Approval Required';
    return 'Frontline Self-Approval';
  }, [approvalPathway]);

  const isSelfApproval = approvalPathway === 'Low' && !showOverride;

  // Filtered dropdown options for override
  const overrideOptions = useMemo(() => {
    return ['High', 'Medium', 'Low'].filter(v => v !== originalScore);
  }, [originalScore]);

  // Determine what to show for signature/date fields
  const todayFormatted = formatDateDDMMYYYY(new Date());
  const isManager = user?.role === 'manager';
  const isSeniorManager = user?.role === 'senior_manager';
  const isAssessor = user?.role === 'assessor';

  const managerName = managers[0]?.fullName || 'Manager';
  const seniorManagerName = seniorManagers[0]?.fullName || 'Senior Manager';
  const assessorName = user?.fullName || 'Assessor';

  // Override validation
  const overrideValid = !showOverride || (override.adjustedScore && override.justification);

  const saveData = {
    ...data,
    housingNeed: housingNeedRating,
    tenancyRisk: finalRating,
    approvalPathway,
    originalResidualRating: originalScore,
    overrideApplied: showOverride && !!override.adjustedScore,
  };

  function validateForSubmission() {
    const fd = assessment.formData || {};
    const errors = [];

    if (!fd.part1?.applicantName) errors.push('Part 1: Applicant name required');
    if (!fd.part2?.roughSleepingDuration) errors.push('Part 2: Rough sleeping duration required');
    if (!fd.part3?.tenancyChallengeScore && fd.part3?.tenancyChallengeScore !== 0) errors.push('Part 3: Tenancy challenge not scored');
    if (!fd.part4?.healthWellbeingScore && fd.part4?.healthWellbeingScore !== 0) errors.push('Part 4: Health & wellbeing not scored');
    if (!fd.part5?.supportNetwork) errors.push('Part 5: Support network required');
    if (!fd.part7?.overallMatchChallenge) errors.push('Part 7: Overall match challenge required');
    if (!data.finalRecommendation) errors.push('Part 8: Final recommendation required');
    if (data.finalRecommendation === 'proceed_with_conditions' && !data.conditions) errors.push('Part 8: Conditions required when proceeding with conditions');
    if (!housingNeedRating) errors.push('Part 7: Housing need rating not calculated');
    if (!residualRating) errors.push('Part 7: Residual challenge rating not calculated');
    if (showOverride && !override.adjustedScore) errors.push('Part 8: Override adjusted score required');
    if (showOverride && !override.justification) errors.push('Part 8: Override justification required');

    return errors;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await savePart(assessment.id, 8, saveData);

      if (showOverride && override.justification && override.adjustedScore) {
        await overrideAssessment(assessment.id, {
          originalScore: originalScore,
          adjustedScore: override.adjustedScore,
          justification: override.justification,
        });
      }

      await loadAssessment();
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  async function handleSubmit() {
    const errors = validateForSubmission();
    if (errors.length > 0) {
      setSubmitError(errors.join('\n'));
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await savePart(assessment.id, 8, saveData);

      if (showOverride && override.justification && override.adjustedScore) {
        await overrideAssessment(assessment.id, {
          originalScore: originalScore,
          adjustedScore: override.adjustedScore,
          justification: override.justification,
        });
      }

      await submitAssessment(assessment.id);
      await loadAssessment();
      navigate('/');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Submission failed');
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Part 6: Next Steps for Assessor</h3>
        <p className="text-sm text-slate-400 mb-6">Overall recommendation, professional judgement, and approval pathway</p>

        <div className="space-y-6 max-w-2xl">
          {/* 1. Overall Assessment & Recommendation (moved from Part 7) */}
          <div>
            <h4 className="font-medium text-slate-200 mb-4">1. Overall Assessment & Recommendation <span className="text-red-500">*</span></h4>
            <div className="space-y-2">
              {recommendationOptions.map((opt) => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                  data.finalRecommendation === opt.value
                    ? 'border-cyan-500/40 bg-cyan-500/10'
                    : 'border-white/10 hover:bg-white/5'
                }`}>
                  <input
                    type="radio"
                    name="finalRecommendation"
                    value={opt.value}
                    checked={data.finalRecommendation === opt.value}
                    onChange={(e) => update('finalRecommendation', e.target.value)}
                    disabled={isLocked}
                    className="w-4 h-4 text-cyan-400 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-300">{opt.label}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.when}</p>
                  </div>
                </label>
              ))}
            </div>

            {data.finalRecommendation === 'proceed_with_conditions' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Conditions <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={data.conditions}
                  onChange={(e) => update('conditions', e.target.value)}
                  disabled={isLocked}
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg input-glass"
                  placeholder="Specify conditions for housing allocation..."
                />
              </div>
            )}
          </div>

          {/* 2. Confirm Assessment Ratings (Read-only) */}
          <div>
            <h4 className="font-medium text-slate-200 mb-4">2. Confirm Assessment Ratings</h4>
            <p className="text-xs text-slate-500 mb-3">These ratings are auto-populated from the Assessment Summary and cannot be edited directly.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Housing Need Rating
                  <span className="text-xs text-slate-500 ml-1">(from Summary)</span>
                </label>
                <div className={`px-4 py-2.5 rounded-lg text-sm font-medium opacity-70 cursor-not-allowed ${
                  housingNeedRating === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : housingNeedRating === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : housingNeedRating === 'Low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {housingNeedRating || 'Not yet calculated'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Residual Suitability Challenge Rating
                  <span className="text-xs text-slate-500 ml-1">(from Summary)</span>
                </label>
                <div className={`px-4 py-2.5 rounded-lg text-sm font-medium opacity-70 cursor-not-allowed ${
                  residualRating === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : residualRating === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : residualRating === 'Low' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {residualRating || 'Not yet calculated'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Professional Judgement Override (BEFORE approval pathway) */}
          <div className="border border-purple-500/30 rounded-lg p-4 bg-purple-500/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-purple-400 flex items-center gap-2">
                <AlertTriangle size={16} />
                3. Professional Judgement Override
              </h4>
              <button
                onClick={() => setShowOverride(!showOverride)}
                disabled={isLocked}
                className={`text-sm px-3 py-1 rounded-full ${
                  showOverride
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-purple-400 border border-purple-500/30'
                }`}
              >
                {showOverride ? 'Active' : 'Apply Override'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              This option applies where professional judgement indicates the automatic score does not fully reflect current risk or mitigation. Any override must be clearly justified.
            </p>

            {showOverride && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Original Automatic Score</label>
                    <input
                      type="text"
                      value={originalScore || 'Not calculated'}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg input-glass opacity-70 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Adjusted Manual Score <span className="text-red-500">*</span></label>
                    <select
                      value={override.adjustedScore}
                      onChange={(e) => setOverride({ ...override, adjustedScore: e.target.value })}
                      disabled={isLocked}
                      className="w-full px-3 py-2 rounded-lg input-glass"
                    >
                      <option value="">Select adjusted score...</option>
                      {overrideOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Justification for Override <span className="text-red-500">*</span></label>
                  <textarea
                    value={override.justification}
                    onChange={(e) => setOverride({ ...override, justification: e.target.value })}
                    disabled={isLocked}
                    rows="3"
                    className="w-full px-3 py-2 rounded-lg input-glass"
                    placeholder="Record the reason for any manual override of the automatic score..."
                    required
                  />
                </div>
                {override.adjustedScore && (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Info size={14} className="text-purple-400" />
                      <span className="text-purple-300">
                        Override: {originalScore} → {override.adjustedScore}.
                        {' '}Approval pathway determined by: <strong>{approvalDeterminingRating}</strong> ({approvalLabel})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Approval Pathway (auto-determined, read-only) */}
          <div>
            <h4 className="font-medium text-slate-200 mb-4">
              4. Approval Pathway
              <Tooltip text="The approval pathway is automatically determined based on the final rating (original or overridden). It cannot be manually changed." />
            </h4>
            <div className="space-y-3">
              {[
                { value: 'High', label: 'High Challenge — Senior Manager Approval Required' },
                { value: 'Medium', label: 'Medium Challenge — Manager Approval Required' },
                { value: 'Low', label: 'Low Challenge — Frontline Self-Approval (no submission required)' },
              ].map((pathway) => {
                const isActive = approvalPathway === pathway.value;
                return (
                  <div key={pathway.value} className={`p-3 rounded-lg border ${
                    isActive
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-white/10 opacity-40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="approvalPathway"
                        checked={isActive}
                        readOnly
                        disabled
                        className="w-4 h-4 text-cyan-400"
                      />
                      <span className="text-sm font-medium text-slate-300">{pathway.label}</span>
                      {isActive && (
                        <span className="text-xs bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded">Active</span>
                      )}
                    </div>

                    {/* Signature/Date fields for active pathway */}
                    {isActive && (
                      <div className="mt-3 ml-7">
                        {pathway.value === 'High' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Senior Manager</label>
                              <input
                                type="text"
                                value={seniorManagerName}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm rounded input-glass opacity-60 cursor-not-allowed"
                              />
                            </div>
                            {isSeniorManager ? (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Date</label>
                                <input
                                  type="text"
                                  value={todayFormatted}
                                  readOnly
                                  className="w-full px-2 py-1.5 text-sm rounded input-glass opacity-60 cursor-not-allowed"
                                />
                              </div>
                            ) : (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Date</label>
                                <input
                                  type="text"
                                  value="Pending approval"
                                  readOnly
                                  className="w-full px-2 py-1.5 text-sm rounded input-glass opacity-40 cursor-not-allowed italic"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {pathway.value === 'Medium' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Manager</label>
                              <input
                                type="text"
                                value={managerName}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm rounded input-glass opacity-60 cursor-not-allowed"
                              />
                            </div>
                            {isManager || isSeniorManager ? (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Date</label>
                                <input
                                  type="text"
                                  value={todayFormatted}
                                  readOnly
                                  className="w-full px-2 py-1.5 text-sm rounded input-glass opacity-60 cursor-not-allowed"
                                />
                              </div>
                            ) : (
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Date</label>
                                <input
                                  type="text"
                                  value="Pending approval"
                                  readOnly
                                  className="w-full px-2 py-1.5 text-sm rounded input-glass opacity-40 cursor-not-allowed italic"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {pathway.value === 'Low' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Frontline Worker</label>
                              <input
                                type="text"
                                value={assessorName}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm rounded input-glass opacity-60 cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Date</label>
                              <input
                                type="text"
                                value={todayFormatted}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm rounded input-glass opacity-60 cursor-not-allowed"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission Error */}
          {submitError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-red-400 mb-1 flex items-center gap-2">
                <AlertTriangle size={16} /> Cannot Submit
              </h4>
              <pre className="text-sm text-red-400 whitespace-pre-wrap">{submitError}</pre>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isLocked && isOwner && (
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
            <button onClick={() => navigate(`/assessment/${assessment.id}/7`)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleSubmit} disabled={submitting || !overrideValid} className="flex items-center gap-2 px-6 py-2.5 btn-neon-green rounded-lg disabled:opacity-50">
              {isSelfApproval ? (
                <><CheckCircle size={16} /> {submitting ? 'Approving...' : 'Approve & Complete'}</>
              ) : (
                <><Send size={16} /> {submitting ? 'Submitting...' : 'Submit for Approval'}</>
              )}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg disabled:opacity-50">
              <Save size={16} /> Save Draft
            </button>
          </div>
        )}

        {assessment.status === 'approved' && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-400" />
            <span className="text-emerald-400 font-medium">This assessment has been approved.</span>
          </div>
        )}
      </div>

      {/* Approval History */}
      <div className="glass rounded-xl p-6">
        <h4 className="font-medium text-slate-200 mb-4">Approval History</h4>
        <AuditTimeline assessmentId={assessment.id} />
      </div>
    </div>
  );
}
