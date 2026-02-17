import { Printer } from 'lucide-react';

const roughSleepingLabels = {
  housed_at_risk: 'Housed but at risk of rough sleeping',
  episodic_under_3m: 'Episodic rough sleeping (< 3 months)',
  chronic_3_12m: 'Chronic rough sleeping (3–12 months)',
  long_term_over_12m: 'Long-term rough sleeping (> 12 months)',
  not_applicable: 'Not applicable',
};

const housingStatusLabels = {
  stable_temporary: 'Stable temporary accommodation',
  unstable_temporary: 'Unstable temporary accommodation',
  emergency: 'Emergency accommodation',
  overcrowding: 'Overcrowding',
  couch_surfing: 'Couch surfing',
  unsuitable: 'Unsuitable current housing',
};

const antiSocialLabels = {
  positive_history: 'Positive history / no previous tenancy',
  minor_resolved: 'Minor issues resolved',
  eviction_mitigating: 'Eviction(s) with mitigating factors',
  multiple_evictions: 'Multiple evictions',
  neighbour_disputes: 'Neighbour disputes',
};

const criminalLabels = {
  no_concerns: 'No concerns',
  historical_resolved: 'Historical concerns, now resolved',
  intimidation_assault: 'Intimidation / assault',
  violence: 'Violence',
  drug_related: 'Drug related',
};

const gangLabels = {
  no_concerns: 'No concerns',
  historical_resolved: 'Historical concerns, now resolved',
  recent_association: 'Recent gang association',
  gang_member: 'Gang member',
};

const thirdPartyLabels = {
  no_concerns: 'No concerns',
  historical_resolved: 'Historical concerns, now resolved',
  potential_concern: 'Potential concern',
  known_concern: 'Known concern',
};

const propertyDamageLabels = {
  no_damage: 'No damage history',
  minor_resolved: 'Damage history — minor / one-off resolved',
  serious_repeated: 'Damage history — serious or repeated',
  damage_arrears: 'Damage arrears',
};

const rentLabels = {
  no_concerns: 'No concerns',
  rent_arrears: 'Rent arrears history',
};

const tenantResponsibilityLabels = {
  strong: 'Strong responsibility',
  moderate: 'Moderate responsibility',
  limited: 'Limited responsibility',
  no_capacity: 'No responsibility capacity currently',
};

const physicalHealthLabels = {
  no_significant: 'No significant needs',
  managed_chronic: 'Managed chronic condition',
  multiple_poorly_managed: 'Multiple / poorly managed conditions',
  acute_hospital: 'Acute / hospital-level needs',
};

const mentalHealthLabels = {
  no_concerns: 'No concerns',
  diagnosed_stable: 'Diagnosed but stable',
  active_challenges: 'Active challenges',
  co_occurring: 'Co-occurring disorders',
};

const substanceAbuseLabels = {
  no_concerns: 'No concerns',
  diagnosed_stable: 'Diagnosed but stable',
  active_challenges: 'Active challenges',
  co_occurring: 'Co-occurring disorders',
};

const supportNetworkLabels = {
  strong: 'Strong support — active family/whānau/friends and/or engaged caseworker',
  moderate: 'Moderate support — some connections or occasional service engagement',
  minimal: 'Minimal support — limited connections, sporadic contact with services',
  none: 'No support — completely isolated',
};

const accessibilityLabels = {
  none: 'No accessibility needs',
  minor: 'Minor accessibility needs — requires minor adaptations',
  significant: 'Significant accessibility needs — requires wheelchair access, ground floor',
  severe: 'Severe accessibility needs — requires purpose-built accessible housing',
};

const culturalLabels = {
  strong: 'Strong connections — essential location requirement',
  moderate: 'Moderate connections — strong preference for certain locations',
  limited: 'Limited connections — general preference, flexible',
  none: 'No connections — fully flexible about location',
};

const housingTypeLabels = {
  standalone: 'Stand-alone housing',
  complex_2_10: 'Housing complex (2–10 properties)',
  complex_11_20: 'Housing complex (11–20 properties)',
  complex_20_plus: 'Housing complex (20+ properties)',
  institutional: 'Institutional housing',
};

