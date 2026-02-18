import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft } from 'lucide-react';

const categories = [
  {
    key: 'antiSocialBehaviour',
    label: 'Anti-Social Behaviour',
    tip: 'Select the single best-fit option describing the applicant\'s anti-social behaviour history.',
    options: [
      { value: 'positive_history', label: 'Positive history / no previous tenancy', score: 0, help: 'No history of anti-social behaviour from previous tenancy, positive records of tenancy, or no prior tenancy on record.' },
      { value: 'minor_resolved', label: 'Minor issues resolved', score: 1, help: 'Low-level behaviour concerns (late payments, minor complaints, etc.) that were addressed and no longer present.' },
      { value: 'eviction_mitigating', label: 'Eviction(s) with mitigating factors', score: 2, help: 'Past eviction linked to circumstances that have since changed or been addressed.' },
      { value: 'multiple_evictions', label: 'Multiple evictions', score: 4, help: 'Repeated tenancy failures due to behaviour or unresolved issues.' },
      { value: 'neighbour_disputes', label: 'Neighbour disputes', score: 3, help: 'Ongoing or previous conflicts with neighbours affecting tenancy stability.' },
    ],
  },
  {
    key: 'criminalHistory',
    label: 'Criminal History',
    tip: 'Select the single best-fit option regarding criminal history relevant to tenancy suitability.',
    options: [
      { value: 'no_concerns', label: 'No concerns', score: 0, help: 'No criminal history relevant to tenancy risk.' },
      { value: 'historical_resolved', label: 'Historical concerns, now resolved', score: 1, help: 'Past offending with no recent issues and behaviour now stable.' },
      { value: 'intimidation_assault', label: 'Intimidation / assault', score: 4, help: 'History of threats, intimidation, or physical assault affecting safety or tenancy stability.' },
      { value: 'violence', label: 'Violence', score: 4, help: 'Serious or repeated violent offending presenting significant tenancy risk.' },
      { value: 'drug_related', label: 'Drug related', score: 3, help: 'Offending involving possession, supply, or drug-related activity impacting safety or tenancy conditions.' },
    ],
  },
  {
    key: 'gangAffiliations',
    label: 'Gang Affiliations',
    tip: 'Select the single best-fit option regarding gang affiliations.',
    options: [
      { value: 'no_concerns', label: 'No concerns', score: 0, help: 'No known gang involvement or association.' },
      { value: 'historical_resolved', label: 'Historical concerns, now resolved', score: 1, help: 'Previous gang association with no recent involvement.' },
      { value: 'recent_association', label: 'Recent gang association', score: 3, help: 'Current or recent contact with gang members.' },
      { value: 'gang_member', label: 'Gang member', score: 4, help: 'Active or confirmed membership in a gang.' },
    ],
  },
  {
    key: 'thirdPartyAssociation',
    label: 'Third Party Association',
    tip: 'Select the single best-fit option regarding third party associations that may pose risk.',
    options: [
      { value: 'no_concerns', label: 'No concerns', score: 0, help: 'No known third-party individuals posing risk to the tenancy.' },
      { value: 'historical_resolved', label: 'Historical concerns, now resolved', score: 1, help: 'Previous third-party issues that are no longer active or relevant.' },
      { value: 'potential_concern', label: 'Potential concern', score: 2, help: 'Emerging or possible third-party involvement that may impact tenancy stability or safety.' },
      { value: 'known_concern', label: 'Known concern', score: 4, help: 'Confirmed third-party involvement that poses a clear risk to tenancy or neighbour safety.' },
    ],
  },
  {
    key: 'propertyDamage',
    label: 'Property Damage',
    tip: 'Select the single best-fit option regarding property damage history.',
    options: [
      { value: 'no_damage', label: 'No damage history', score: 0, help: 'No known incidents of property damage in previous tenancies.' },
      { value: 'minor_resolved', label: 'Damage history — minor / one-off resolved', score: 1, help: 'Recorded incidents of property damage that are small-scale or one-off and have been addressed or repaired.' },
      { value: 'serious_repeated', label: 'Damage history — serious or repeated', score: 3, help: 'Recorded serious incidents (or repeated) of property damage.' },
      { value: 'damage_arrears', label: 'Damage arrears', score: 3, help: 'Outstanding costs from unresolved or unrepaid property damage.' },
    ],
  },
  {
    key: 'rent',
    label: 'Rent',
    tip: 'Select the single best-fit option regarding rent payment history.',
    options: [
      { value: 'no_concerns', label: 'No concerns', score: 0, help: 'No history of rent arrears or payment issues.' },
      { value: 'rent_arrears', label: 'Rent arrears history', score: 2, help: 'Previous or recurring rent payment issues that may affect tenancy stability.' },
    ],
  },
  {
    key: 'tenantResponsibility',
    label: 'Tenant Responsibility',
    tip: 'Select the single best-fit option for the applicant\'s demonstrated capacity for tenant responsibility.',
    options: [
      { value: 'strong', label: 'Strong responsibility', score: 0, help: 'Consistently meets tenancy duties independently or with minimal prompts.' },
      { value: 'moderate', label: 'Moderate responsibility', score: 1, help: 'Meets most duties; benefits from occasional reminders or light support.' },
      { value: 'limited', label: 'Limited responsibility', score: 2, help: 'Frequently misses duties; requires regular, structured support to sustain tenancy.' },
      { value: 'no_capacity', label: 'No responsibility capacity currently', score: 3, help: 'Unable to meet duties without intensive, ongoing support or oversight.' },
    ],
  },
];

