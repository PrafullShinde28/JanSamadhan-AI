import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { useSocket } from '../context/SocketContext';
import { 
  BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  Loader2, 
  AlertCircle, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Layers, 
  Sparkles, 
  User, 
  Building2, 
  Map, 
  TrendingUp,
  Activity,
  Bell,
  RefreshCw,
  Award
} from 'lucide-react';
import { toast } from 'react-toastify';
import AdminErrorBoundary from '../components/AdminErrorBoundary';
import AdminDashboardSkeleton from '../components/skeletons/AdminDashboardSkeleton';

const COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#DC2626', '#8B5CF6', '#EC4899', '#64748B'];

export default function AdminDashboard() {
  const socket = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Responsive state for charts sizing
  const [isMobile, setIsMobile] = useState(window.innerWidth < 645);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 645);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await adminApi.dashboard();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
      setError(err.message || 'Failed to sync with command center analytics.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleDashboardSocketUpdate = (payload) => {
      console.log('🔄 Sockets update received on Admin Dashboard:', payload);
      loadData(false);
    };

    socket.on('notification', handleDashboardSocketUpdate);
    socket.on('status-updated', handleDashboardSocketUpdate);
    socket.on('ai-completed', handleDashboardSocketUpdate);
    socket.on('worker-assigned', handleDashboardSocketUpdate);

    return () => {
      socket.off('notification', handleDashboardSocketUpdate);
      socket.off('status-updated', handleDashboardSocketUpdate);
      socket.off('ai-completed', handleDashboardSocketUpdate);
      socket.off('worker-assigned', handleDashboardSocketUpdate);
    };
  }, [socket, loadData]);

  if (loading && !data) {
    return <AdminDashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 text-center min-h-[60vh] w-full">
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-soft max-w-sm w-full space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="text-sm font-bold text-slate-805 font-outfit">Connection Interrupted</h2>
          <p className="text-xs text-slate-500 leading-normal font-semibold">{error}</p>
          <button 
            onClick={() => loadData(true)}
            className="w-full bg-primary text-white py-2.5 rounded-button text-xs font-bold hover:bg-primary-dark transition cursor-pointer select-none flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconnect HQ</span>
          </button>
        </div>
      </div>
    );
  }

  const { overview, categoryDistribution, priorityDistribution, statusDistribution, departmentPerformance, workerPerformance } = data || {};

  // Formatted charts data
  const statusChartData = statusDistribution?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const categoryChartData = categoryDistribution?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const deptChartData = departmentPerformance?.map(dept => ({
    name: dept.code,
    resolved: dept.performance?.totalResolved || 0,
    active: dept.performance?.activeComplaints || 0
  })) || [];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Overview Identity Banner */}
      <header className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 w-full min-w-0">
        <div>
          <span className="text-[9px] font-bold text-primary uppercase tracking-wider font-outfit bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
            HQ Command Console
          </span>
          <h1 className="text-base sm:text-lg font-extrabold font-outfit text-slate-900 mt-1 leading-snug">Operations Overview</h1>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-medium">Real-time stats monitor for city departments, socket presence, and AI classifiers.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => loadData(false)}
            className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-655 h-9 px-3.5 rounded-button text-[10px] font-bold transition uppercase tracking-wider select-none cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            Refresh
          </button>
        </div>
      </header>

      {/* KPI Stats Grid - 2 columns mobile, progressively enhancing to 5 */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 w-full min-w-0">
        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
              <ClipboardList className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Total Incidents</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.totalComplaints || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Pending Review</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.pendingComplaints || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-amber-50 text-warning flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 animate-pulse" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Queue Assigned</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.assignedComplaints || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">In Progress</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.inProgressComplaints || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-emerald-50 text-success flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Resolved</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.resolvedComplaints || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Closed (Audited)</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.closedComplaints || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-orange-50 text-orange-655 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-4 w-4 animate-bounce" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">High Priority</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.highPriority || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-red-50 text-danger flex items-center justify-center shrink-0">
              <ShieldAlert className="h-4 w-4 animate-pulse" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Critical Alerts</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.criticalPriority || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-emerald-50 text-success flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">AI Verified Clear</p>
          </div>
          <p className="mt-1 font-outfit text-lg sm:text-xl font-extrabold text-slate-905">{overview?.aiVerified || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-card shadow-soft min-w-0 flex flex-col justify-between">
          <div>
            <div className="mb-2 h-7 w-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Avg Fix Window</p>
          </div>
          <p className="mt-1 font-outfit text-xs sm:text-sm font-extrabold text-slate-905 leading-normal">
            {overview?.averageCompletionHours ? `${overview.averageCompletionHours.toFixed(1)} hrs` : 'N/A'}
          </p>
        </div>
      </section>

      {/* Analytics Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full min-w-0">
        
        {/* Status Distribution */}
        <AdminErrorBoundary>
          <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0">
            <h3 className="font-outfit font-extrabold text-slate-808 text-xs sm:text-sm uppercase tracking-wide">Incident Status Distribution</h3>
            <div className="h-56 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                  <Bar dataKey="value" name="Incidents" fill="#2563EB" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AdminErrorBoundary>

        {/* Category Distribution - Center legend below Pie Chart on mobile to prevent clipping labels */}
        <AdminErrorBoundary>
          <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0">
            <h3 className="font-outfit font-extrabold text-slate-808 text-xs sm:text-sm uppercase tracking-wide">Category Distribution Breakdown</h3>
            <div className="h-56 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 55 : 85}
                    dataKey="value"
                    label={!isMobile ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)` : false}
                    labelLine={!isMobile}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} incidents`]} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '9px', paddingTop: '10px', overflowX: 'auto', maxWidth: '100%' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AdminErrorBoundary>

        {/* Department Performance - Horizontal bar layout on mobile, vertical layout on desktop */}
        <AdminErrorBoundary>
          <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 col-span-1 lg:col-span-2 w-full min-w-0">
            <h3 className="font-outfit font-extrabold text-slate-808 text-xs sm:text-sm uppercase tracking-wide">Department Workload Performance</h3>
            <div className="h-64 sm:h-76 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {isMobile ? (
                  <BarChart data={deptChartData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={9} width={55} fontStyle="bold" />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                    <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                    <Bar dataKey="resolved" name="Resolved" fill="#16A34A" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="active" name="Active Load" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                    <Legend />
                    <Bar dataKey="resolved" name="Resolved Tasks" fill="#16A34A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="active" name="Active Tasks" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </AdminErrorBoundary>
      </section>

      {/* Grid Summaries - Table on Desktop, Cards on Mobile */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 w-full min-w-0">
        
        {/* Department performance detail summary */}
        <AdminErrorBoundary>
          <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <h3 className="font-outfit font-extrabold text-slate-808 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                  Department Resolution Metrics
                </h3>
                <Link to="/admin/departments" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider font-outfit">
                  Manage →
                </Link>
              </div>

              {/* Table hidden below md breakpoint */}
              <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-slate-150 border-collapse">
                  <thead>
                    <tr className="text-slate-500 font-bold bg-slate-50">
                      <th className="p-3">Code</th>
                      <th className="p-3">Department Name</th>
                      <th className="p-3 text-center">Active Load</th>
                      <th className="p-3 text-center">Resolved</th>
                      <th className="p-3 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-655">
                    {departmentPerformance?.slice(0, 5).map((dept) => (
                      <tr key={dept._id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-extrabold text-slate-900">{dept.code}</td>
                        <td className="p-3 truncate max-w-[170px] font-semibold">{dept.name}</td>
                        <td className="p-3 text-center font-semibold text-slate-800">{dept.performance?.activeComplaints || 0}</td>
                        <td className="p-3 text-center font-semibold text-success">{dept.performance?.totalResolved || 0}</td>
                        <td className="p-3 text-center font-bold text-amber-600">
                          {dept.performance?.rating ? `${dept.performance.rating.toFixed(1)} ★` : '5.0 ★'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards layout displayed below md breakpoint */}
              <div className="md:hidden space-y-3">
                {departmentPerformance?.slice(0, 5).map((dept) => (
                  <div key={dept._id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                      <span className="font-extrabold text-slate-805 text-[10px] font-mono tracking-wider bg-slate-200/60 px-2 py-0.5 rounded">
                        {dept.code}
                      </span>
                      <span className="font-extrabold text-amber-600 text-xs flex items-center gap-0.5">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        {dept.performance?.rating ? `${dept.performance.rating.toFixed(1)} ★` : '5.0 ★'}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-xs leading-normal">{dept.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-550 font-bold">
                      <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                        <span className="block text-slate-400 text-[8px] uppercase tracking-wide font-bold">Active Load</span>
                        <span className="text-slate-800 font-extrabold text-xs">{dept.performance?.activeComplaints || 0}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2 text-center">
                        <span className="block text-slate-400 text-[8px] uppercase tracking-wide font-bold">Resolved</span>
                        <span className="text-success font-extrabold text-xs">{dept.performance?.totalResolved || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminErrorBoundary>

        {/* Top Field Agents Performance Table */}
        <AdminErrorBoundary>
          <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <h3 className="font-outfit font-extrabold text-slate-808 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary shrink-0" />
                  Top Performing Field Agents
                </h3>
                <Link to="/admin/workers" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider font-outfit">
                  Manage →
                </Link>
              </div>

              {/* Table hidden below md breakpoint */}
              <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-slate-150 border-collapse">
                  <thead>
                    <tr className="text-slate-500 font-bold bg-slate-50">
                      <th className="p-3">Field Agent</th>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-center">Active Load</th>
                      <th className="p-3 text-center">Completed</th>
                      <th className="p-3 text-center">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-655">
                    {workerPerformance?.slice(0, 5).map((worker) => (
                      <tr key={worker._id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-bold text-slate-905">{worker.fullName}</td>
                        <td className="p-3 font-semibold text-slate-500">{worker.department?.code || 'N/A'}</td>
                        <td className="p-3 text-center font-semibold text-slate-800">{worker.workload || 0}</td>
                        <td className="p-3 text-center font-semibold text-success">{worker.performance?.totalResolved || 0}</td>
                        <td className="p-3 text-center font-bold text-amber-600">
                          {worker.performance?.rating ? `${worker.performance.rating.toFixed(1)} ★` : '5.0 ★'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards layout displayed below md breakpoint */}
              <div className="md:hidden space-y-3">
                {workerPerformance?.slice(0, 5).map((worker) => (
                  <div key={worker._id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                      <span className="font-bold text-slate-808 text-xs">{worker.fullName}</span>
                      <span className="font-extrabold text-amber-600 text-xs flex items-center gap-0.5">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        {worker.performance?.rating ? `${worker.performance.rating.toFixed(1)} ★` : '5.0 ★'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                      <span>Division: <strong>{worker.department?.code || 'N/A'}</strong></span>
                      <div className="flex gap-3 font-bold text-right">
                        <span>Active: <strong className="text-slate-850 font-extrabold">{worker.workload || 0}</strong></span>
                        <span>Done: <strong className="text-success font-extrabold">{worker.performance?.totalResolved || 0}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminErrorBoundary>
      </section>

    </div>
  );
}
