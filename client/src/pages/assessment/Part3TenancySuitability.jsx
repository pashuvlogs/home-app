import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft } from 'lucide-react';

const fields = [
  {
    key: 'antiSocialBehaviour', label: 'Anti-social Behaviour',
    tip: 'Assess the applicant\'s history of anti-social behaviour in previous tenancies',
    options: [
      'Positive history/no previous tenancy',
      'Minor issues resolved',
      'Eviction(s) with mitigating factors',
      'Multiple evictions',
      'Neighbour disputes',
    ],
  },
  {
    key: 'criminalHistory', label: 'Criminal History',
    tip: 'Assess any criminal history relevant to tenancy suitability',
    options: ['No concerns', 'Historical concerns, now resolved', 'Intimidation / assault', 'Violence', 'Drug related'],
  },
  {
    key: 'gangAffiliations', label: 'Gang Affiliations',
    tip: 'Assess any gang affiliations that may affect housing placement',
    options: ['No concerns', 'Historical concerns, now resolved', 'Recent gang association', 'Gang member'],
  },
  {
    key: 'thirdPartyAssociation', label: 'Third Party Association',
    tip: 'Assess concerns about third party associations that may pose risk',
    options: ['No concerns', 'Historical concerns, now resolved', 'Potential concern', 'Known concern'],
  },
  {
    key: 'propertyDamage', label: 'Property Damage',
    tip: 'Assess history of damage to housing properties',
    options: ['No damage history', 'Damage history', 'Damage arrears'],
  },
  {
    key: 'rent', label: 'Rent',
    tip: 'Assess history of rent payment',
    options: ['No concerns', 'Rent arrears history'],
  },
  {
    key: 'physicalHealth', label: 'Physical Health Needs',
    tip: 'Assess physical health needs that may affect housing requirements',
    options: ['No significant needs', 'Managed chronic condition', 'Multiple/poorly managed', 'Acute/hospital-level needs'],
  },
];

const dualFields = [
  {
    key: 'mentalHealth', label: 'Mental Health',
    tip: 'Assess mental health status and support arrangements',
    statusOptions: ['No concerns', 'Diagnosed but stable', 'Active challenges', 'Co-occurring disorders'],
    supportOptions: ['Supports in place', 'No supports in place'],
  },
  {
    key: 'substanceAbuse', label: 'Substance Abuse',
    tip: 'Assess substance abuse status and support arrangements',
    statusOptions: ['No concerns', 'Diagnosed but stable', 'Active challenges', 'Co-occurring disorders'],
    supportOptions: ['Supports in place', 'No supports in place'],
  },
];

export default function Part3TenancySuitability() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part3 || {};

  const [data, setData] = useState({
    antiSocialBehaviour: part.antiSocialBehaviour || '',
    criminalHistory: part.criminalHistory || '',
    gangAffiliations: part.gangAffiliations || '',
    thirdPartyAssociation: part.thirdPartyAssociation || '',
    propertyDamage: part.propertyDamage || '',
    rent: part.rent || '',
    physicalHealth: part.physicalHealth || '',
    mentalHealthStatus: part.mentalHealthStatus || '',
    mentalHealthSupports: part.mentalHealthSupports || '',
    substanceAbuseStatus: part.substanceAbuseStatus || '',
    substanceAbuseSupports: part.substanceAbuseSupports || '',
    challengeSummary: part.challengeSummary || '',
    grossChallengeRating: part.grossChallengeRating || '',
  });
  const [saving, setSaving] = useState(false);

  useAutoSave(assessment.id, 3, data, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 3, data);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/4`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Part 3: Tenancy Match Suitability</h3>

      <div className="space-y-6 max-w-2xl">
        {/* Radio button fields */}
        {fields.map((field) => (
          <fieldset key={field.key}>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              {field.label} <span className="text-red-500">*</span>
              <Tooltip text={field.tip} />
            </legend>
            <div className="space-y-2">
              {field.options.map((opt) => (
                <label key={opt} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={field.key}
                    value={opt}
                    checked={data[field.key] === opt}
                    onChange={(e) => update(field.key, e.target.value)}
                    disabled={isLocked}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {/* Dual-select fields (Mental Health, Substance Abuse) */}
        {dualFields.map((field) => (
          <fieldset key={field.key}>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              {field.label} <span className="text-red-500">*</span>
              <Tooltip text={field.tip} />
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                <div className="space-y-2">
                  {field.statusOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`${field.key}Status`}
                        value={opt}
                        checked={data[`${field.key}Status`] === opt}
                        onChange={(e) => update(`${field.key}Status`, e.target.value)}
                        disabled={isLocked}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Supports</p>
                <div className="space-y-2">
                  {field.supportOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`${field.key}Supports`}
                        value={opt}
                        checked={data[`${field.key}Supports`] === opt}
                        onChange={(e) => update(`${field.key}Supports`, e.target.value)}
                        disabled={isLocked}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>
        ))}

        {/* Challenge Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tenancy Suitability Challenge Summary
            <Tooltip text="Summarize the key tenancy suitability challenges identified above" />
          </label>
          <textarea
            value={data.challengeSummary}
            onChange={(e) => update('challengeSummary', e.target.value)}
            disabled={isLocked}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Summarize tenancy suitability challenges..."
          />
        </div>

        {/* Gross Challenge Rating */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">
            Gross Suitability Challenge Assessment <span className="text-red-500">*</span>
            <Tooltip text="Rate the overall tenancy suitability challenge level based on the data above. Low = minimal challenges, Medium = manageable with support, High = significant challenges" />
          </legend>
          <div className="flex gap-4">
            {['High', 'Medium', 'Low'].map((level) => (
              <label key={level} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${
                data.grossChallengeRating === level
                  ? level === 'High' ? 'bg-red-50 border-red-300 text-red-700'
                    : level === 'Medium' ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'bg-green-50 border-green-300 text-green-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="grossChallengeRating"
                  value={level}
                  checked={data.grossChallengeRating === level}
                  onChange={(e) => update('grossChallengeRating', e.target.value)}
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
          <button onClick={() => navigate(`/assessment/${assessment.id}/2`)} className="flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
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
