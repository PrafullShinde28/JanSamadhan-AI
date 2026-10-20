import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { 
  Loader2, 
  AlertCircle, 
  Search, 
  Star, 
  Wrench, 
  UserCheck, 
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import AdminWorkersSkeleton from '../components/skeletons/AdminWorkersSkeleton';

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadWorkers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await adminApi.dashboard();
      if (res.data.success) {
        setWorkers(res.data.data.workerPerformance || []);
      }
    } catch (err) {
      console.error('Failed to load workers metrics:', err);
      setError(err.message || 'Failed to retrieve field workers logs.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkers(true);
  }, [loadWorkers]);

  const filteredWorkers = workers.filter(w => {
    return w.fullName?.toLowerCase().includes(search.toLowerCase()) ||
           w.department?.name?.toLowerCase().includes(search.toLowerCase()) ||
           w.department?.code?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading && workers.length === 0) {
    return <AdminWorkersSkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 w-full min-w-0">
        
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 sm:p-5 shadow-soft w-full min-w-0">
          <div>
            <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit mb-2">
              <ArrowLeft className="h-3 w-3" />
              Control Center
            </Link>
            <h1 className="font-outfit text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
              <UserCheck className="h-5 w-5 text-primary shrink-0" />
              Field Agent Registry
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Monitor agent workloads, performance ratings, and active incident resolving duties.</p>
          </div>
        </header>

        {/* Search */}
        <section className="bg-white border border-slate-200 rounded-card p-4 shadow-soft">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search agent name, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button py-2 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition"
            />
          </div>
        </section>

        {/* Grid/List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-card p-5 animate-pulse motion-reduce:animate-none space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1.5 flex-grow min-w-0">
                    <div className="h-4 w-2/3 bg-slate-200 rounded" />
                    <div className="h-2.5 w-1/2 bg-slate-200 rounded" />
                  </div>
                  <div className="h-5 w-14 bg-slate-200 rounded shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-slate-100">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-2 w-12 bg-slate-200 rounded" />
                      <div className="h-3 w-16 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-2.5 w-24 bg-slate-200 rounded" />
                  <div className="h-3 w-14 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-slate-200 p-8 text-center rounded-card shadow-soft">
            <AlertCircle className="w-10 h-10 text-danger mx-auto" />
            <h3 className="mt-3 font-bold text-slate-800 text-sm">Failed to Load Workers</h3>
            <p className="text-xs text-slate-500 mt-1">{error}</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="bg-white border border-slate-200 p-16 text-center rounded-card shadow-soft">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="mt-4 font-bold text-slate-800 text-sm">No Field Agents Found</h3>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkers.map((w) => (
              <div 
                key={w._id}
                className="bg-white border border-slate-200 rounded-card p-5 shadow-soft hover:shadow-premium transition flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-outfit font-extrabold text-slate-900 text-sm">{w.fullName}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Department: <span className="text-slate-600 font-bold">{w.department?.name || 'N/A'} ({w.department?.code || 'N/A'})</span>
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                      w.availability === 'Available' ? 'bg-emerald-50 text-success border-emerald-100' :
                      w.availability === 'Busy' ? 'bg-amber-50 text-warning border-amber-100' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {w.availability}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-b border-slate-100 py-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Load</p>
                      <p className="font-bold text-slate-800 mt-0.5">{w.workload || 0} active</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Resolution</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {w.performance?.averageResolutionHours 
                          ? `${w.performance.averageResolutionHours.toFixed(1)} hrs` 
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Resolved</p>
                      <p className="font-bold text-slate-800 mt-0.5">{w.performance?.totalResolved || 0} tasks</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agent Rating</p>
                      <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-0.5 text-yellow-600">
                        <Star className="h-3 w-3 fill-current" />
                        {w.performance?.rating ? w.performance.rating.toFixed(1) : '5.0'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-between items-center text-[10px] text-slate-400">
                  <span className="font-semibold">Queue assignments verified</span>
                  <Link 
                    to="/admin/complaints"
                    className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                  >
                    <Briefcase className="h-3 w-3" />
                    View active
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
