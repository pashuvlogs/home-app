import { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import Tooltip from '../../components/Tooltip';
import { Save, ArrowRight, ArrowLeft, AlertTriangle, Calculator } from 'lucide-react';

const housingTypeOptions = [
  { value: 'standalone', label: 'Stand-alone housing', desc: 'A single, self-contained property on its own section. Best for applicants needing privacy or low-stimulus environments.' },
  { value: 'complex_2_10', label: 'Housing complex (2–10 properties)', desc: 'A small cluster of homes. Suitable for people who can manage light neighbour contact.' },
  { value: 'complex_11_20', label: 'Housing complex (11–20 properties)', desc: 'A medium-sized complex. Suitable for tenants comfortable with moderate community living.' },
  { value: 'complex_20_plus', label: 'Housing complex (20+ properties)', desc: 'A large housing complex with high activity and frequent social interaction.' },
  { value: 'institutional', label: 'Institutional housing', desc: 'Specialised, staffed accommodation. Used when daily oversight or intensive support is needed.' },
];

const houseSettingOptions = [
  { value: 'standard', label: 'Standard property', desc: 'No specific accessibility modifications required.' },
  { value: 'minor_adaptations', label: 'Minor adaptations', desc: 'Small modifications such as grab rails, lever taps, or improved lighting.' },
  { value: 'wheelchair_accessible', label: 'Wheelchair accessible / ground floor', desc: 'Requires step-free access, wider doorways, and ground-floor living.' },
  { value: 'purpose_built', label: 'Purpose-built accessible', desc: 'Fully adapted or purpose-built accessible property with specialist fittings.' },
];

function getRecommendedHouseSetting(accessibilityNeeds) {
  const map = {
    none: 'standard',
    minor: 'minor_adaptations',
    significant: 'wheelchair_accessible',
    severe: 'purpose_built',
  };
  return map[accessibilityNeeds] || 'standard';
}

function getGrossRating(score) {
  if (score >= 13) return 'High';
  if (score >= 6) return 'Medium';
  return 'Low';
}

function getResidualRating(score) {
  if (score >= 9) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

function getHousingNeedRating(score) {
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
}

function getRecommendedHousingTypes(residualScore, accessibilityNeeds) {
  if (accessibilityNeeds === 'severe') {
    return ['standalone', 'institutional'];
  }
  if (residualScore >= 9) return ['complex_20_plus', 'institutional'];
  if (residualScore >= 4) return ['complex_2_10', 'complex_11_20'];
  return ['standalone', 'complex_2_10'];
}

export default function Part7Summary() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part7 || {};
  const p2 = assessment.formData?.part2 || {};
  const p3 = assessment.formData?.part3 || {};
  const p4 = assessment.formData?.part4 || {};
  const p5 = assessment.formData?.part5 || {};

  // Auto-calculate scores from previous parts
  const housingNeedScore = p2.housingNeedScore || 0;
  const tenancyChallengeScore = p3.tenancyChallengeScore || 0;
  const healthWellbeingScore = p4.healthWellbeingScore || 0;
  const mitigationScore = p5.mitigationScore || 0;

  const grossChallengeScore = tenancyChallengeScore + healthWellbeingScore;
  const residualScore = Math.max(0, grossChallengeScore + mitigationScore); // mitigation is negative

  const housingNeedRating = getHousingNeedRating(housingNeedScore);
  const grossRating = getGrossRating(grossChallengeScore);
  const residualRating = getResidualRating(residualScore);
  const overallRating = residualRating; // maps directly to Residual

  const recommendedTypes = getRecommendedHousingTypes(residualScore, p5.accessibilityNeeds);
  const recommendedSetting = getRecommendedHouseSetting(p5.accessibilityNeeds);

  // Pre-populate support plan checkboxes from Part 4 Health & Wellbeing selections
  const physicalNeedsSupport = ['managed_chronic', 'multiple_poorly_managed', 'acute_hospital'].includes(p4.physicalHealth);
  const mentalNeedsSupport = ['diagnosed_stable', 'active_challenges', 'co_occurring'].includes(p4.mentalHealth);
  const substanceNeedsSupport = ['diagnosed_stable', 'active_challenges', 'co_occurring'].includes(p4.substanceAbuse);
  const mentalNeedsCommunity = ['active_challenges', 'co_occurring'].includes(p4.mentalHealth);

  const suggestHealthServices = physicalNeedsSupport || mentalNeedsSupport || substanceNeedsSupport;
  const suggestCommunitySupports = mentalNeedsCommunity;

  const [data, setData] = useState({
    housingType: part.housingType || '',
    houseSetting: part.houseSetting ?? recommendedSetting,
    houseSettingNotes: part.houseSettingNotes || '',
    locationConsiderations: part.locationConsiderations || '',
    tenancySupportEnabled: part.tenancySupportEnabled || false,
    tenancySupport: part.tenancySupport || '',
    healthServicesEnabled: part.healthServicesEnabled ?? suggestHealthServices,
    healthServices: part.healthServices || '',
    communitySupportsEnabled: part.communitySupportsEnabled ?? suggestCommunitySupports,
    communitySupports: part.communitySupports || '',
  });
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  // Validation warnings
  const warnings = [];
  if (!p2.roughSleepingDuration) warnings.push('Part 2: Rough Sleeping Duration not set');
  if (!p2.currentHousingStatus) warnings.push('Part 2: Current Housing Status not set');
  if (!p3.tenancyChallengeScore && p3.tenancyChallengeScore !== 0) warnings.push('Part 3: Tenancy Challenge not scored');
  if (!p4.healthWellbeingScore && p4.healthWellbeingScore !== 0) warnings.push('Part 4: Health & Wellbeing not scored');
  if (!p5.supportNetwork) warnings.push('Part 5: Support Network not set');

  const saveData = {
    ...data,
    housingNeedScore,
    housingNeedRating,
    grossChallengeScore,
    grossChallengeRating: grossRating,
    mitigationScore,
    residualScore,
    residualChallengeRating: residualRating,
    overallMatchChallenge: overallRating,
  };

  useAutoSave(assessment.id, 7, saveData, !isLocked);

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 7, saveData);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/8`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Assessment Summary & Recommendations</h3>
      <p className="text-sm text-slate-400 mb-6">Auto-calculated from Parts 2\u20135. Verify scores and add narrative.</p>

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
          <h4 className="font-medium text-slate-200 mb-4 flex items-center gap-2">
            <Calculator size={16} /> 1. Assessment Summary
          </h4>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Housing Need */}
            <ScoreCard
              title="Housing Need Score"
              source="from Part 2"
              score={housingNeedScore}
              rating={housingNeedRating}
              detail="Rough sleeping + housing status"
            />

            {/* Gross Challenge */}
            <ScoreCard
              title="Gross Suitability Challenge"
              source="from Parts 3 + 4"
              score={grossChallengeScore}
              rating={grossRating}
              detail={`Tenancy (${tenancyChallengeScore}) + Health (${healthWellbeingScore})`}
              color="orange"
            />

            {/* Mitigation */}
            <div className="p-4 rounded-lg border border-white/10 bg-white/5">
              <div className="text-xs text-slate-500 mb-1">Total Mitigation (from Part 5)</div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${mitigationScore < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {mitigationScore}
                </span>
                <span className="text-xs text-slate-500">Negative score reduces challenge</span>
              </div>
            </div>

            {/* Residual */}
            <ScoreCard
              title="Residual Suitability Challenge"
              source="Gross + Mitigation"
              score={residualScore}
              rating={residualRating}
              detail={`${grossChallengeScore} + (${mitigationScore}) = ${residualScore}`}
              color="purple"
            />
          </div>

          {/* Overall Assessment */}
          <div className="mt-4 p-4 rounded-lg border-2 border-cyan-500/30 bg-cyan-500/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-300">Overall Applicant Accommodation Match Challenge Assessment</div>
                <div className="text-xs text-slate-500 mt-1">Maps directly to Residual Suitability Challenge</div>
              </div>
              <div className={`text-xl font-bold px-4 py-2 rounded-lg ${
                overallRating === 'High' ? 'bg-red-500/20 text-red-400'
                  : overallRating === 'Medium' ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {overallRating}
              </div>
            </div>
          </div>

          {/* Rating guides */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <RatingGuide title="Housing Need" items={[
              { rating: 'Low', range: '0\u20133', meaning: 'Low urgency' },
              { rating: 'Medium', range: '4\u20136', meaning: 'Moderate urgency' },
              { rating: 'High', range: '7\u201310', meaning: 'Priority response needed' },
            ]} current={housingNeedRating} />
            <RatingGuide title="Gross Challenge" items={[
              { rating: 'Low', range: '0\u20135', meaning: 'Manageable' },
              { rating: 'Medium', range: '6\u201312', meaning: 'Structured support needed' },
              { rating: 'High', range: '13+', meaning: 'Intensive support needed' },
            ]} current={grossRating} />
            <RatingGuide title="Residual Challenge" items={[
              { rating: 'Low', range: '0\u20133', meaning: 'Standard housing' },
              { rating: 'Medium', range: '4\u20138', meaning: 'Structured support plan' },
              { rating: 'High', range: '9+', meaning: 'Intensive/supervised' },
            ]} current={residualRating} />
          </div>
        </div>

        {/* Section 2: Accommodation Recommendation */}
        <div>
          <h4 className="font-medium text-slate-200 mb-4">2. Suitable Accommodation Recommendation</h4>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Location Considerations
              <span className="text-xs text-slate-500 ml-2">(informed by Cultural/Community Connections in Part 5)</span>
            </label>
            <input
              type="text"
              value={data.locationConsiderations}
              onChange={(e) => update('locationConsiderations', e.target.value)}
              disabled={isLocked}
              className="w-full px-3 py-2 rounded-lg input-glass"
              placeholder={
                p5.culturalConnections === 'strong' ? 'Essential location requirement - based on strong cultural/community connections'
                : p5.culturalConnections === 'moderate' ? 'Preferred location - based on moderate community ties'
                : p5.culturalConnections === 'limited' ? 'General preference but flexible on location'
                : p5.culturalConnections === 'none' ? 'No location preference - fully flexible'
                : 'Location considerations based on cultural/community connections...'
              }
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-300 mb-2">
              Housing Type: Select Recommended Option <span className="text-red-500">*</span>
            </legend>
            <div className="space-y-2">
              {housingTypeOptions.map((opt) => {
                const isRecommended = recommendedTypes.includes(opt.value);
                return (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                    data.housingType === opt.value
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : isRecommended
                        ? 'border-cyan-500/20 bg-cyan-500/5'
                        : 'border-white/10 hover:bg-white/5'
                  }`}>
                    <input
                      type="radio"
                      name="housingType"
                      value={opt.value}
                      checked={data.housingType === opt.value}
                      onChange={(e) => update('housingType', e.target.value)}
                      disabled={isLocked}
                      className="w-4 h-4 text-cyan-400 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-300">{opt.label}</span>
                      {isRecommended && (
                        <span className="ml-2 text-xs bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded">Recommended</span>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* House Setting */}
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-slate-300 mb-2">
              House Setting <span className="text-red-500">*</span>
              <span className="text-xs text-slate-500 ml-2">(based on Accessibility Needs in Part 5)</span>
            </legend>
            <div className="space-y-2">
              {houseSettingOptions.map((opt) => {
                const isRecommended = opt.value === recommendedSetting;
                return (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                    data.houseSetting === opt.value
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : isRecommended
                        ? 'border-cyan-500/20 bg-cyan-500/5'
                        : 'border-white/10 hover:bg-white/5'
                  }`}>
                    <input
                      type="radio"
                      name="houseSetting"
                      value={opt.value}
                      checked={data.houseSetting === opt.value}
                      onChange={(e) => update('houseSetting', e.target.value)}
                      disabled={isLocked}
                      className="w-4 h-4 text-cyan-400 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-300">{opt.label}</span>
                      {isRecommended && (
                        <span className="ml-2 text-xs bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded">Recommended</span>
                      )}
                      <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-300 mb-1">House Setting Notes</label>
              <textarea
                value={data.houseSettingNotes}
                onChange={(e) => update('houseSettingNotes', e.target.value)}
                disabled={isLocked}
                rows="2"
                className="w-full px-3 py-2 rounded-lg input-glass"
                placeholder="Any additional notes about house setting requirements or adaptations needed..."
              />
            </div>
          </fieldset>
        </div>

        {/* Section 3: Support Plan */}
        <div>
          <h4 className="font-medium text-slate-200 mb-4">3. Support & Challenge Management Plan</h4>
          <p className="text-xs text-slate-500 mb-3">Monitoring frequency should be proportionate to assessed residual risk level.</p>
          <div className="space-y-3">
            <CheckTextField
              label="Tenancy support"
              placeholder="e.g. Fortnightly visits from tenancy support worker"
              checked={data.tenancySupportEnabled}
              onCheck={(v) => update('tenancySupportEnabled', v)}
              value={data.tenancySupport}
              onChange={(v) => update('tenancySupport', v)}
              disabled={isLocked}
            />
            <CheckTextField
              label="Health or addiction services"
              placeholder="e.g. Link with Community Mental Health Team, AOD provider"
              checked={data.healthServicesEnabled}
              onCheck={(v) => update('healthServicesEnabled', v)}
              value={data.healthServices}
              onChange={(v) => update('healthServices', v)}
              disabled={isLocked}
            />
            <CheckTextField
              label="Social or community supports"
              placeholder="e.g. Facilitate connection with local cultural group or iwi"
              checked={data.communitySupportsEnabled}
              onCheck={(v) => update('communitySupportsEnabled', v)}
              value={data.communitySupports}
              onChange={(v) => update('communitySupports', v)}
              disabled={isLocked}
            />
          </div>
        </div>

      </div>

      {!isLocked && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
          <button onClick={() => navigate(`/assessment/${assessment.id}/6`)} className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg">
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

function ScoreCard({ title, source, score, rating, detail, color = 'cyan' }) {
  const ratingColors = {
    High: 'bg-red-500/20 text-red-400',
    Medium: 'bg-yellow-500/20 text-yellow-400',
    Low: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5">
      <div className="text-xs text-slate-500 mb-1">{title} <span className="text-slate-600">({source})</span></div>
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-2xl font-bold ${
            color === 'orange' ? 'text-orange-400' : color === 'purple' ? 'text-purple-400' : 'text-cyan-400'
          }`}>{score}</span>
          <span className="text-xs text-slate-500 ml-2">{detail}</span>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded ${ratingColors[rating] || 'text-slate-400'}`}>
          {rating}
        </span>
      </div>
    </div>
  );
}

function RatingGuide({ title, items, current }) {
  return (
    <div className="p-3 rounded-lg border border-white/5 bg-white/3">
      <div className="text-xs font-medium text-slate-400 mb-2">{title}</div>
      {items.map((item) => (
        <div key={item.rating} className={`text-xs py-0.5 ${current === item.rating ? 'text-slate-200 font-medium' : 'text-slate-600'}`}>
          {item.rating}: {item.range} — {item.meaning}
        </div>
      ))}
    </div>
  );
}

function CheckTextField({ label, placeholder, checked, onCheck, value, onChange, disabled }) {
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
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || !checked}
          rows="2"
          className="w-full px-3 py-2 rounded-lg input-glass"
          placeholder={checked ? placeholder : ''}
        />
      </div>
    </div>
  );
}
