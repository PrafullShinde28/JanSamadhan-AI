import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { 
  Loader2, 
  AlertCircle, 
  Search, 
  Building2, 
  ArrowLeft,
  Star,
  CheckCircle,
  Briefcase,
  X,
  RefreshCw,
  Inbox,
  Mail,
  Phone,
  ShieldCheck
} from 'lucide-react';
import SkeletonCard from '../components/ui/skeleton/SkeletonCard';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadDepartments = useCallback(async (searchTerm = debouncedSearch, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await adminApi.getDepartments({ search: searchTerm.trim() || undefined });
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
      setError(err.message || 'Failed to retrieve municipal departments list.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadDepartments(debouncedSearch, true);
  }, [debouncedSearch, loadDepartments]);

  const handleClearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 w-full min-w-0">
        
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 sm:p-5 shadow-soft w-full min-w-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link 
              to="/admin/dashboard" 
              className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit mb-2"
            >
              <ArrowLeft className="h-3 w-3" />
              Control Center
            </Link>
            <h1 className="font-outfit text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
              <Building2 className="h-5 w-5 text-primary shrink-0" />
              Municipal Departments Desk
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
              Supervise department operational profiles, live workloads, resolution rates, and jurisdiction routing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDepartments(debouncedSearch, true)}
              className="h-10 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-button text-xs font-bold text-slate-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer select-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : 'text-slate-400'}`} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Search Bar with live clear and debounce */}
        <section className="bg-white border border-slate-200 rounded-card p-4 shadow-soft">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search department by name or code (e.g. ROAD, Water)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button py-2.5 pl-9 pr-9 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* Departments Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 p-8 text-center rounded-card shadow-soft space-y-3">
            <AlertCircle className="w-10 h-10 text-danger mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Failed to Load Departments</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => loadDepartments(debouncedSearch, true)}
              className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-button shadow hover:bg-primary-dark transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : departments.length === 0 ? (
          <div className="bg-white border border-slate-200 p-16 text-center rounded-card shadow-soft space-y-2">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Departments Found</h3>
            <p className="text-xs text-slate-400">
              {search ? `No municipal department matches "${search}".` : 'No departments currently registered.'}
            </p>
            {search && (
              <button
                onClick={handleClearSearch}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <div 
                key={d._id}
                className="bg-white border border-slate-200 rounded-card p-5 shadow-soft hover:shadow-premium transition flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-outfit font-extrabold text-slate-900 text-sm truncate">{d.name}</h3>
                      <span className="inline-block mt-1 font-mono text-[9px] font-bold text-primary bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase">
                        Code: {d.code}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-outfit border shrink-0 ${
                      d.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {d.status || 'Active'}
                    </span>
                  </div>
                  
                  {d.description && (
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">{d.description}</p>
                  )}

                  {/* Contact information if available */}
                  {(d.contactEmail || d.hotlinePhone) && (
                    <div className="mt-3 pt-2 border-t border-slate-50 space-y-1 text-[11px] text-slate-600">
                      {d.contactEmail && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{d.contactEmail}</span>
                        </div>
                      )}
                      {d.hotlinePhone && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{d.hotlinePhone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Performance stats grid */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 py-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Tasks</p>
                      <p className="font-bold text-slate-800 mt-0.5">{d.performance?.activeComplaints || 0} active</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Resolved Total</p>
                      <p className="font-bold text-slate-800 mt-0.5">{d.performance?.totalResolved || 0} tasks</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {d.performance?.successRate ? `${d.performance.successRate}%` : '100%'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Resolution</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {d.performance?.averageResolutionHours 
                          ? `${d.performance.averageResolutionHours.toFixed(1)} hrs` 
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span className="font-semibold text-amber-600 flex items-center gap-0.5">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Rating: {d.performance?.rating ? d.performance.rating.toFixed(1) : '5.0'}
                  </span>
                  
                  <Link 
                    to={`/admin/complaints?department=${d.code}`}
                    className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <Briefcase className="h-3 w-3" />
                    Department Complaints &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