const houseSettingLabels = {
  standard: 'Standard property',
  minor_adaptations: 'Minor adaptations',
  wheelchair_accessible: 'Wheelchair accessible / ground floor',
  purpose_built: 'Purpose-built accessible',
};

const recommendationLabels = {
  proceed_without_conditions: 'Proceed with housing allocation without conditions',
  proceed_with_conditions: 'Proceed with housing allocation with conditions',
  defer: 'Defer allocation pending further supports or approvals',
  decline: 'Decline allocation',
};

function lbl(map, value) {
  if (!value) return 'Not set';
  return map[value] || value;
}

export default function PrintView({ assessment }) {
  if (!assessment) return null;

  const { formData } = assessment;
  const p1 = formData?.part1 || {};
  const p2 = formData?.part2 || {};
  const p3 = formData?.part3 || {};
  const p4 = formData?.part4 || {};
  const p5 = formData?.part5 || {};
  const p6 = formData?.part6 || {};
  const p7 = formData?.part7 || {};
  const p8 = formData?.part8 || {};

  const finalRecommendation = p8.finalRecommendation || p7.finalRecommendation;
  const conditions = p8.conditions || p7.conditions;
  const overrideData = assessment.professionalJudgementOverride;

  const s = {
    section: { marginBottom: '20px' },
    h2: { fontSize: '13pt', fontWeight: 'bold', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '10px', color: '#000' },
    table: { width: '100%', fontSize: '10pt', borderCollapse: 'collapse' },
    scoreTable: { width: '100%', fontSize: '10pt', borderCollapse: 'collapse', border: '1px solid #999', marginBottom: '12px' },
    th: { padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #999', background: '#f0f0f0', color: '#000' },
    thCenter: { padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #999', width: '80px', background: '#f0f0f0', color: '#000' },
    td: { padding: '6px 10px', borderBottom: '1px solid #ddd', color: '#000' },
    tdCenter: { padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #ddd', color: '#000' },
    tdBold: { padding: '6px 10px', textAlign: 'center', borderBottom: '1px solid #999', fontWeight: 'bold', color: '#000' },
    totalRow: { background: '#f0f0f0' },
  };

  return (
    <div>
      <button
        onClick={() => window.print()}
        className="no-print flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 mb-4"
      >
        <Printer size={16} />
        Print Assessment
      </button>

      <div className="print-view bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif', color: '#000' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead className="print-header-repeat">
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 0', borderBottom: '2px solid #000', fontWeight: 'normal' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '14pt', color: '#000' }}>ACCOMMODATION APPLICANT MATCHING ASSESSMENT</strong>
                    <br />
                    <span style={{ fontSize: '9pt', color: '#555' }}>Version 1.0 — Integrated Scoring System</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '9pt', color: '#555' }}>
                    <div>Applicant: <strong style={{ color: '#000' }}>{assessment.applicantName}</strong></div>
                    <div>Date: {p1.dateOfAssessment || 'N/A'}</div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: '0' }}>

        {/* Overview */}
        <div style={{ display: 'flex', gap: '24px', margin: '16px 0', fontSize: '10pt', borderBottom: '1px solid #ccc', paddingBottom: '12px', color: '#000' }}>
          <div><strong>Applicant:</strong> {assessment.applicantName}</div>
          <div><strong>Assessor:</strong> {p1.assessorName}</div>
          <div><strong>Date:</strong> {p1.dateOfAssessment}</div>
        </div>

        {/* Part 1 */}
        <section style={s.section}>
          <h2 style={s.h2}>Part 1: Client Details</h2>
          <table style={s.table}><tbody>
            <Row l="Applicant Name" v={p1.applicantName} />
            <Row l="Date of Birth" v={p1.dateOfBirth || 'Not provided'} />
            <Row l="Gender" v={p1.gender || 'Not provided'} />
            <Row l="Phone Number" v={p1.phoneNumber || 'Not provided'} />
            <Row l="Date of Assessment" v={p1.dateOfAssessment} />
            <Row l="Assessor Name" v={p1.assessorName} />
          </tbody></table>
        </section>

        {/* Part 2 */}
        <section style={s.section}>
          <h2 style={s.h2}>Part 2: Housing Need Urgency</h2>
          <table style={s.table}><tbody>
            <Row l="Rough Sleeping Duration" v={lbl(roughSleepingLabels, p2.roughSleepingDuration)} />
            <Row l="Current Housing Status" v={lbl(housingStatusLabels, p2.currentHousingStatus)} />
            <Row l="Housing Need Score" v={p2.housingNeedScore ?? 'N/A'} />
            <Row l="Housing Need Rating" v={p2.housingNeedRating || 'N/A'} b />
            {p2.sectionNotes && <Row l="Notes" v={p2.sectionNotes} />}
          </tbody></table>
        </section>

        {/* Part 3 */}
        <section style={s.section}>
          <h2 style={s.h2}>Part 3: Tenancy Challenge</h2>
          <table style={s.table}><tbody>
            <Row l="Anti-Social Behaviour" v={lbl(antiSocialLabels, p3.antiSocialBehaviour)} sc={p3.categoryScores?.antiSocialBehaviour} />
            <Row l="Criminal History" v={lbl(criminalLabels, p3.criminalHistory)} sc={p3.categoryScores?.criminalHistory} />
            <Row l="Gang Affiliations" v={lbl(gangLabels, p3.gangAffiliations)} sc={p3.categoryScores?.gangAffiliations} />
            <Row l="Third Party Association" v={lbl(thirdPartyLabels, p3.thirdPartyAssociation)} sc={p3.categoryScores?.thirdPartyAssociation} />
            <Row l="Property Damage" v={lbl(propertyDamageLabels, p3.propertyDamage)} sc={p3.categoryScores?.propertyDamage} />
            <Row l="Rent" v={lbl(rentLabels, p3.rent)} sc={p3.categoryScores?.rent} />
            <Row l="Tenant Responsibility" v={lbl(tenantResponsibilityLabels, p3.tenantResponsibility)} sc={p3.categoryScores?.tenantResponsibility} />
            <Row l="Tenancy Challenge Score" v={p3.tenancyChallengeScore ?? 'N/A'} b />
            {p3.sectionNotes && <Row l="Notes" v={p3.sectionNotes} />}
          </tbody></table>
        </section>

        {/* Part 4 */}
        <section style={s.section}>
          <h2 style={s.h2}>Part 4: Health & Wellbeing Needs</h2>
          <table style={s.table}><tbody>
            <Row l="Physical Health" v={lbl(physicalHealthLabels, p4.physicalHealth)} sc={p4.categoryScores?.physicalHealth} />
            <Row l="Mental Health" v={lbl(mentalHealthLabels, p4.mentalHealth)} sc={p4.categoryScores?.mentalHealth} />
            <Row l="Substance Abuse" v={lbl(substanceAbuseLabels, p4.substanceAbuse)} sc={p4.categoryScores?.substanceAbuse} />
            <Row l="Health & Wellbeing Score" v={p4.healthWellbeingScore ?? 'N/A'} b />
            {p4.sectionNotes && <Row l="Notes" v={p4.sectionNotes} />}
          </tbody></table>
        </section>

        {/* Part 5 */}
        <section style={s.section}>
          <h2 style={s.h2}>Part 5: Support Networks (Mitigation)</h2>
          <table style={s.table}><tbody>
            <Row l="Support Network" v={lbl(supportNetworkLabels, p5.supportNetwork)} sc={p5.categoryScores?.supportNetwork} />
            <Row l="Accessibility Needs" v={lbl(accessibilityLabels, p5.accessibilityNeeds)} sc={p5.categoryScores?.accessibilityNeeds} />
            <Row l="Cultural/Community" v={lbl(culturalLabels, p5.culturalConnections)} sc={p5.categoryScores?.culturalConnections} />
            <Row l="Total Mitigation Score" v={p5.mitigationScore ?? 'N/A'} b />
            {p5.sectionNotes && <Row l="Notes" v={p5.sectionNotes} />}
          </tbody></table>
        </section>

        {/* Part 6 - Additional Info */}
        <section style={s.section}>
          <h2 style={s.h2}>Additional Information</h2>
          {p6.immediateNeeds || p6.strengthsResilience || p6.mitigatingFactors || p6.supportAgencies ? (
            <table style={s.table}><tbody>
              {p6.immediateNeeds && <Row l="Immediate Needs" v={p6.immediateNeeds} />}
              {p6.strengthsResilience && <Row l="Strengths & Resilience" v={p6.strengthsResilience} />}
              {p6.mitigatingFactors && <Row l="Mitigating Factors" v={p6.mitigatingFactors} />}
              {p6.supportAgencies && <Row l="Support Agencies" v={p6.supportAgencies} />}
            </tbody></table>
          ) : (
            <p style={{ fontSize: '10pt', color: '#666' }}>No additional information provided</p>
          )}
        </section>

        {/* Part 7 - Summary */}
        <section style={s.section}>
          <h2 style={s.h2}>Assessment Summary</h2>
          <table style={s.scoreTable}>
            <thead>
              <tr>
                <th style={s.th}>Measure</th>
                <th style={s.thCenter}>Score</th>
                <th style={s.thCenter}>Rating</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={s.td}>Housing Need (Part 2)</td>
                <td style={s.tdCenter}>{p7.housingNeedScore ?? 'N/A'}</td>
                <td style={{ ...s.tdCenter, fontWeight: 'bold' }}>{p7.housingNeedRating || 'N/A'}</td>
              </tr>
              <tr>
                <td style={s.td}>Gross Suitability Challenge (Parts 3+4)</td>
                <td style={s.tdCenter}>{p7.grossChallengeScore ?? 'N/A'}</td>
                <td style={{ ...s.tdCenter, fontWeight: 'bold' }}>{p7.grossChallengeRating || 'N/A'}</td>
              </tr>
              <tr>
                <td style={s.td}>Total Mitigation (Part 5)</td>
                <td style={s.tdCenter}>{p7.mitigationScore ?? 'N/A'}</td>
                <td style={s.tdCenter}>—</td>
              </tr>
              <tr style={s.totalRow}>
                <td style={{ ...s.td, fontWeight: 'bold', borderBottom: '1px solid #999' }}>Residual Suitability Challenge</td>
                <td style={s.tdBold}>{p7.residualScore ?? 'N/A'}</td>
                <td style={s.tdBold}>{p7.residualChallengeRating || 'N/A'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ border: '2px solid #000', padding: '10px', textAlign: 'center', marginBottom: '12px', color: '#000' }}>
            <strong>Overall Assessment: </strong>
            <span style={{ fontSize: '13pt', fontWeight: 'bold' }}>{p7.overallMatchChallenge || assessment.overallMatchChallenge || 'N/A'}</span>
          </div>

          <table style={s.table}><tbody>
            <Row l="Housing Type" v={lbl(housingTypeLabels, p7.housingType)} />
            <Row l="House Setting" v={lbl(houseSettingLabels, p7.houseSetting)} />
            {p7.houseSettingNotes && <Row l="House Setting Notes" v={p7.houseSettingNotes} />}
            <Row l="Location" v={p7.locationConsiderations || 'Not specified'} />
            {p7.tenancySupportEnabled && <Row l="Tenancy Support" v={p7.tenancySupport || 'Enabled'} />}
            {p7.healthServicesEnabled && <Row l="Health Services" v={p7.healthServices || 'Enabled'} />}
            {p7.communitySupportsEnabled && <Row l="Community Supports" v={p7.communitySupports || 'Enabled'} />}
          </tbody></table>
        </section>

        {/* Part 8 - Approval */}
        <section style={s.section}>
          <h2 style={s.h2}>Part 6: Next Steps & Approval</h2>
          <table style={s.table}><tbody>
            <Row l="Recommendation" v={lbl(recommendationLabels, finalRecommendation)} b />
            {conditions && <Row l="Conditions" v={conditions} />}
            <Row l="Housing Need Rating" v={p8.housingNeed || p7.housingNeedRating || 'N/A'} />
            <Row l="Residual Challenge" v={p8.tenancyRisk || p7.residualChallengeRating || 'N/A'} />
            <Row l="Approval Pathway" v={
              p8.approvalPathway === 'High' ? 'Senior Manager Approval Required'
              : p8.approvalPathway === 'Medium' ? 'Manager Approval Required'
              : p8.approvalPathway === 'Low' ? 'Frontline Approval'
              : p8.approvalPathway || 'Not set'
            } b />
          </tbody></table>

          {overrideData && (
            <div style={{ border: '1px solid #666', padding: '10px', marginTop: '12px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6px', color: '#000' }}>Professional Judgement Override</h3>
              <table style={s.table}><tbody>
                <Row l="Original Score" v={overrideData.originalScore} />
                <Row l="Adjusted Score" v={overrideData.adjustedScore} />
                <Row l="Justification" v={overrideData.justification} />
                <Row l="Override By" v={`${overrideData.assessorName} on ${overrideData.date ? new Date(overrideData.date).toLocaleDateString('en-GB') : 'N/A'}`} />
              </tbody></table>
            </div>
          )}

          {(() => {
            const approver = assessment.approver;
            const isApproved = assessment.status === 'approved';
            const approvalDate = assessment.lockedAt ? new Date(assessment.lockedAt).toLocaleDateString('en-GB') : '';
            const pathway = p8.approvalPathway;

            const roleMap = {
              assessor: 'Frontline Worker',
              manager: 'Manager',
              senior_manager: 'Senior Manager',
            };
            const approverRole = approver ? (roleMap[approver.role] || approver.role) : '';

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  {[
                    { label: 'Senior Manager', active: pathway === 'High' },
                    { label: 'Manager', active: pathway === 'Medium' },
                    { label: 'Frontline Worker', active: pathway === 'Low' },
                  ].map(({ label, active }) => {
                    const isApproverBox = isApproved && approver && (
                      (label === 'Senior Manager' && approver.role === 'senior_manager') ||
                      (label === 'Manager' && approver.role === 'manager') ||
                      (label === 'Frontline Worker' && approver.role === 'assessor')
                    );

                    return (
                      <div key={label} style={{ border: active ? '2px solid #000' : '1px solid #999', padding: '10px', background: active ? '#f9f9f9' : 'transparent' }}>
                        <p style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '4px', color: '#000' }}>{label}</p>
                        {isApproverBox ? (
                          <>
                            <div style={{ height: '30px', borderBottom: '1px solid #999', marginBottom: '4px', display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                              <span style={{ fontSize: '10pt', color: '#000', fontWeight: 'bold' }}>{approver.fullName}</span>
                            </div>
                            <p style={{ fontSize: '8pt', color: '#000' }}>Approved: {approvalDate}</p>
                          </>
                        ) : (
                          <>
                            <div style={{ height: '30px', borderBottom: '1px solid #999', marginBottom: '4px' }}></div>
                            <p style={{ fontSize: '8pt', color: '#666' }}>{active && !isApproved ? 'Pending approval' : 'Signature / Date'}</p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isApproved && (
                  <div style={{ marginTop: '12px', padding: '8px', border: '2px solid #000', textAlign: 'center', fontSize: '11pt', fontWeight: 'bold', color: '#000' }}>
                    APPROVED — {approver?.fullName || 'Unknown'} ({approverRole}) — {approvalDate}
                  </div>
                )}
              </>
            );
          })()}
        </section>

        {/* Footer */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '6px', marginTop: '24px', fontSize: '8pt', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
          <span>Accommodation Applicant Matching Assessment — {assessment.applicantName}</span>
          <span>Generated: {new Date().toLocaleDateString('en-GB')}</span>
        </div>

            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ l, v, b, sc }) {
  return (
    <tr>
      <td style={{ padding: '4px 8px', fontWeight: 'bold', verticalAlign: 'top', width: '200px', borderBottom: '1px solid #eee', color: '#000' }}>
        {l}
      </td>
      <td style={{ padding: '4px 8px', borderBottom: '1px solid #eee', fontWeight: b ? 'bold' : 'normal', color: '#000' }}>
        {v}
        {sc !== undefined && sc !== null && (
          <span style={{ marginLeft: '8px', fontSize: '9pt', color: '#666', border: '1px solid #ccc', padding: '1px 6px', borderRadius: '3px', background: '#f5f5f5' }}>
            {sc > 0 ? '+' : ''}{sc}
          </span>
        )}
      </td>
    </tr>
  );
}
