import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft, Info } from 'lucide-react';

const roughSleepingOptions = [
  { value: 'housed_at_risk', label: 'Housed but at risk', score: 1, help: 'Currently housed but facing potential loss. E.g. living with family but relationship breakdown imminent, temporary accommodation ending soon, notice to vacate received.' },
  { value: 'episodic_under_3m', label: 'Episodic rough sleeping <3 months', score: 2, help: 'Intermittent periods of sleeping rough, total duration less than 3 months. E.g. occasional nights on streets, moving between couch surfing and rough sleeping, short-term homelessness.' },
  { value: 'chronic_3_12m', label: 'Chronic rough sleeping 3–12 months', score: 3, help: 'Continuous or frequent rough sleeping for 3–12 months. E.g. continuously or frequently living in car, sleeping in parks, streets.' },
  { value: 'long_term_over_12m', label: 'Long-term rough sleeping >12 months', score: 4, help: 'Sleeping rough for more than 12 months continuously.' },
  { value: 'not_applicable', label: 'Not Applicable', score: 0 },
];

const housingStatusOptions = [
  { value: 'stable_temporary', label: 'Stable temporary accommodation', score: 1, help: 'Staying with family/friends with no immediate risk of loss.' },
  { value: 'unstable_temporary', label: 'Unstable temporary accommodation', score: 2, help: 'Short-term arrangements with uncertain duration. E.g. moving between friends weekly, tenuous family arrangements.' },
  { value: 'emergency_shelter', label: 'Emergency accommodation / shelter', score: 3, help: 'In emergency housing, night shelter, or motel.' },
  { value: 'overcrowding', label: 'Overcrowding', score: 2, help: 'Living with too many people in shared sleeping areas, or unsuitable living conditions.' },
  { value: 'couch_surfing', label: 'Couch surfing', score: 3, help: 'Staying temporarily with people without secure tenure. Often rotating between households without a stable place to stay.' },
  { value: 'unsuitable_housing', label: 'Unsuitable housing', score: 2, help: 'Accommodation that does not meet basic needs due to safety issues, poor condition, accessibility barriers, or being inappropriate.' },
];

function getHousingNeedRating(score) {
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

const ratingInfo = [
  { rating: 'Low', range: '0 – 3', meaning: 'Low urgency — suitable for standard allocation pipeline' },
  { rating: 'Medium', range: '4 – 6', meaning: 'Moderate urgency — should be prioritised appropriately' },
  { rating: 'High', range: '7 – 10', meaning: 'High urgency — immediate or priority housing response required' },
];

export default function Part2HousingNeed() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part2 || {};

  const [data, setData] = useState({
    roughSleepingDuration: part.roughSleepingDuration || '',
    currentHousingStatus: part.currentHousingStatus || '',
    sectionNotes: part.sectionNotes || '',
  });
  const [saving, setSaving] = useState(false);

  // Auto-calculate scores
  const roughSleepingScore = useMemo(() => {
    const opt = roughSleepingOptions.find((o) => o.value === data.roughSleepingDuration);
    return opt ? opt.score : 0;
  }, [data.roughSleepingDuration]);

  const housingStatusScore = useMemo(() => {
    const opt = housingStatusOptions.find((o) => o.value === data.currentHousingStatus);
    return opt ? opt.score : 0;
  }, [data.currentHousingStatus]);

  const totalScore = roughSleepingScore + housingStatusScore;
  const autoRating = getHousingNeedRating(totalScore);

  // Include calculated fields in save data
  const saveData = {
    ...data,
    housingNeedScore: totalScore,
    housingNeedRating: autoRating,
  };

  useAutoSave(assessment.id, 2, saveData, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 2, saveData);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/3`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Part 2: Housing Need Urgency</h3>
      <p className="text-sm text-slate-400 mb-6">Scores in this section add to the Housing Need Score</p>

      <div className="space-y-6 max-w-2xl">
        {/* Rough Sleeping Duration */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">
            Rough Sleeping Duration <span className="text-red-500">*</span>
            <Tooltip text="Select the single best-fit option describing the applicant's rough sleeping history" />
          </legend>
          <div className="space-y-2">
            {roughSleepingOptions.map((opt) => (
              <label key={opt.value} className={`flex items-start justify-between p-2 rounded hover:bg-white/5 cursor-pointer ${
                data.roughSleepingDuration === opt.value ? 'bg-white/5 ring-1 ring-cyan-500/30' : ''
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="roughSleeping"
                    value={opt.value}
                    checked={data.roughSleepingDuration === opt.value}
                    onChange={(e) => update('roughSleepingDuration', e.target.value)}
                    disabled={isLocked}
                    className="w-4 h-4 text-cyan-400 mt-0.5"
                  />
                  <div>
                    <span className="text-sm text-slate-300">{opt.label}</span>
                    {opt.help && <p className="text-xs text-slate-500 mt-0.5">{opt.help}</p>}
                  </div>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ml-2 ${
                  opt.score > 0 ? 'bg-orange-500/15 text-orange-400' : 'bg-slate-500/15 text-slate-500'
                }`}>
                  +{opt.score}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Current Housing Status */}
        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">
            Current Housing Status <span className="text-red-500">*</span>
            <Tooltip text="Select the applicant's current housing situation" />
          </legend>
          <div className="space-y-2">
            {housingStatusOptions.map((opt) => (
              <label key={opt.value} className={`flex items-start justify-between p-2 rounded hover:bg-white/5 cursor-pointer ${
                data.currentHousingStatus === opt.value ? 'bg-white/5 ring-1 ring-cyan-500/30' : ''
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="housingStatus"
                    value={opt.value}
                    checked={data.currentHousingStatus === opt.value}
                    onChange={(e) => update('currentHousingStatus', e.target.value)}
                    disabled={isLocked}
                    className="w-4 h-4 text-cyan-400 mt-0.5"
                  />
                  <div>
                    <span className="text-sm text-slate-300">{opt.label}</span>
                    {opt.help && <p className="text-xs text-slate-500 mt-0.5">{opt.help}</p>}
                  </div>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ml-2 ${
                  opt.score > 0 ? 'bg-orange-500/15 text-orange-400' : 'bg-slate-500/15 text-slate-500'
                }`}>
                  +{opt.score}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Auto-calculated Score & Rating */}
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Housing Need Score</h4>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{totalScore}</div>
              <div className="text-xs text-slate-500">Total Score</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold px-4 py-1 rounded-lg ${
                autoRating === 'High' ? 'bg-red-500/20 text-red-400'
                  : autoRating === 'Medium' ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {autoRating}
              </div>
              <div className="text-xs text-slate-500 mt-1">Auto Rating</div>
            </div>
          </div>

          {/* Rating guide */}
          <div className="mt-3 border-t border-white/10 pt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left py-1">Rating</th>
                  <th className="text-left py-1">Score Range</th>
                  <th className="text-left py-1">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {ratingInfo.map((r) => (
                  <tr key={r.rating} className={`${autoRating === r.rating ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>
                    <td className="py-0.5">{r.rating}</td>
                    <td className="py-0.5">{r.range}</td>
                    <td className="py-0.5">{r.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            placeholder="Add any additional context about the applicant's housing need here..."
          />
        </div>
      </div>

      {!isLocked && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
          <button onClick={() => navigate(`/assessment/${assessment.id}/1`)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg">
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
