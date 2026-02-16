import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft } from 'lucide-react';

const fields = [
  {
    key: 'supportNetwork', label: 'Support Network Strength',
    tip: 'Assess the strength of the applicant\'s support network including family, friends, and services',
    options: ['Strong support', 'Moderate support', 'Minimal support', 'No support'],
  },
  {
    key: 'accessibilityNeeds', label: 'Accessibility Needs',
    tip: 'Assess any accessibility requirements for the housing',
    options: ['No accessibility needs', 'Minor accessibility needs', 'Significant accessibility needs', 'Severe accessibility needs'],
  },
  {
    key: 'culturalConnections', label: 'Cultural/Community Connections',
    tip: 'Assess the applicant\'s cultural and community connections that may support tenancy success',
    options: ['Strong connections', 'Moderate connections', 'Limited connections', 'No connections'],
  },
  {
    key: 'tenantResponsibility', label: 'Tenant Responsibility',
    tip: 'Assess the applicant\'s demonstrated capacity for tenant responsibility',
    options: ['Strong support', 'Moderate support', 'Limited support', 'No support'],
  },
  {
    key: 'housingOptions', label: 'Housing Options',
    tip: 'Assess the type of housing required based on the applicant\'s needs',
    options: ['Limited housing type required', 'Moderate housing type required', 'No housing type required', 'Institutional housing required'],
  },
];

export default function Part4Mitigation() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part4 || {};

  const [data, setData] = useState({
    supportNetwork: part.supportNetwork || '',
    accessibilityNeeds: part.accessibilityNeeds || '',
    culturalConnections: part.culturalConnections || '',
    tenantResponsibility: part.tenantResponsibility || '',
    housingOptions: part.housingOptions || '',
    mitigationSummary: part.mitigationSummary || '',
    residualChallengeRating: part.residualChallengeRating || '',
  });
  const [saving, setSaving] = useState(false);

  useAutoSave(assessment.id, 4, data, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 4, data);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/5`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-6">Part 4: Tenancy Match Challenge Mitigation</h3>

      <div className="space-y-6 max-w-2xl">
        {fields.map((field) => (
          <fieldset key={field.key}>
            <legend className="text-sm font-medium text-slate-300 mb-2">
              {field.label} <span className="text-red-500">*</span>
              <Tooltip text={field.tip} />
            </legend>
            <div className="space-y-2">
              {field.options.map((opt) => (
                <label key={opt} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                  <input
                    type="radio"
                    name={field.key}
                    value={opt}
                    checked={data[field.key] === opt}
                    onChange={(e) => update(field.key, e.target.value)}
                    disabled={isLocked}
                    className="w-4 h-4 text-cyan-400"
                  />
                  <span className="text-sm text-slate-300">{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Mitigation & Protective Factors Summary
            <Tooltip text="Summarize the mitigating and protective factors that may reduce tenancy suitability challenges" />
          </label>
          <textarea
            value={data.mitigationSummary}
            onChange={(e) => update('mitigationSummary', e.target.value)}
            disabled={isLocked}
            rows="4"
            className="w-full px-3 py-2 rounded-lg input-glass"
            placeholder="Describe mitigating factors..."
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">
            Residual Suitability Challenge Assessment <span className="text-red-500">*</span>
            <Tooltip text="After considering mitigation factors, rate the residual challenge level. This should reflect challenges remaining after mitigation." />
          </legend>
          <div className="flex gap-4">
            {['High', 'Medium', 'Low'].map((level) => (
              <label key={level} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${
                data.residualChallengeRating === level
                  ? level === 'High' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : level === 'Medium' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'border-white/15 hover:bg-white/5'
              }`}>
                <input
                  type="radio"
                  name="residualChallengeRating"
                  value={level}
                  checked={data.residualChallengeRating === level}
                  onChange={(e) => update('residualChallengeRating', e.target.value)}
                  disabled={isLocked}
                  className="w-4 h-4"
                />
                <span className="font-medium">{level}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {!isLocked && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
          <button onClick={() => navigate(`/assessment/${assessment.id}/3`)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg">
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
