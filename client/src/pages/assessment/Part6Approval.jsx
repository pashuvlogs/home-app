import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart, submitAssessment } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AuditTimeline from '../../components/AuditTimeline';
import Tooltip from '../../components/Tooltip';
import { Save, Send, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Part6Approval() {
  const { assessment, loadAssessment, isLocked, isOwner } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const part = assessment.formData?.part6 || {};

  const [data, setData] = useState({
    housingNeed: part.housingNeed || assessment.housingNeedRating || '',
    tenancyRisk: part.tenancyRisk || assessment.overallMatchChallenge || '',
    approvalPathway: part.approvalPathway || '',
    professionalJudgement: part.professionalJudgement || false,
    professionalJudgementText: part.professionalJudgementText || '',
    frontlineSignature: part.frontlineSignature || '',
    frontlineDate: part.frontlineDate || '',
    managerSignature: part.managerSignature || '',
    managerDate: part.managerDate || '',
    seniorManagerSignature: part.seniorManagerSignature || '',
    seniorManagerDate: part.seniorManagerDate || '',
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  // Determine required pathway based on tenancy risk
  const suggestedPathway = data.tenancyRisk === 'High' ? 'High' : data.tenancyRisk === 'Medium' ? 'Medium' : 'Low';

  // Validation: check all parts are reasonably complete
  function validateForSubmission() {
    const fd = assessment.formData || {};
    const errors = [];

    if (!fd.part1?.applicantName) errors.push('Part 1: Applicant name required');
    if (!fd.part2?.roughSleepingDuration) errors.push('Part 2: Rough sleeping duration required');
    if (!fd.part2?.housingNeedRating && !assessment.housingNeedRating) errors.push('Part 2: Housing need rating required');
    if (!fd.part3?.antiSocialBehaviour) errors.push('Part 3: Anti-social behaviour required');
    if (!fd.part3?.grossChallengeRating && !assessment.grossChallengeRating) errors.push('Part 3: Gross challenge rating required');
    if (!fd.part4?.supportNetwork) errors.push('Part 4: Support network required');
    if (!fd.part4?.residualChallengeRating && !assessment.residualChallengeRating) errors.push('Part 4: Residual challenge rating required');
    if (!assessment.overallMatchChallenge && !fd.part5?.overallMatchChallenge) errors.push('Part 5: Overall match challenge required');
    if (!assessment.finalRecommendation && !fd.part5?.finalRecommendation) errors.push('Part 5: Final recommendation required');
    if (!data.housingNeed) errors.push('Part 6: Housing need confirmation required');
    if (!data.tenancyRisk) errors.push('Part 6: Tenancy risk confirmation required');
    if (!data.approvalPathway) errors.push('Part 6: Approval pathway required');

    return errors;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await savePart(assessment.id, 6, data);
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
      // Save part 6 first
      await savePart(assessment.id, 6, data);
      // Then submit
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
        <h3 className="text-lg font-semibold text-slate-200 mb-6">Part 6: Next Steps for Assessor</h3>

        <div className="space-y-6 max-w-2xl">
          {/* Confirm Ratings */}
          <div>
            <h4 className="font-medium text-slate-200 mb-4">Confirm Assessment Ratings</h4>

            <div className="grid grid-cols-2 gap-4">
              <fieldset>
                <legend className="text-sm font-medium text-slate-300 mb-2">
                  Housing Need <span className="text-red-500">*</span>
                </legend>
                <div className="flex gap-2">
                  {['High', 'Medium', 'Low'].map((level) => (
                    <label key={level} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${
                      data.housingNeed === level
                        ? level === 'High' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : level === 'Medium' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'border-white/15 hover:bg-white/5'
                    }`}>
                      <input type="radio" name="housingNeed" value={level} checked={data.housingNeed === level}
                        onChange={(e) => update('housingNeed', e.target.value)} disabled={isLocked} className="w-3.5 h-3.5" />
                      {level}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-slate-300 mb-2">
                  Tenancy Suitability Challenge Risk <span className="text-red-500">*</span>
                </legend>
                <div className="flex gap-2">
                  {['High', 'Medium', 'Low'].map((level) => (
                    <label key={level} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${
                      data.tenancyRisk === level
                        ? level === 'High' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : level === 'Medium' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'border-white/15 hover:bg-white/5'
                    }`}>
                      <input type="radio" name="tenancyRisk" value={level} checked={data.tenancyRisk === level}
                        onChange={(e) => update('tenancyRisk', e.target.value)} disabled={isLocked} className="w-3.5 h-3.5" />
                      {level}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Approval Pathway */}
          <fieldset>
            <legend className="text-sm font-medium text-slate-300 mb-2">
              Approval Pathway <span className="text-red-500">*</span>
              <Tooltip text={`Based on Tenancy Risk of "${data.tenancyRisk || '...'}", the suggested pathway is ${suggestedPathway}`} />
            </legend>
            <div className="space-y-3">
              {[
                { value: 'High', label: 'High - Senior Manager Approval', fields: ['seniorManagerSignature', 'seniorManagerDate'] },
                { value: 'Medium', label: 'Medium - Manager Approval', fields: ['managerSignature', 'managerDate'] },
                { value: 'Low', label: 'Low - Front Line Approval', fields: ['frontlineSignature', 'frontlineDate'] },
              ].map((pathway) => (
                <div key={pathway.value} className={`p-3 rounded-lg border ${
                  data.approvalPathway === pathway.value
                    ? 'border-cyan-500/40 bg-cyan-500/10'
                    : 'border-white/10'
                } ${suggestedPathway === pathway.value ? 'ring-2 ring-cyan-500/30' : ''}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="approvalPathway"
                      value={pathway.value}
                      checked={data.approvalPathway === pathway.value}
                      onChange={(e) => update('approvalPathway', e.target.value)}
                      disabled={isLocked}
                      className="w-4 h-4 text-cyan-400"
                    />
                    <span className="text-sm font-medium text-slate-300">{pathway.label}</span>
                    {suggestedPathway === pathway.value && (
                      <span className="text-xs bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded">Suggested</span>
                    )}
                  </label>

                  {data.approvalPathway === pathway.value && (
                    <div className="grid grid-cols-2 gap-3 mt-3 ml-7">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Signature / Name</label>
                        <input
                          type="text"
                          value={data[pathway.fields[0]]}
                          onChange={(e) => update(pathway.fields[0], e.target.value)}
                          disabled={isLocked}
                          className="w-full px-2 py-1.5 text-sm rounded input-glass"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Date</label>
                        <input
                          type="date"
                          value={data[pathway.fields[1]]}
                          onChange={(e) => update(pathway.fields[1], e.target.value)}
                          disabled={isLocked}
                          className="w-full px-2 py-1.5 text-sm rounded input-glass"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </fieldset>

          {/* Professional Judgement */}
          <div className="border border-white/10 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={data.professionalJudgement}
                onChange={(e) => update('professionalJudgement', e.target.checked)}
                disabled={isLocked}
                className="w-4 h-4 rounded text-cyan-400"
              />
              <span className="text-sm font-medium text-slate-300">For Discussion / Professional Judgement</span>
            </label>
            {data.professionalJudgement && (
              <div className="mt-3 ml-7">
                <textarea
                  value={data.professionalJudgementText}
                  onChange={(e) => update('professionalJudgementText', e.target.value)}
                  disabled={isLocked}
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg input-glass"
                  placeholder="Provide justification..."
                  required
                />
              </div>
            )}
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
            <button onClick={() => navigate(`/assessment/${assessment.id}/5`)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg">
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 btn-neon-green rounded-lg disabled:opacity-50">
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit for Approval'}
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
