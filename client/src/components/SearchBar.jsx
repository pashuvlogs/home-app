import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function SearchBar({ onSearch, showAssessorFilter = false }) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    risk: '',
    dateFrom: '',
    dateTo: '',
    assessor: '',
  });

  function handleSearch(e) {
    e?.preventDefault();
    onSearch({ q: query, ...filters });
  }

  function clearFilters() {
    setFilters({ status: '', risk: '', dateFrom: '', dateTo: '', assessor: '' });
    setQuery('');
    onSearch({});
  }

  const hasActiveFilters = Object.values(filters).some(Boolean) || query;

  return (
    <div className="glass rounded-xl p-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by applicant name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg input-glass"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 rounded-lg flex items-center gap-1 transition-all ${
            showFilters ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'btn-ghost'
          }`}
        >
          <Filter size={16} />
          Filters
        </button>
        <button type="submit" className="px-4 py-2 btn-neon rounded-lg">
          Search
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="px-3 py-2 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        )}
      </form>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-white/10">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full text-sm rounded-lg px-2 py-1.5 input-glass">
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="pending_manager">Pending Manager</option>
              <option value="pending_senior">Pending Senior</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="deferred">Deferred</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Risk Level</label>
            <select value={filters.risk} onChange={(e) => setFilters({ ...filters, risk: e.target.value })} className="w-full text-sm rounded-lg px-2 py-1.5 input-glass">
              <option value="">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full text-sm rounded-lg px-2 py-1.5 input-glass" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="w-full text-sm rounded-lg px-2 py-1.5 input-glass" />
          </div>
          {showAssessorFilter && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Assessor</label>
              <input type="text" placeholder="Assessor name" value={filters.assessor} onChange={(e) => setFilters({ ...filters, assessor: e.target.value })} className="w-full text-sm rounded-lg px-2 py-1.5 input-glass" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
