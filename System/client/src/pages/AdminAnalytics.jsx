import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { 
  BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  TrendingUp, 
  Bot, 
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  Activity,
  RefreshCw
} from 'lucide-react';
import AdminErrorBoundary from '../components/AdminErrorBoundary';
import AdminAnalyticsSkeleton from '../components/skeletons/AdminAnalyticsSkeleton';

const COLORS = ['#2563EB', '#F59E0B', '#16A34A', '#DC2626', '#8B5CF6', '#EC4899', '#64748B'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Responsive state for charts
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
      console.error('Error fetching admin analytics:', err);
      setError(err.message || 'Failed to sync deep analytical datasets.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  if (loading && !data) {
    return <AdminAnalyticsSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 text-center min-h-[60vh] w-full bg-slate-50">
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-soft max-w-sm w-full space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="text-sm font-bold text-slate-805 font-outfit">Connection Interrupted</h2>
          <p className="text-xs text-slate-500 leading-normal font-semibold">{error}</p>
          <button 
            onClick={() => loadData(true)}
            className="w-full bg-primary text-white py-2.5 rounded-button text-xs font-bold hover:bg-primary-dark transition cursor-pointer select-none flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Analytics</span>
          </button>
        </div>
      </div>
    );
  }

  const { overview, categoryDistribution, priorityDistribution, statusDistribution } = data || {};

  const statusChartData = statusDistribution?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const categoryChartData = categoryDistribution?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const priorityChartData = priorityDistribution?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

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
              <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              System Analytics Desk
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-semibold">Detailed performance summary charting AI pipeline metrics and resolution success ratios.</p>
          </div>
        </header>

        {/* Overview Stats */}
        <section className="grid gap-4 grid-cols-1 md:grid-cols-3 w-full min-w-0">
          
          <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0 flex-grow">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">AI Classification Load</p>
              <h3 className="font-outfit font-extrabold text-slate-900 text-base sm:text-lg mt-0.5 truncate">{overview?.aiProcessedComplaints || 0} issues</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Average Confidence: <span className="font-bold text-slate-600">{overview?.averageAIConfidence ? `${(overview.averageAIConfidence * 100).toFixed(1)}%` : '100%'}</span></p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 bg-emerald-50 text-success rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Resolution Success</p>
              <h3 className="font-outfit font-extrabold text-slate-900 text-base sm:text-lg mt-0.5 truncate">{overview?.resolutionSuccessRate || 0}%</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Resolved: <span className="font-bold text-slate-655">{overview?.resolvedComplaints || 0}</span> | Closed: <span className="font-bold text-slate-655">{overview?.closedComplaints || 0}</span></p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Governance Overrides</p>
              <h3 className="font-outfit font-extrabold text-slate-900 text-base sm:text-lg mt-0.5 truncate">{overview?.aiOverrides || 0} overrides</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Duplicates identified: <span className="font-bold text-slate-600">{overview?.duplicateComplaints || 0}</span></p>
            </div>
          </div>

        </section>

        {/* Interactive Charts */}
        <section className="grid gap-5 sm:gap-6 md:grid-cols-2 w-full min-w-0">
          
          {/* Status Distribution */}
          <AdminErrorBoundary>
            <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0">
              <h3 className="font-outfit font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">Status Metrics Distribution</h3>
              <div className="h-56 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                    <Bar dataKey="value" name="Incidents count" fill="#2563EB" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AdminErrorBoundary>

          {/* Priority Density Chart */}
          <AdminErrorBoundary>
            <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0">
              <h3 className="font-outfit font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">Priority Density Chart</h3>
              <div className="h-56 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={isMobile ? 55 : 85}
                      dataKey="value"
                      label={!isMobile ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)` : false}
                      labelLine={!isMobile}
                    >
                      {priorityChartData.map((entry, index) => (
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

          {/* Category Distribution Horizontal Chart */}
          <AdminErrorBoundary>
            <div className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 md:col-span-2 w-full min-w-0">
              <h3 className="font-outfit font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">Incident Category Classification Share</h3>
              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ top: 10, right: 10, left: isMobile ? -25 : 0, bottom: 5 }}>
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={isMobile ? 70 : 120} fontStyle="bold" />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                    <Bar dataKey="value" name="Complaints count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AdminErrorBoundary>

        </section>

      </div>
    </div>
  );
}
