import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { savePart, searchAssessments } from '../../api/client';
import { useAutoSave } from '../../hooks/useAutoSave';
import { Save, ArrowRight, Search } from 'lucide-react';

export default function Part1ClientDetails() {
  const { assessment, loadAssessment, isLocked } = useOutletContext();
  const navigate = useNavigate();
  const part = assessment.formData?.part1 || {};

  const [data, setData] = useState({
    applicantName: part.applicantName || assessment.applicantName || '',
    dateOfAssessment: part.dateOfAssessment || new Date().toISOString().split('T')[0],
    assessorName: part.assessorName || '',
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useAutoSave(assessment.id, 1, data, !isLocked);

  function update(field, value) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(andContinue = false) {
    setSaving(true);
    try {
      await savePart(assessment.id, 1, data);
      await loadAssessment();
      if (andContinue) navigate(`/assessment/${assessment.id}/2`);
    } catch (err) {
      console.error('Save failed:', err);
    }
    setSaving(false);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      const res = await searchAssessments({ q: searchQuery });
      setSearchResults(res.data.filter((a) => a.id !== assessment.id));
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-6">Part 1: Client Details</h3>

      <div className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Applicant Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.applicantName}
            onChange={(e) => update('applicantName', e.target.value)}
            disabled={isLocked}
            className="w-full px-3 py-2 rounded-lg input-glass"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Date of Assessment <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={data.dateOfAssessment}
            onChange={(e) => update('dateOfAssessment', e.target.value)}
            disabled={isLocked}
            className="w-full px-3 py-2 rounded-lg input-glass"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Assessor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.assessorName}
            onChange={(e) => update('assessorName', e.target.value)}
            disabled={isLocked}
            className="w-full px-3 py-2 rounded-lg input-glass"
          />
        </div>

        {/* Existing Assessment Search */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Check for Existing Assessments
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by applicant name..."
              className="flex-1 px-3 py-2 rounded-lg input-glass"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="px-3 py-2 btn-ghost rounded-lg">
              <Search size={16} />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 border border-white/10 rounded-lg divide-y divide-white/10 text-sm">
              {searchResults.map((r) => (
                <div key={r.id} className="px-3 py-2 flex justify-between items-center hover:bg-white/5">
                  <div>
                    <span className="font-medium text-slate-200">{r.applicantName}</span>
                    <span className="text-slate-500 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs ml-2 text-slate-500">{r.status}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/assessment/${r.id}/1`)}
                    className="text-cyan-400 hover:underline text-xs"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isLocked && (
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 btn-neon rounded-lg disabled:opacity-50"
          >
            Save & Continue <ArrowRight size={16} />
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 btn-ghost rounded-lg disabled:opacity-50"
          >
            <Save size={16} /> Save Draft
          </button>
        </div>
      )}
    </div>
  );
}
