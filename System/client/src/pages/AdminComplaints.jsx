import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Search, 
  Filter, 
  Inbox, 
  Eye, 
  ArrowLeft,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import AdminComplaintsSkeleton from '../components/skeletons/AdminComplaintsSkeleton';
import SkeletonTable from '../components/ui/skeleton/SkeletonTable';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state (matching backend keys)
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);

  // Mobile Bottom Drawer Filter visibility state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load departments list to populate filters
  const fetchDepartments = async () => {
    try {
      const res = await adminApi.dashboard();
      if (res.data.success) {
        setDepartments(res.data.data.departmentPerformance || []);
      }
    } catch (err) {
      console.error('Failed to pre-fetch departments list:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
        ...(departmentId && { department: departmentId }),
        ...(search.trim() && { search: search.trim() })
      };

      const res = await adminApi.complaints(params);
      if (res.data.success) {
        setComplaints(res.data.data.complaints || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching admin complaints queue:', err);
      setError(err.message || 'Failed to retrieve incidents queue.');
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, category, departmentId, search]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setStatus('');
    setPriority('');
    setCategory('');
    setDepartmentId('');
    setSearch('');
    setPage(1);
  };

  const categories = ['Pothole', 'Garbage Overflow', 'Broken Streetlight', 'Water Leakage', 'Drainage Issue', 'Road Damage', 'Fallen Tree', 'Open Manhole', 'Other'];

  const getSelectedDepartmentName = () => {
    const dept = departments.find(d => d._id === departmentId);
    return dept ? dept.code : '';
  };

  if (loading && complaints.length === 0) {
    return <AdminComplaintsSkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Navigation & Action Header */}
      <header className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex flex-col justify-between items-start gap-2.5 w-full min-w-0">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
          <ArrowLeft className="h-3.5 w-3.5" />
          Control Desk
        </Link>
        <div>
          <h1 className="font-outfit text-base sm:text-lg font-extrabold text-slate-909 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary shrink-0" />
            Civic Incident Queue
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">Supervise, route, override, or audit civic complaints across all city sectors.</p>
        </div>
      </header>

      {/* Filter Toolbar Section */}
      <section className="bg-white border border-slate-200 rounded-card p-4 shadow-soft w-full min-w-0">
        
        {/* Main Search Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full min-w-0">
          <div className="relative flex-grow min-w-0">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search address, incident code, citizen name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button py-3 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition text-slate-700 font-semibold"
            />
          </div>
          
          {/* Filters toggle trigger button on mobile */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden h-11 w-11 rounded-button bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 cursor-pointer"
            title="Open filters modal"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Desktop Submit Button */}
          <button
            type="submit"
            className="hidden md:inline-flex items-center justify-center px-5 h-11 rounded-button bg-primary text-white text-xs font-bold shadow hover:bg-primary-dark transition select-none cursor-pointer"
          >
            Search Queue
          </button>
        </form>

        {/* Desktop inline filters (hidden below md breakpoint) */}
        <div className="hidden md:grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100 w-full min-w-0">
          {/* Status */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select
              value={status}
              onChange={(e) => handleFilterChange(setStatus, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button py-2 px-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white font-semibold text-slate-700 transition"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
            <select
              value={priority}
              onChange={(e) => handleFilterChange(setPriority, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button py-2 px-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white font-semibold text-slate-700 transition"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => handleFilterChange(setCategory, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button py-2 px-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white font-semibold text-slate-700 transition"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
            <select
              value={departmentId}
              onChange={(e) => handleFilterChange(setDepartmentId, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button py-2 px-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white font-semibold text-slate-700 transition"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Chips (visible on mobile if filters are active) */}
        {(status || priority || category || departmentId) && (
          <div className="flex flex-wrap gap-1.5 mt-3.5 pt-2.5 border-t border-slate-100 select-none">
            {status && (
              <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-primary">
                Status: {status}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange(setStatus, '')} />
              </span>
            )}
            {priority && (
              <span className="inline-flex items-center gap-1 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-danger">
                Priority: {priority}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange(setPriority, '')} />
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-indigo-600">
                Type: {category}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange(setCategory, '')} />
              </span>
            )}
            {departmentId && (
              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-amber-600">
                Dept: {getSelectedDepartmentName()}
                <X className="w-3 h-3 cursor-pointer" onClick={() => handleFilterChange(setDepartmentId, '')} />
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-[9px] font-bold text-slate-400 hover:text-slate-600 underline uppercase tracking-wider ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* Complaints Listing Container */}
      {loading ? (
        <div className="space-y-4 w-full min-w-0">
          {/* Desktop Table View loader */}
          <div className="hidden md:block w-full">
            <SkeletonTable rows={5} cols={7} />
          </div>
          {/* Mobile Card List loader */}
          <div className="md:hidden space-y-3 w-full animate-pulse motion-reduce:animate-none">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-card p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="h-3.5 w-14 bg-slate-200 rounded" />
                  <div className="flex gap-1">
                    <div className="h-5 w-10 bg-slate-200 rounded" />
                    <div className="h-5 w-12 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-2.5 w-1/4 bg-slate-200 rounded" />
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 space-y-1.5">
                  <div className="h-2 w-1/2 bg-slate-200 rounded" />
                  <div className="h-2 w-1/3 bg-slate-200 rounded" />
                </div>
                <div className="pt-2 border-t flex justify-between items-center w-full">
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-8 w-16 bg-slate-200 rounded-button" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200 p-8 text-center rounded-card shadow-soft w-full">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h3 className="mt-3 font-bold text-slate-808 text-xs font-outfit">Incidents retrieval failed</h3>
          <p className="text-[10px] text-slate-500 mt-1 leading-normal font-semibold">{error}</p>
          <button 
            onClick={fetchComplaints}
            className="mt-4 bg-primary text-white px-4 py-2 rounded-button text-[10px] font-bold hover:bg-primary-dark transition select-none cursor-pointer uppercase tracking-wider"
          >
            Retry Sync
          </button>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white border border-slate-200 p-16 text-center rounded-card shadow-soft w-full">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="mt-4 font-bold text-slate-808 text-xs font-outfit uppercase">No Incidents Logged</h3>
          <p className="text-[10px] text-slate-500 mt-1">No incidents match your selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4 w-full min-w-0">
          
          {/* Desktop Table View (hidden below md breakpoint) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-card shadow-soft overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3">Incident ID</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Assigned Worker</th>
                    <th className="p-3">Reporting Citizen</th>
                    <th className="p-3 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complaints.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/40 transition">
                      <td className="p-3 font-mono text-[10px] text-slate-400">
                        #{c.complaintNumber || c._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="p-3 font-semibold text-slate-800 truncate max-w-[150px]">{c.title}</td>
                      <td className="p-3 font-semibold text-slate-500">{c.category}</td>
                      <td className="p-3">
                        <ComplaintPriorityBadge priority={c.priority} />
                      </td>
                      <td className="p-3">
                        <ComplaintStatusBadge status={c.status} />
                      </td>
                      <td className="p-3 text-slate-600 font-semibold">{c.assignment?.department?.name || 'Unassigned'}</td>
                      <td className="p-3 text-slate-500 font-semibold">{c.assignment?.worker?.fullName || 'Unassigned'}</td>
                      <td className="p-3 text-slate-500">{c.citizen?.name || 'Citizen'}</td>
                      <td className="p-3 text-center">
                        <Link 
                          to={`/admin/complaints/${c._id}`}
                          className="inline-flex items-center justify-center p-2 rounded-button text-xs font-bold text-primary hover:bg-primary/5 transition"
                          title="Open Admin Control Desk"
                          style={{ minWidth: '44px', minHeight: '44px' }}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (displayed below md breakpoint) */}
          <div className="md:hidden space-y-3.5 w-full min-w-0">
            {complaints.map((c) => (
              <div key={c._id} className="bg-white border border-slate-200 rounded-card p-4 shadow-soft space-y-3 min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">
                    #{c.complaintNumber || c._id.slice(-6).toUpperCase()}
                  </span>
                  <div className="flex gap-1 shrink-0 select-none">
                    <ComplaintPriorityBadge priority={c.priority} />
                    <ComplaintStatusBadge status={c.status} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-805 text-xs leading-normal break-words">{c.title}</h3>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{c.category}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] space-y-1.5 text-slate-600 font-semibold min-w-0">
                  <div className="flex justify-between truncate gap-2">
                    <span>Department:</span>
                    <strong className="text-slate-800">{c.assignment?.department?.code || 'Unassigned'}</strong>
                  </div>
                  <div className="flex justify-between truncate gap-2">
                    <span>Field Agent:</span>
                    <strong className="text-slate-800">{c.assignment?.worker?.fullName || 'Unassigned'}</strong>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center w-full">
                  <span className="text-[9px] text-slate-400">Citizen: {c.citizen?.name || 'Citizen'}</span>
                  <Link
                    to={`/admin/complaints/${c._id}`}
                    className="inline-flex items-center justify-center px-4.5 py-2 rounded-button bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition select-none"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 w-full border-t border-slate-100">
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wide">
                Showing {complaints.length} of {pagination.total} records
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPreviousPage}
                  className="inline-flex items-center gap-1 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-button text-[10px] font-bold text-slate-700 transition disabled:opacity-40 select-none cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  Prev
                </button>
                <span className="text-[10px] font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-button text-slate-600 flex items-center select-none">
                  {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={!pagination.hasNextPage}
                  className="inline-flex items-center gap-1 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-button text-[10px] font-bold text-slate-700 transition disabled:opacity-40 select-none cursor-pointer"
                  style={{ minHeight: '44px' }}
                >
                  Next
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Sliding Bottom Sheet Filter Menu */}
      {mobileFilterOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileFilterOpen(false)}
        />
      )}

      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-150 rounded-t-card p-4 space-y-4 shadow-soft transform transition-transform duration-300 pb-[calc(1.5rem+env(safe-area-inset-bottom))] ${
        mobileFilterOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
          <h3 className="font-outfit text-xs font-bold text-slate-808 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            Filter Incident Queue
          </h3>
          <button 
            type="button"
            onClick={() => setMobileFilterOpen(false)}
            className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Filters selectors list */}
        <div className="space-y-3">
          {/* Status */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select
              value={status}
              onChange={(e) => handleFilterChange(setStatus, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button p-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white font-semibold text-slate-705 transition h-11"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
            <select
              value={priority}
              onChange={(e) => handleFilterChange(setPriority, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button p-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white font-semibold text-slate-705 transition h-11"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => handleFilterChange(setCategory, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button p-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white font-semibold text-slate-705 transition h-11"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1 w-full">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
            <select
              value={departmentId}
              onChange={(e) => handleFilterChange(setDepartmentId, e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-button p-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white font-semibold text-slate-705 transition h-11"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action controls */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setMobileFilterOpen(false);
            }}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold h-11 rounded-button text-xs transition cursor-pointer select-none text-center"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(false)}
            className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold h-11 rounded-button text-xs shadow transition cursor-pointer select-none text-center"
          >
            Apply Filters
          </button>
        </div>
      </div>

    </div>
  );
}
