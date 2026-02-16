import { Printer } from 'lucide-react';

const ratingBadge = (rating) => {
  if (!rating) return 'N/A';
  return rating;
};

export default function PrintView({ assessment }) {
  if (!assessment) return null;

  const { formData } = assessment;
  const p1 = formData?.part1 || {};
  const p2 = formData?.part2 || {};
  const p3 = formData?.part3 || {};
  const p4 = formData?.part4 || {};
  const p5 = formData?.part5 || {};
  const p6 = formData?.part6 || {};

  return (
    <div>
      <button
        onClick={() => window.print()}
        className="no-print flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 mb-4"
      >
        <Printer size={16} />
        Print Assessment
      </button>

      <div className="print-view bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold">H.O.M.E.</h1>
          <p className="text-sm text-gray-600">Housing Opportunity & Matching Evaluation</p>
          <p className="text-sm mt-2">Assessment Report</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div><strong>Applicant:</strong> {assessment.applicantName}</div>
          <div><strong>Date:</strong> {p1.dateOfAssessment}</div>
          <div><strong>Assessor:</strong> {p1.assessorName}</div>
        </div>

        {/* Part 1 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3">Part 1: Client Details</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Applicant Name:</strong> {p1.applicantName}</div>
            <div><strong>Date of Assessment:</strong> {p1.dateOfAssessment}</div>
            <div><strong>Assessor Name:</strong> {p1.assessorName}</div>
          </div>
        </section>

        {/* Part 2 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3">Part 2: Housing Need</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Rough Sleeping Duration:</strong> {p2.roughSleepingDuration || 'Not set'}</div>
            <div><strong>Current Housing Status:</strong> {p2.currentHousingStatus || 'Not set'}</div>
            <div><strong>Housing Suitability:</strong> {(p2.housingSuitability || []).join(', ') || 'Not set'}</div>
            <div><strong>Housing Need Summary:</strong> {p2.housingNeedSummary || 'Not provided'}</div>
            <div><strong>Housing Need Rating:</strong> {ratingBadge(p2.housingNeedRating || assessment.housingNeedRating)}</div>
          </div>
        </section>

        {/* Part 3 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3">Part 3: Tenancy Match Suitability</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Anti-social Behaviour:</strong> {p3.antiSocialBehaviour || 'Not set'}</div>
            <div><strong>Criminal History:</strong> {p3.criminalHistory || 'Not set'}</div>
            <div><strong>Gang Affiliations:</strong> {p3.gangAffiliations || 'Not set'}</div>
            <div><strong>Third Party Association:</strong> {p3.thirdPartyAssociation || 'Not set'}</div>
            <div><strong>Property Damage:</strong> {p3.propertyDamage || 'Not set'}</div>
            <div><strong>Rent:</strong> {p3.rent || 'Not set'}</div>
            <div><strong>Physical Health:</strong> {p3.physicalHealth || 'Not set'}</div>
            <div><strong>Mental Health Status:</strong> {p3.mentalHealthStatus || 'Not set'}</div>
            <div><strong>Mental Health Supports:</strong> {p3.mentalHealthSupports || 'Not set'}</div>
            <div><strong>Substance Abuse Status:</strong> {p3.substanceAbuseStatus || 'Not set'}</div>
            <div><strong>Substance Abuse Supports:</strong> {p3.substanceAbuseSupports || 'Not set'}</div>
            <div><strong>Challenge Summary:</strong> {p3.challengeSummary || 'Not provided'}</div>
            <div><strong>Gross Challenge Rating:</strong> {ratingBadge(p3.grossChallengeRating || assessment.grossChallengeRating)}</div>
          </div>
        </section>

        {/* Part 4 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3">Part 4: Tenancy Match Challenge Mitigation</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Support Network:</strong> {p4.supportNetwork || 'Not set'}</div>
            <div><strong>Accessibility Needs:</strong> {p4.accessibilityNeeds || 'Not set'}</div>
            <div><strong>Cultural/Community Connections:</strong> {p4.culturalConnections || 'Not set'}</div>
            <div><strong>Tenant Responsibility:</strong> {p4.tenantResponsibility || 'Not set'}</div>
            <div><strong>Housing Options:</strong> {p4.housingOptions || 'Not set'}</div>
            <div><strong>Mitigation Summary:</strong> {p4.mitigationSummary || 'Not provided'}</div>
            <div><strong>Residual Challenge Rating:</strong> {ratingBadge(p4.residualChallengeRating || assessment.residualChallengeRating)}</div>
          </div>
        </section>

        {/* Part 5 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3">Part 5: Assessment Summary & Recommendations</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Overall Match Challenge:</strong> {ratingBadge(assessment.overallMatchChallenge)}</div>
            <div><strong>Property Type:</strong> {p5.propertyType || 'Not set'}</div>
            <div><strong>Housing Setting:</strong> {p5.housingSetting || 'Not set'}</div>
            <div><strong>Location Considerations:</strong> {p5.locationConsiderations || 'Not set'}</div>
            <div><strong>Tenancy Support:</strong> {p5.tenancySupport || 'Not set'}</div>
            <div><strong>Health Services:</strong> {p5.healthServices || 'Not set'}</div>
            <div><strong>Community Supports:</strong> {p5.communitySupports || 'Not set'}</div>
            <div><strong>Final Recommendation:</strong> {assessment.finalRecommendation || 'Not set'}</div>
            {p5.conditions && <div><strong>Conditions:</strong> {p5.conditions}</div>}
          </div>

          {assessment.professionalJudgementOverride && (
            <div className="mt-4 p-3 border border-gray-400">
              <h3 className="font-bold text-sm mb-2">Professional Judgement Override</h3>
              <div className="text-sm space-y-1">
                <div><strong>Original Score:</strong> {assessment.professionalJudgementOverride.originalScore}</div>
                <div><strong>Adjusted Score:</strong> {assessment.professionalJudgementOverride.adjustedScore}</div>
                <div><strong>Justification:</strong> {assessment.professionalJudgementOverride.justification}</div>
                <div><strong>By:</strong> {assessment.professionalJudgementOverride.assessorName} on {assessment.professionalJudgementOverride.date}</div>
              </div>
            </div>
          )}
        </section>

        {/* Part 6 */}
        <section className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3">Part 6: Approval</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Housing Need:</strong> {ratingBadge(p6.housingNeed)}</div>
            <div><strong>Tenancy Risk:</strong> {ratingBadge(p6.tenancyRisk)}</div>
            <div><strong>Approval Pathway:</strong> {p6.approvalPathway || 'Not set'}</div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="border border-gray-400 p-3">
              <p className="font-bold text-xs mb-2">Senior Manager</p>
              <div className="h-10 border-b border-gray-400 mb-1"></div>
              <p className="text-xs text-gray-500">Signature / Date</p>
            </div>
            <div className="border border-gray-400 p-3">
              <p className="font-bold text-xs mb-2">Manager</p>
              <div className="h-10 border-b border-gray-400 mb-1"></div>
              <p className="text-xs text-gray-500">Signature / Date</p>
            </div>
            <div className="border border-gray-400 p-3">
              <p className="font-bold text-xs mb-2">Frontline Worker</p>
              <div className="h-10 border-b border-gray-400 mb-1"></div>
              <p className="text-xs text-gray-500">Signature / Date</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-black pt-2 mt-8 text-xs text-gray-500 flex justify-between">
          <span>H.O.M.E. Assessment - {assessment.applicantName}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
