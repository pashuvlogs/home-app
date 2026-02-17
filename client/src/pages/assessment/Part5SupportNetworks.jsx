import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft, Info } from 'lucide-react';

const categories = [
  {
    key: 'supportNetwork',
    label: 'Support Network Strength',
    tip: 'Select the single best-fit option. These scores reduce the Gross Challenge Score.',
    options: [
      { value: 'strong', label: 'Strong support — active family/whānau/friends AND/OR engaged caseworker', score: -3 },
      { value: 'moderate', label: 'Moderate support — some family/friend connections OR occasional service engagement', score: -2 },
      { value: 'minimal', label: 'Minimal support — limited connections, sporadic contact with services', score: -1 },
      { value: 'none', label: 'No support — completely isolated, no family/friends/services engaged', score: 0 },
    ],
  },
  {
    key: 'accessibilityNeeds',
    label: 'Accessibility Needs',
    tip: 'Fewer accessibility constraints mean more placement options and flexibility, which mitigates challenge. Greater needs narrow options but are addressed through property matching.',
    options: [
      { value: 'none', label: 'No accessibility needs', score: -2 },
      { value: 'minor', label: 'Minor accessibility needs — requires minor adaptations (handrails, ramps, etc.)', score: -1 },
      { value: 'significant', label: 'Significant accessibility needs — requires wheelchair access, ground floor, modified bathroom', score: 0 },
      { value: 'severe', label: 'Severe accessibility needs — requires purpose-built accessible housing OR proximity to specialised care', score: 0 },
    ],
  },
  {
    key: 'culturalConnections',
    label: 'Cultural / Community Connections & Location Requirements',
    tip: 'Strong cultural/community connections increase placement stability.',
    options: [
      { value: 'strong', label: 'Strong connections — Essential location requirement (marae links, caregiving, essential whānau support)', score: -2 },
      { value: 'moderate', label: 'Moderate connections — Strong preference for certain locations (meaningful community ties)', score: -1 },
      { value: 'limited', label: 'Limited connections — General preference, flexible', score: 0 },
      { value: 'none', label: 'No connections — Fully flexible about location', score: 0 },
    ],
  },
];

export default function Part5SupportNetworks() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part5 || {};

  const [data, setData] = useState({
    supportNetwork: part.supportNetwork || '',
    accessibilityNeeds: part.accessibilityNeeds || '',
    culturalConnections: part.culturalConnections || '',
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

  const totalMitigation = useMemo(() => {
    return Object.values(categoryScores).reduce((sum, s) => sum + s, 0);
  }, [categoryScores]);

  const saveData = {
    ...data,
    mitigationScore: totalMitigation,
    categoryScores,
  };

  useAutoSave(assessment.id, 5, saveData, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 5, saveData);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/6`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Part 5: Support Networks</h3>
      <p className="text-sm text-slate-400 mb-6">
        Scores in this section <span className="text-emerald-400 font-medium">REDUCE</span> the challenge score (mitigation). Select the single best-fit option in each category.
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
                categoryScores[cat.key] < 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-500'
              }`}>
                {categoryScores[cat.key]}
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
                    opt.score < 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-500'
                  }`}>
                    {opt.score}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {/* Mitigation Total */}
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Total Mitigation Score</h4>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${totalMitigation < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {totalMitigation}
              </div>
              <div className="text-xs text-slate-500">Mitigation</div>
            </div>
            <div className="text-xs text-slate-500">
              This negative score is subtracted from the Gross Tenancy Challenge Score to produce the Residual Suitability Challenge Score.
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
            placeholder="Add any additional context about support networks and mitigation here..."
          />
        </div>
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
