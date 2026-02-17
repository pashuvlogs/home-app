import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft } from 'lucide-react';

const categories = [
  {
    key: 'physicalHealth',
    label: 'Physical Health Needs',
    tip: 'Assess the applicant\'s physical health needs that may affect their capacity to manage a tenancy independently, such as mobility issues, chronic illness, or acute medical conditions.',
    options: [
      { value: 'no_significant', label: 'No significant needs', score: 0 },
      { value: 'managed_chronic', label: 'Managed chronic condition', score: 1 },
      { value: 'multiple_poorly_managed', label: 'Multiple / poorly managed conditions', score: 2 },
      { value: 'acute_hospital', label: 'Acute / hospital-level needs', score: 3 },
    ],
  },
  {
    key: 'mentalHealth',
    label: 'Mental Health',
    tip: 'Select the single best-fit option for mental health status.',
    options: [
      { value: 'no_concerns', label: 'No concerns', score: 0 },
      { value: 'diagnosed_stable', label: 'Diagnosed but stable', score: 1 },
      { value: 'active_challenges', label: 'Active challenges', score: 2 },
      { value: 'co_occurring', label: 'Co-occurring disorders', score: 3 },
    ],
  },
  {
    key: 'substanceAbuse',
    label: 'Substance Abuse',
    tip: 'Select the single best-fit option for substance abuse status.',
    options: [
      { value: 'no_concerns', label: 'No concerns', score: 0 },
      { value: 'diagnosed_stable', label: 'Diagnosed but stable', score: 1 },
      { value: 'active_challenges', label: 'Active challenges', score: 3 },
      { value: 'co_occurring', label: 'Co-occurring disorders', score: 3 },
    ],
  },
];

export default function Part4HealthWellbeing() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part4 || {};

  const [data, setData] = useState({
    physicalHealth: part.physicalHealth || '',
    mentalHealth: part.mentalHealth || '',
    substanceAbuse: part.substanceAbuse || '',
    sectionNotes: part.sectionNotes || '',
  });
  const [saving, setSaving] = useState(false);

  const categoryScores = useMemo(() => {
    const scores = {};
    categories.forEach((cat) => {
      const opt = cat.options.find((o) => o.value === data[cat.key]);
      scores[cat.key] = opt ? opt.score : 0;
    });
    return scores;
  }, [data]);

  const totalScore = useMemo(() => {
    return Object.values(categoryScores).reduce((sum, s) => sum + s, 0);
  }, [categoryScores]);

  const saveData = {
    ...data,
    healthWellbeingScore: totalScore,
    categoryScores,
  };

  useAutoSave(assessment.id, 4, saveData, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 4, saveData);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/5`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Part 4: Health & Wellbeing Needs</h3>
      <p className="text-sm text-slate-400 mb-6">
        Scores in this section add to the Gross Tenancy Challenge Score. Select the single best-fit option in each category.
      </p>

      <div className="space-y-6 max-w-2xl">
        {categories.map((cat) => (
          <fieldset key={cat.key}>
            <legend className="text-sm font-medium text-slate-300 mb-2 flex items-center justify-between">
              <span>
                {cat.label} <span className="text-red-500">*</span>
                <Tooltip text={cat.tip} />
              </span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                categoryScores[cat.key] > 0 ? 'bg-orange-500/15 text-orange-400' : 'bg-slate-500/15 text-slate-500'
              }`}>
                +{categoryScores[cat.key]}
              </span>
            </legend>
            <div className="space-y-1">
              {cat.options.map((opt) => (
                <label key={opt.value} className={`flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer ${
                  data[cat.key] === opt.value ? 'bg-white/5 ring-1 ring-cyan-500/30' : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={cat.key}
                      value={opt.value}
                      checked={data[cat.key] === opt.value}
                      onChange={(e) => update(cat.key, e.target.value)}
                      disabled={isLocked}
                      className="w-4 h-4 text-cyan-400"
                    />
                    <span className="text-sm text-slate-300">{opt.label}</span>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    opt.score > 0 ? 'bg-orange-500/15 text-orange-400' : 'bg-slate-500/15 text-slate-500'
                  }`}>
                    +{opt.score}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {/* Running Total */}
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Health & Wellbeing Sub-Score (Part 4)</h4>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{totalScore}</div>
              <div className="text-xs text-slate-500">Part 4 Score</div>
            </div>
            <div className="text-xs text-slate-500">
              This score combines with Part 3 (Tenancy Challenge) to form the Gross Tenancy Challenge Score.
            </div>
          </div>
        </div>

        {/* Section Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Section Notes (Optional)
          </label>
          <textarea
            value={data.sectionNotes}
            onChange={(e) => update('sectionNotes', e.target.value)}
            disabled={isLocked}
            rows="4"
            className="w-full px-3 py-2 rounded-lg input-glass"
            placeholder="Add any additional context about health and wellbeing needs here..."
          />
        </div>
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
