import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import { Save, ArrowRight, ArrowLeft, Info } from 'lucide-react';

const fields = [
  {
    key: 'immediateNeeds',
    label: 'Immediate Needs Identified',
    hint: 'e.g. needs clothing, food support, medical attention, etc.',
    placeholder: 'Describe any immediate needs identified...',
  },
  {
    key: 'strengthsResilience',
    label: 'Strengths & Resilience Factors',
    hint: 'e.g. motivated, good communication, completed courses, etc.',
    placeholder: 'Describe applicant strengths and resilience factors...',
  },
  {
    key: 'mitigatingFactors',
    label: 'Mitigating Factors / Learning',
    hint: 'e.g. completed rehab, engaged with services, stable periods, etc.',
    placeholder: 'Describe relevant mitigating factors or learning since previous concerns...',
  },
  {
    key: 'supportAgencies',
    label: 'Support Agencies Involved',
    hint: 'e.g. OCHT, caseworker name and organisation, GP, etc.',
    placeholder: 'List support agencies and contacts involved...',
  },
];

export default function Part6AdditionalInfo() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part6 || {};

  const [data, setData] = useState({
    immediateNeeds: part.immediateNeeds || '',
    strengthsResilience: part.strengthsResilience || '',
    mitigatingFactors: part.mitigatingFactors || '',
    supportAgencies: part.supportAgencies || '',
  });
  const [saving, setSaving] = useState(false);

  useAutoSave(assessment.id, 6, data, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 6, data);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/7`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Additional Information</h3>
      <p className="text-sm text-slate-400 mb-6">
        Context, strengths, and supporting information. Fields are non-mandatory but support a holistic understanding of the applicant.
      </p>

      <div className="space-y-6 max-w-2xl">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {field.label}
            </label>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <Info size={12} /> {field.hint}
            </p>
            <textarea
              value={data[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              disabled={isLocked}
              rows="4"
              className="w-full px-3 py-2 rounded-lg input-glass"
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      {!isLocked && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
          <button onClick={() => navigate(`/assessment/${assessment.id}/5`)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg">
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
