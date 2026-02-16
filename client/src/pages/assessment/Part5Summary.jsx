import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart, overrideAssessment } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

const recommendationOptions = [
  'Proceed with housing allocation with conditions',
  'Proceed with housing allocation without conditions',
  'Defer allocation pending further supports or approvals',
  'Decline allocation',
];

export default function Part5Summary() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part5 || {};
  const p2 = assessment.formData?.part2 || {};
  const p3 = assessment.formData?.part3 || {};
  const p4 = assessment.formData?.part4 || {};

  const [data, setData] = useState({
    housingNeedRating: part.housingNeedRating || p2.housingNeedRating || assessment.housingNeedRating || '',
    grossChallengeRating: part.grossChallengeRating || p3.grossChallengeRating || assessment.grossChallengeRating || '',
    residualChallengeRating: part.residualChallengeRating || p4.residualChallengeRating || assessment.residualChallengeRating || '',
    overallMatchChallenge: part.overallMatchChallenge || assessment.overallMatchChallenge || '',
    propertyType: part.propertyType || '',
    housingSetting: part.housingSetting || '',
    locationConsiderations: part.locationConsiderations || '',
    tenancySupport: part.tenancySupport || '',
    tenancySupportEnabled: part.tenancySupportEnabled || false,
    healthServices: part.healthServices || '',
    healthServicesEnabled: part.healthServicesEnabled || false,
    communitySupports: part.communitySupports || '',
    communitySupportsEnabled: part.communitySupportsEnabled || false,
    finalRecommendation: part.finalRecommendation || assessment.finalRecommendation || '',
    conditions: part.conditions || '',
  });

  const [showOverride, setShowOverride] = useState(!!assessment.professionalJudgementOverride);
  const [override, setOverride] = useState({
    originalScore: assessment.professionalJudgementOverride?.originalScore || '',
    adjustedScore: assessment.professionalJudgementOverride?.adjustedScore || '',
    justification: assessment.professionalJudgementOverride?.justification || '',
  });
  const [saving, setSaving] = useState(false);

  useAutoSave(assessment.id, 5, data, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  // Check missing info from previous parts
  const warnings = [];
  if (!p2.roughSleepingDuration) warnings.push('Part 2: Rough Sleeping Duration not set');
  if (!p2.currentHousingStatus) warnings.push('Part 2: Current Housing Status not set');
  if (!p2.housingNeedRating && !assessment.housingNeedRating) warnings.push('Part 2: Housing Need Rating not set');
  if (!p3.antiSocialBehaviour) warnings.push('Part 3: Anti-social Behaviour not set');
  if (!p3.criminalHistory) warnings.push('Part 3: Criminal History not set');
  if (!p3.grossChallengeRating && !assessment.grossChallengeRating) warnings.push('Part 3: Gross Challenge Rating not set');
  if (!p4.supportNetwork) warnings.push('Part 4: Support Network not set');
  if (!p4.residualChallengeRating && !assessment.residualChallengeRating) warnings.push('Part 4: Residual Challenge Rating not set');

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 5, data);

      // Save override if active
      if (showOverride && override.justification) {
        await overrideAssessment(assessment.id, {
          originalScore: override.originalScore || data.overallMatchChallenge,
          adjustedScore: override.adjustedScore,
          justification: override.justification,
        });
      }

      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/6`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-6">Part 5: Assessment Summary & Recommendations</h3>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Missing Information from Previous Parts
          </h4>
          <ul className="text-sm text-yellow-400 list-disc list-inside space-y-1">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        {/* Section 1: Assessment Summary */}
        <div>
          <h4 className="font-medium text-slate-200 mb-4">1. Assessment Summary</h4>

          {/* Pre-populated ratings */}
          <div className="space-y-4">
            <RatingField
              label="Accommodation Need Assessment"
              tooltip="Housing need rating from Part 2 (editable)"
              value={data.housingNeedRating}
              onChange={(v) => update('housingNeedRating', v)}
              disabled={isLocked}
              source="from Part 2"
            />
            <RatingField
              label="Gross Suitability Challenge Assessment"
              tooltip="Tenancy suitability challenge from Part 3 (editable)"
              value={data.grossChallengeRating}
              onChange={(v) => update('grossChallengeRating', v)}
              disabled={isLocked}
              source="from Part 3"
            />
            <RatingField
              label="Residual Suitability Challenge Assessment"
              tooltip="Residual challenge after mitigation from Part 4 (editable)"
              value={data.residualChallengeRating}
              onChange={(v) => update('residualChallengeRating', v)}
              disabled={isLocked}
              source="from Part 4"
            />
            <RatingField
              label="Overall Applicant Accommodation Match Challenge"
              tooltip="Final synthesized rating considering all factors"
              value={data.overallMatchChallenge}
              onChange={(v) => update('overallMatchChallenge', v)}
              disabled={isLocked}
              required
            />
          </div>
        </div>

        {/* Section 2: Accommodation Recommendation */}
        <div>
          <h4 className="font-medium text-slate-200 mb-4">2. Suitable Accommodation Recommendation</h4>
          <div className="space-y-3">
            <TextField label="Property type" value={data.propertyType} onChange={(v) => update('propertyType', v)} disabled={isLocked} />
            <TextField label="Housing setting" value={data.housingSetting} onChange={(v) => update('housingSetting', v)} disabled={isLocked} />
            <TextField label="Location considerations" value={data.locationConsiderations} onChange={(v) => update('locationConsiderations', v)} disabled={isLocked} />
          </div>
        </div>

        {/* Section 3: Support Plan */}
        <div>
          <h4 className="font-medium text-slate-200 mb-4">3. Support & Challenge Management Plan</h4>
          <div className="space-y-3">
            <CheckTextField
              label="Tenancy support"
              checked={data.tenancySupportEnabled}
              onCheck={(v) => update('tenancySupportEnabled', v)}
              value={data.tenancySupport}
              onChange={(v) => update('tenancySupport', v)}
              disabled={isLocked}
            />
            <CheckTextField
              label="Health or addiction services"
              checked={data.healthServicesEnabled}
              onCheck={(v) => update('healthServicesEnabled', v)}
              value={data.healthServices}
              onChange={(v) => update('healthServices', v)}
              disabled={isLocked}
            />
            <CheckTextField
              label="Social or community supports"
              checked={data.communitySupportsEnabled}
              onCheck={(v) => update('communitySupportsEnabled', v)}
              value={data.communitySupports}
              onChange={(v) => update('communitySupports', v)}
              disabled={isLocked}
            />
          </div>
        </div>

        {/* Professional Judgment Override */}
        <div className="border border-purple-500/30 rounded-lg p-4 bg-purple-500/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-purple-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              Professional Judgement Override
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

          {showOverride && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Original Score</label>
                <input
                  type="text"
                  value={override.originalScore || data.overallMatchChallenge}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg input-glass"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Adjusted Score <span className="text-red-500">*</span></label>
                <select
                  value={override.adjustedScore}
                  onChange={(e) => setOverride({ ...override, adjustedScore: e.target.value })}
                  disabled={isLocked}
                  className="w-full px-3 py-2 rounded-lg input-glass"
                >
                  <option value="">Select adjusted score...</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Justification <span className="text-red-500">*</span></label>
                <textarea
                  value={override.justification}
                  onChange={(e) => setOverride({ ...override, justification: e.target.value })}
                  disabled={isLocked}
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg input-glass"
                  placeholder="Explain why the automatic scoring does not fully reflect current circumstances..."
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Overall Recommendation */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">
            Overall Assessment & Recommendation <span className="text-red-500">*</span>
            <Tooltip text="Select the final recommendation for this assessment" />
          </legend>
          <div className="space-y-2">
            {recommendationOptions.map((opt) => (
              <label key={opt} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                <input
                  type="radio"
                  name="finalRecommendation"
                  value={opt}
                  checked={data.finalRecommendation === opt}
                  onChange={(e) => update('finalRecommendation', e.target.value)}
                  disabled={isLocked}
                  className="w-4 h-4 text-cyan-400"
                />
                <span className="text-sm text-slate-300">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Conditions */}
        {data.finalRecommendation?.includes('with conditions') && (
          <div>
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

      {!isLocked && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
          <button onClick={() => navigate(`/assessment/${assessment.id}/4`)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 btn-neon rounded-lg disabled:opacity-50">
            Save & Continue <ArrowRight size={16} />
          </button>
          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg disabled:opacity-50">
            <Save size={16} /> Save Draft
          </button>
        </div>
      )}
    </div>
  );
}

function RatingField({ label, tooltip, value, onChange, disabled, source, required }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {source && <span className="text-xs text-slate-500 ml-2">({source})</span>}
        {tooltip && <Tooltip text={tooltip} />}
      </legend>
      <div className="flex gap-3">
        {['High', 'Medium', 'Low'].map((level) => (
          <label key={level} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${
            value === level
              ? level === 'High' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : level === 'Medium' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'border-white/15 hover:bg-white/5'
          }`}>
            <input type="radio" value={level} checked={value === level} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-3.5 h-3.5" />
            {level}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TextField({ label, value, onChange, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg input-glass"
      />
    </div>
  );
}

function CheckTextField({ label, checked, onCheck, value, onChange, disabled }) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheck(e.target.checked)}
        disabled={disabled}
        className="mt-2 w-4 h-4 rounded text-cyan-400"
      />
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !checked}
          className="w-full px-3 py-2 rounded-lg input-glass"
          placeholder={checked ? `Describe ${label.toLowerCase()}...` : ''}
        />
      </div>
    </div>
  );
}
