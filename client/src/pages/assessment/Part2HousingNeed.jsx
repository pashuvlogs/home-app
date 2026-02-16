import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft } from 'lucide-react';

const roughSleepingOptions = [
  { value: 'housed_at_risk', label: 'Housed but at risk', tip: 'Currently housed but facing potential homelessness' },
  { value: 'episodic_under_3m', label: 'Episodic (<3 months)', tip: 'Intermittent rough sleeping for less than 3 months' },
  { value: 'chronic_3_12m', label: 'Chronic (3-12 months)', tip: 'Sustained rough sleeping between 3 and 12 months' },
  { value: 'long_term_over_12m', label: 'Long-term (>12 months)', tip: 'Extended rough sleeping exceeding 12 months' },
  { value: 'not_applicable', label: 'Not Applicable', tip: 'Rough sleeping history is not applicable' },
];

const housingStatusOptions = [
  { value: 'stable_temporary', label: 'Stable temporary accommodation', tip: 'Secure temporary housing arrangement' },
  { value: 'unstable_temporary', label: 'Unstable temporary accommodation', tip: 'Temporary housing that may end soon' },
  { value: 'emergency_shelter', label: 'Emergency accommodation/shelter', tip: 'Emergency or shelter-based accommodation' },
  { value: 'overcrowding', label: 'Overcrowding', tip: 'Living in overcrowded conditions' },
  { value: 'couch_surfing', label: 'Couch surfing', tip: 'Staying temporarily with friends/family without a fixed arrangement' },
  { value: 'unsuitable_housing', label: 'Unsuitable housing', tip: 'Current housing is unsuitable for the applicant\'s needs' },
];

const suitabilityOptions = [
  { value: 'standalone', label: 'Stand-alone housing', tip: 'Independent dwelling' },
  { value: 'complex_2_10', label: 'Housing complex (2-10 properties)', tip: 'Small multi-unit complex' },
  { value: 'complex_11_20', label: 'Housing complex (11-20 properties)', tip: 'Medium multi-unit complex' },
  { value: 'complex_20_plus', label: 'Housing complex (20+ properties)', tip: 'Large multi-unit complex' },
  { value: 'institutional', label: 'Institutional housing', tip: 'Supported or institutional accommodation' },
];

export default function Part2HousingNeed() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part2 || {};

  const [data, setData] = useState({
    roughSleepingDuration: part.roughSleepingDuration || '',
    currentHousingStatus: part.currentHousingStatus || '',
    housingSuitability: part.housingSuitability || [],
    housingNeedSummary: part.housingNeedSummary || '',
    housingNeedRating: part.housingNeedRating || '',
  });
  const [saving, setSaving] = useState(false);

  useAutoSave(assessment.id, 2, data, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSuitability(value) {
    setData((prev) => ({
      ...prev,
      housingSuitability: prev.housingSuitability.includes(value)
        ? prev.housingSuitability.filter((v) => v !== value)
        : [...prev.housingSuitability, value],
    }));
  }

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 2, data);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/3`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Part 2: Housing Need</h3>

      <div className="space-y-6 max-w-2xl">
        {/* Rough Sleeping Duration */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Rough Sleeping Duration <span className="text-red-500">*</span>
            <Tooltip text="Select the option that best describes the applicant's rough sleeping history" />
          </legend>
          <div className="space-y-2">
            {roughSleepingOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="roughSleeping"
                  value={opt.value}
                  checked={data.roughSleepingDuration === opt.value}
                  onChange={(e) => update('roughSleepingDuration', e.target.value)}
                  disabled={isLocked}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
                <Tooltip text={opt.tip} />
              </label>
            ))}
          </div>
        </fieldset>

        {/* Current Housing Status */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Current Housing Status <span className="text-red-500">*</span>
            <Tooltip text="Select the applicant's current housing situation" />
          </legend>
          <div className="space-y-2">
            {housingStatusOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="housingStatus"
                  value={opt.value}
                  checked={data.currentHousingStatus === opt.value}
                  onChange={(e) => update('currentHousingStatus', e.target.value)}
                  disabled={isLocked}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
                <Tooltip text={opt.tip} />
              </label>
            ))}
          </div>
        </fieldset>

        {/* Housing Suitability */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Housing - Applicant Suitability
            <Tooltip text="Select all housing types suitable for the applicant" />
          </legend>
          <div className="space-y-2">
            {suitabilityOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.housingSuitability.includes(opt.value)}
                  onChange={() => toggleSuitability(opt.value)}
                  disabled={isLocked}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
                <Tooltip text={opt.tip} />
              </label>
            ))}
          </div>
        </fieldset>

        {/* Housing Need Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Housing Need Summary
            <Tooltip text="Summarize the applicant's housing need based on the above selections" />
          </label>
          <textarea
            value={data.housingNeedSummary}
            onChange={(e) => update('housingNeedSummary', e.target.value)}
            disabled={isLocked}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Describe the applicant's housing need..."
          />
        </div>

        {/* Housing Need Rating */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Housing Need Assessment <span className="text-red-500">*</span>
            <Tooltip text="Rate the overall housing need based on your professional assessment of the data above" />
          </legend>
          <div className="flex gap-4">
            {['High', 'Medium', 'Low'].map((level) => (
              <label key={level} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${
                data.housingNeedRating === level
                  ? level === 'High' ? 'bg-red-50 border-red-300 text-red-700'
                    : level === 'Medium' ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'bg-green-50 border-green-300 text-green-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="housingNeedRating"
                  value={level}
                  checked={data.housingNeedRating === level}
                  onChange={(e) => update('housingNeedRating', e.target.value)}
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
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
          <button onClick={() => navigate(`/assessment/${assessment.id}/1`)} className="flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            Save & Continue <ArrowRight size={16} />
          </button>
          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <Save size={16} /> Save Draft
          </button>
        </div>
      )}
    </div>
  );
}
