import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, 
  ChevronRight, 
  ClipboardList, 
  MapPin, 
  RefreshCw, 
  RotateCcw, 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { complaintApi } from '../api/complaint.api';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import ComplaintHistorySkeleton from '../components/skeletons/ComplaintHistorySkeleton';
import SkeletonTable from '../components/ui/skeleton/SkeletonTable';

const priorityOrder = { High: 3, Medium: 2, Low: 1 };

export default function ComplaintHistory() {
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', sort: 'newest' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const loadComplaints = useCallback(async () => {
    setLoading(true); 
    setError('');
    try {
      const response = await complaintApi.citizenList();
      setAllComplaints(response.data.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadComplaints(); 
  }, [loadComplaints]);

  const options = useMemo(() => ({
    categories: [...new Set(allComplaints.map(({ category }) => category).filter(Boolean))].sort(),
    statuses: [...new Set(allComplaints.map(({ status }) => status).filter(Boolean))].sort(),
    priorities: [...new Set(allComplaints.map(({ priority }) => priority).filter(Boolean))].sort((a, b) => (priorityOrder[b] || 0) - (priorityOrder[a] || 0)),
  }), [allComplaints]);

  const complaints = useMemo(() => allComplaints.filter((complaint) => {
    const searchValue = `${complaint.complaintNumber || ''} ${complaint.title || ''} ${complaint.category || ''} ${complaint.location?.address || ''}`.toLowerCase();
    return (!deferredSearch || searchValue.includes(deferredSearch)) && 
           (!filters.status || complaint.status === filters.status) && 
           (!filters.priority || complaint.priority === filters.priority) && 
           (!filters.category || complaint.category === filters.category);
  }).sort((first, second) => {
    if (filters.sort === 'oldest') return new Date(first.createdAt) - new Date(second.createdAt);
    if (filters.sort === 'priority-high') return (priorityOrder[second.priority] || 0) - (priorityOrder[first.priority] || 0);
    if (filters.sort === 'priority-low') return (priorityOrder[first.priority] || 0) - (priorityOrder[second.priority] || 0);
    return new Date(second.createdAt) - new Date(first.createdAt);
  }), [allComplaints, deferredSearch, filters]);

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const reset = () => { 
    setSearch(''); 
    setFilters({ status: '', priority: '', category: '', sort: 'newest' }); 
  };

  if (loading && allComplaints.length === 0) {
    return <ComplaintHistorySkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Page Header */}
      <header className="flex flex-col gap-4 rounded-card border border-slate-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-primary font-outfit uppercase tracking-wider">Citizen Services</p>
          <h1 className="mt-1 font-outfit text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-slate-805 leading-snug">My Reports</h1>
          <p className="mt-1 text-[10px] text-slate-450 leading-normal">Search and monitor every civic issue you have submitted.</p>
        </div>
        <Link 
          to="/citizen/report" 
          className="inline-flex items-center justify-center gap-1.5 rounded-button bg-primary text-white h-11 px-4.5 text-xs font-bold shadow-premium hover:bg-primary-dark transition select-none cursor-pointer text-center w-full sm:w-auto"
        >
          <ClipboardList className="h-4 w-4 shrink-0" /> 
          Report Civic Issue
        </Link>
      </header>

      {/* Filter Section */}
      <section className="rounded-card border border-slate-150 bg-white p-3.5 shadow-soft w-full min-w-0 space-y-3">
        {/* Search Bar + Mobile Filter Trigger */}
        <div className="flex gap-2 w-full min-w-0">
          <label className="relative flex-grow min-w-0">
            <span className="sr-only">Search reports</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder="Search ID, issue, or location" 
              className="w-full h-10 rounded-button border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15" 
            />
          </label>
          
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 h-10 px-3.5 rounded-button text-xs font-bold transition select-none cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-450 shrink-0" />
            <span>Filters</span>
            {filtersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Select Filters list */}
        <div className={`gap-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] w-full min-w-0 ${
          filtersOpen ? 'grid grid-cols-1 sm:grid-cols-2' : 'hidden lg:grid'
        }`}>
          <Select value={filters.status} onChange={(value) => updateFilter('status', value)} label="Status" options={options.statuses} />
          <Select value={filters.priority} onChange={(value) => updateFilter('priority', value)} label="Priority" options={options.priorities} />
          <Select value={filters.category} onChange={(value) => updateFilter('category', value)} label="Category" options={options.categories} />
          
          <Select 
            value={filters.sort} 
            onChange={(value) => updateFilter('sort', value)} 
            label="Sort" 
            options={[
              ['newest', 'Newest first'], 
              ['oldest', 'Oldest first'], 
              ['priority-high', 'Priority: High to Low'], 
              ['priority-low', 'Priority: Low to High']
            ]} 
          />

          <button 
            onClick={reset} 
            className="inline-flex items-center justify-center gap-2 rounded-button bg-slate-50 border border-slate-200 h-10 px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-100 cursor-pointer select-none"
          >
            <RotateCcw className="h-4 w-4 shrink-0" /> 
            Reset
          </button>
        </div>
      </section>

      {/* Main Listing Viewport */}
      {error ? (
        <ErrorState message={error} retry={loadComplaints} />
      ) : loading ? (
        <LoadingState />
      ) : (
        <div className="w-full min-w-0 space-y-3">
          <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider">
            <span className="font-extrabold text-slate-808 font-outfit">{complaints.length}</span> {complaints.length === 1 ? 'report' : 'reports'} submitted
          </p>

          {complaints.length ? (
            <>
              {/* Desktop view Grid Table */}
              <div className="hidden md:block overflow-x-auto rounded-card border border-slate-150 bg-white shadow-soft w-full min-w-0">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-150">
                    <tr>
                      <th className="px-4 py-3.5">Report details</th>
                      <th className="px-3 py-3.5">Category</th>
                      <th className="px-3 py-3.5">Priority</th>
                      <th className="px-3 py-3.5">Status</th>
                      <th className="px-3 py-3.5">Routing Assignment</th>
                      <th className="px-3 py-3.5">Submitted</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {complaints.map((complaint) => (
                      <tr key={complaint._id} className="transition hover:bg-slate-50/50">
                        <td className="max-w-xs px-4 py-3.5">
                          <Link to={`/citizen/complaints/${complaint._id}`} className="block min-w-0">
                            <p className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border px-1.5 py-0.25 rounded inline-block">
                              #{complaint.complaintNumber || complaint._id.slice(-6).toUpperCase()}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-800 line-clamp-1 break-words">{complaint.title}</p>
                            <p className="mt-0.5 text-[10px] text-slate-450 line-clamp-1 break-words">{complaint.location?.address || 'Location being verified'}</p>
                          </Link>
                        </td>
                        <td className="px-3 py-3.5 font-bold text-slate-600 truncate">{complaint.category}</td>
                        <td className="px-3 py-3.5 select-none"><ComplaintPriorityBadge priority={complaint.priority} /></td>
                        <td className="px-3 py-3.5 select-none"><ComplaintStatusBadge status={complaint.status} /></td>
                        <td className="max-w-xs px-3 py-3.5 min-w-0">
                          <p className="font-bold text-slate-600 truncate">{complaint.assignment?.department?.name || 'Awaiting Routing'}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400 truncate">{complaint.assignment?.worker?.fullName || 'Unassigned'}</p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-slate-450 font-medium">
                          {new Date(complaint.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                        <td className="px-4 py-3.5 text-right select-none">
                          <Link to={`/citizen/complaints/${complaint._id}`} className="inline-flex items-center gap-0.5 text-xs font-bold text-primary hover:underline">
                            View <ChevronRight className="h-4 w-4 shrink-0" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View responsive Stack cards */}
              <div className="space-y-3 md:hidden w-full min-w-0">
                {complaints.map((complaint) => (
                  <MobileReport key={complaint._id} complaint={complaint} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState filtered={Boolean(search || filters.status || filters.priority || filters.category)} reset={reset} />
          )}
        </div>
      )}

    </div>
  );
}

function Select({ value, onChange, label, options }) { 
  const values = options.map((option) => Array.isArray(option) ? option : [option, option]); 
  
  return (
    <label className="relative block w-full min-w-0">
      <span className="sr-only">{label}</span>
      <select 
        value={value} 
        onChange={(event) => onChange(event.target.value)} 
        className="w-full h-10 rounded-button border border-slate-200 bg-slate-50 px-3 pr-8 text-xs font-bold text-slate-605 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        <option value="">All {label}s</option>
        {values.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
      <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 shrink-0" />
    </label>
  ); 
}

function MobileReport({ complaint }) { 
  return (
    <Link 
      to={`/citizen/complaints/${complaint._id}`} 
      className="block rounded-card border border-slate-200 bg-white p-3.5 shadow-soft w-full min-w-0"
    >
      <div className="flex gap-3 w-full min-w-0">
        {/* Aspect ratio frame with cover sizing */}
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-50 border relative">
          {complaint.complaintImages?.[0]?.url ? (
            <img src={complaint.complaintImages[0].url} alt="" className="h-full w-full object-cover" />
          ) : (
            <MapPin className="h-5 w-5 text-slate-300" />
          )}
        </div>
        
        <div className="min-w-0 flex-grow w-full">
          <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border px-1.5 py-0.25 rounded inline-block">
            #{complaint.complaintNumber || complaint._id.slice(-6).toUpperCase()}
          </span>
          <h3 className="mt-1 text-xs font-bold text-slate-808 line-clamp-1 break-words">{complaint.title}</h3>
          
          <p className="mt-1 flex items-start gap-1 text-[10px] text-slate-450 leading-tight">
            <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="line-clamp-2 break-words">{complaint.location?.address || 'Location being verified'}</span>
          </p>
        </div>
      </div>
      
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 select-none">
        <ComplaintPriorityBadge priority={complaint.priority} />
        <ComplaintStatusBadge status={complaint.status} />
        <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-bold text-primary">
          Details <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        </span>
      </div>
    </Link>
  ); 
}

function LoadingState() { 
  return (
    <>
      {/* Desktop view Table Skeleton */}
      <div className="hidden md:block w-full">
        <SkeletonTable rows={5} cols={7} />
      </div>

      {/* Mobile view Card Skeleton List */}
      <div className="md:hidden space-y-3 w-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-card p-4 animate-pulse motion-reduce:animate-none space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-3.5 w-16 bg-slate-200 rounded" />
              <div className="h-5 w-12 bg-slate-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-3 w-1/3 bg-slate-200 rounded" />
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded" />
            <div className="pt-2 border-t flex justify-end">
              <div className="h-8 w-16 bg-slate-200 rounded-button" />
            </div>
          </div>
        ))}
      </div>
    </>
  ); 
}

function EmptyState({ filtered, reset }) { 
  return (
    <section className="rounded-card border border-slate-150 bg-white p-10 text-center shadow-soft w-full min-w-0">
      <AlertCircle className="mx-auto h-9 w-9 text-slate-300 animate-pulse" />
      <h2 className="mt-3 font-outfit text-sm sm:text-base font-bold text-slate-805">
        {filtered ? 'No matching reports found' : 'No reports filed'}
      </h2>
      <p className="mt-1 text-xs text-slate-450 leading-normal max-w-sm mx-auto">
        {filtered ? 'Try changing or clearing some of the filters.' : 'When you report a street issue, it will be mapped and managed from here.'}
      </p>
      {filtered ? (
        <button onClick={reset} className="mt-4 text-xs font-bold text-primary hover:underline uppercase tracking-wider font-outfit">
          Clear Filters
        </button>
      ) : (
        <Link 
          to="/citizen/report" 
          className="mt-4 inline-flex justify-center items-center bg-primary text-white h-10 px-5 rounded-button text-xs font-bold shadow-soft hover:bg-primary-dark transition"
        >
          Report civic issue
        </Link>
      )}
    </section>
  ); 
}

function ErrorState({ message, retry }) { 
  return (
    <section className="rounded-card border border-red-100 bg-white p-8 text-center shadow-soft w-full min-w-0">
      <AlertCircle className="mx-auto h-9 w-9 text-danger" />
      <h2 className="mt-3 font-outfit text-sm font-bold text-slate-805">Reports could not be loaded</h2>
      <p className="mt-1 text-xs text-slate-500 leading-normal">{message}</p>
      <button 
        onClick={retry} 
        className="mt-4 inline-flex items-center gap-2 rounded-button bg-primary px-4 py-2 h-10 text-xs font-bold text-white shadow-soft transition cursor-pointer select-none"
      >
        <RefreshCw className="h-4 w-4 shrink-0" /> 
        Try again
      </button>
    </section>
  ); 
}
