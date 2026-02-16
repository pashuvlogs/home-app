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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Part 1: Client Details</h3>

      <div className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Applicant Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.applicantName}
            onChange={(e) => update('applicantName', e.target.value)}
            disabled={isLocked}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Assessment <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={data.dateOfAssessment}
            onChange={(e) => update('dateOfAssessment', e.target.value)}
            disabled={isLocked}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.assessorName}
            onChange={(e) => update('assessorName', e.target.value)}
            disabled={isLocked}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        {/* Existing Assessment Search */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check for Existing Assessments
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by applicant name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">
              <Search size={16} />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg divide-y text-sm">
              {searchResults.map((r) => (
                <div key={r.id} className="px-3 py-2 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <span className="font-medium">{r.applicantName}</span>
                    <span className="text-gray-500 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs ml-2 text-gray-400">{r.status}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/assessment/${r.id}/1`)}
                    className="text-blue-600 hover:underline text-xs"
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
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save & Continue <ArrowRight size={16} />
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Save size={16} /> Save Draft
          </button>
        </div>
      )}
    </div>
  );
}
