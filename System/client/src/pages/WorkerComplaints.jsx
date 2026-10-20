import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { workerApi } from '../api/worker.api';
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Search, 
  Filter, 
  Inbox, 
  Eye, 
  ArrowLeft,
  Wrench,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import WorkerComplaintsSkeleton from '../components/skeletons/WorkerComplaintsSkeleton';

export default function WorkerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false); // Collapsed by default on mobile

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await workerApi.complaints();
      if (res.data.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching worker complaints:', err);
      setError(err.message || 'Failed to retrieve assignments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Client-side filtering
  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.complaintNumber?.toLowerCase().includes(search.toLowerCase()) ||
                          c.description?.toLowerCase().includes(search.toLowerCase()) ||
                          c.location?.address?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const categories = ['Pothole', 'Garbage Overflow', 'Broken Streetlight', 'Water Leakage', 'Drainage Issue', 'Road Damage', 'Fallen Tree', 'Open Manhole', 'Other'];

  if (loading && complaints.length === 0) {
    return <WorkerComplaintsSkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Header Panel */}
      <header className="flex flex-col gap-2.5 rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
        <div>
          <Link to="/worker/dashboard" className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-primary transition mb-1 font-outfit uppercase">
            <ArrowLeft className="h-3 w-3" />
            Back to dashboard
          </Link>
          <h1 className="font-outfit text-sm sm:text-base md:text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary shrink-0 animate-pulse" />
            Municipal Assignments
          </h1>
          <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Search, filter and manage tasks dispatched to your device.</p>
        </div>
      </header>

      {/* Search and Advanced Filters */}
      <section className="bg-white border border-slate-100 rounded-card p-3 shadow-soft space-y-3 w-full min-w-0">
        <div className="flex gap-2 w-full">
          <div className="relative flex-grow min-w-0">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, IDs, addresses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-205 rounded-button h-11 pl-9 pr-4 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition"
            />
          </div>
          <button 
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center h-11 w-11 shrink-0 rounded-button border border-slate-200 hover:bg-slate-55 text-slate-600 transition cursor-pointer select-none"
            title="Toggle advanced filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filters dropdown sheet */}
        <div className={`${showFilters ? 'grid' : 'hidden md:grid'} grid gap-3 grid-cols-1 sm:grid-cols-3 pt-1 border-t border-slate-50 mt-1`}>
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-55 bg-slate-50 border border-slate-200 rounded-button h-10 px-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition font-semibold text-slate-705"
            >
              <option value="all">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-55 bg-slate-50 border border-slate-200 rounded-button h-10 px-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition font-semibold text-slate-705"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-55 bg-slate-50 border border-slate-200 rounded-button h-10 px-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition font-semibold text-slate-705"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Task List Cards Grid */}
      {loading ? (
        <div className="grid gap-3.5 sm:grid-cols-2 w-full min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-card p-4 animate-pulse motion-reduce:animate-none space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-3 w-16 bg-slate-200 rounded" />
                <div className="h-5 w-12 bg-slate-200 rounded" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
                <div className="h-3 w-1/3 bg-slate-200 rounded" />
              </div>
              <div className="h-2.5 w-full bg-slate-200 rounded" />
              <div className="pt-2 border-t flex justify-between items-center w-full">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-8 w-16 bg-slate-200 rounded-button" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200 p-8 text-center rounded-card shadow-soft w-full min-w-0">
          <AlertCircle className="w-10 h-10 text-danger mx-auto animate-pulse" />
          <h3 className="mt-3 font-bold text-slate-800 text-xs font-outfit">Failed to Load Task Queue</h3>
          <p className="text-xs text-slate-500 mt-1 leading-normal">{error}</p>
          <button 
            onClick={fetchComplaints}
            className="mt-4 bg-primary text-white h-11 px-6 rounded-button text-xs font-bold hover:bg-primary-dark transition select-none cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white border border-slate-150 p-12 text-center rounded-card shadow-soft w-full min-w-0">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
          <h3 className="mt-4 font-bold text-slate-700 text-xs font-outfit">No assignments found</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs mx-auto">Try relaxing your search terms or filters above.</p>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 w-full min-w-0">
          {filteredComplaints.map((c) => (
            <div 
              key={c._id}
              className="bg-white border border-slate-100 rounded-card p-3.5 shadow-soft hover:border-slate-200 transition flex flex-col justify-between gap-3 w-full min-w-0 max-w-full"
            >
              <div className="min-w-0 w-full">
                <div className="flex justify-between items-center gap-2 w-full min-w-0">
                  <span className="font-mono text-[9px] font-bold text-slate-455 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate shrink-0 max-w-[110px]">
                    #{c.complaintNumber || c._id.slice(-6).toUpperCase()}
                  </span>
                  <div className="flex gap-1 shrink-0 select-none">
                    <ComplaintStatusBadge status={c.status} />
                    <ComplaintPriorityBadge priority={c.priority} />
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm mt-3 line-clamp-1 w-full">{c.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-normal w-full break-words">{c.description}</p>
                
                <div className="mt-3.5 flex flex-col gap-1.5 text-[11px] text-slate-500 border-t border-slate-50 pt-3 w-full min-w-0">
                  <div className="flex items-start gap-1.5 w-full min-w-0">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate flex-grow">{c.location?.address || 'Location verification pending'}</span>
                  </div>
                  {c.ai?.estimatedCompletionHours > 0 && (
                    <div className="flex items-center gap-1 text-primary font-semibold text-[10px] shrink-0">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>AI ETA estimate: {c.ai.estimatedCompletionHours} hours</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action layout bottom - Optimized full-width stack on mobile */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between border-t border-slate-50 mt-1 w-full min-w-0">
                <span className="text-[9px] text-slate-405 font-semibold shrink-0">
                  Dispatched: {new Date(c.createdAt).toLocaleDateString()}
                </span>
                
                <Link 
                  to={`/worker/complaints/${c._id}`}
                  className="inline-flex items-center justify-center gap-1.5 bg-primary text-white h-11 px-4.5 rounded-button font-bold text-xs shadow hover:bg-primary-dark transition select-none w-full sm:w-auto shrink-0 cursor-pointer text-center"
                >
                  <Eye className="w-4 h-4" />
                  <span>Manage Assignment</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