export default function Part3TenancySuitability() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part3 || {};

  // Initialize selections as single values (handle legacy array data)
  const initialSelections = {};
  categories.forEach((cat) => {
    const saved = part[cat.key];
    initialSelections[cat.key] = Array.isArray(saved) ? (saved[0] || '') : (saved || '');
  });

  const [selections, setSelections] = useState(initialSelections);
  const [sectionNotes, setSectionNotes] = useState(part.sectionNotes || '');
  const [saving, setSaving] = useState(false);

  function selectOption(categoryKey, optionValue) {
    setSelections((prev) => ({ ...prev, [categoryKey]: optionValue }));
  }

  // Calculate score per category and total
  const categoryScores = useMemo(() => {
    const scores = {};
    categories.forEach((cat) => {
      const selected = selections[cat.key];
      const opt = cat.options.find((o) => o.value === selected);
      scores[cat.key] = opt ? opt.score : 0;
    });
    return scores;
  }, [selections]);

  const totalScore = useMemo(() => {
    return Object.values(categoryScores).reduce((sum, s) => sum + s, 0);
  }, [categoryScores]);

  const saveData = {
    ...selections,
    sectionNotes,
    tenancyChallengeScore: totalScore,
    categoryScores,
  };

  useAutoSave(assessment.id, 3, saveData, !isLocked);

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 3, saveData);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/4`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Part 3: Tenancy Challenge</h3>
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
              {cat.options.map((opt) => {
                const isSelected = selections[cat.key] === opt.value;
                return (
                  <label key={opt.value} className={`flex items-start justify-between p-2 rounded hover:bg-white/5 cursor-pointer ${
                    isSelected ? 'bg-white/5 ring-1 ring-cyan-500/30' : ''
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name={cat.key}
                        value={opt.value}
                        checked={isSelected}
                        onChange={(e) => selectOption(cat.key, e.target.value)}
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
                );
              })}
            </div>
          </fieldset>
        ))}

        {/* Running Total */}
        <div className="p-4 rounded-lg border border-white/10 bg-white/5">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Tenancy Challenge Sub-Score (Part 3)</h4>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{totalScore}</div>
              <div className="text-xs text-slate-500">Part 3 Score</div>
            </div>
            <div className="text-xs text-slate-500">
              This score combines with Part 4 (Health & Wellbeing) to form the Gross Tenancy Challenge Score.
            </div>
          </div>
        </div>

        {/* Section Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Section Notes (Optional)
          </label>
          <textarea
            value={sectionNotes}
            onChange={(e) => setSectionNotes(e.target.value)}
            disabled={isLocked}
            rows="4"
            className="w-full px-3 py-2 rounded-lg input-glass"
            placeholder="Add any additional context about tenancy challenge factors here..."
          />
        </div>
      </div>

      {!isLocked && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
          <button onClick={() => navigate(`/assessment/${assessment.id}/2`)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg">
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
