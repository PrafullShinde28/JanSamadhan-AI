import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  ClipboardList, 
  Clock3, 
  MapPin, 
  Plus, 
  RefreshCw, 
  Route 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { complaintApi } from '../api/complaint.api';
import ComplaintsMap from '../components/ComplaintsMap';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import CitizenDashboardSkeleton from '../components/skeletons/CitizenDashboardSkeleton';

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

export default function CitizenDashboard() {
  const { dbUser } = useApp();
  const socket = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadComplaints = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const response = await complaintApi.citizenList();
      setComplaints(response.data.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadComplaints(true); 
  }, [loadComplaints]);

  // Handle socket notifications & state changes to refresh dashboard data
  useEffect(() => {
    if (!socket) return;

    const handleDashboardRefetch = (data) => {
      console.log('🔄 Dashboard socket event received, refreshing data...', data);
      loadComplaints(false);
    };

    socket.on('notification', handleDashboardRefetch);
    socket.on('status-updated', handleDashboardRefetch);
    socket.on('ai-completed', handleDashboardRefetch);
    socket.on('worker-assigned', handleDashboardRefetch);

    return () => {
      socket.off('notification', handleDashboardRefetch);
      socket.off('status-updated', handleDashboardRefetch);
      socket.off('ai-completed', handleDashboardRefetch);
      socket.off('worker-assigned', handleDashboardRefetch);
    };
  }, [socket, loadComplaints]);

  const stats = useMemo(() => ({
    total: complaints.length,
    active: complaints.filter(({ status }) => ['Pending', 'Under Review', 'Assigned', 'In Progress'].includes(status)).length,
    resolved: complaints.filter(({ status }) => status === 'Resolved').length,
    closed: complaints.filter(({ status }) => status === 'Closed').length,
  }), [complaints]);

  if (loading && complaints.length === 0) {
    return <CitizenDashboardSkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Greetings Header banner */}
      <header className="flex flex-col gap-4 rounded-card border border-slate-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-primary font-outfit uppercase tracking-wider">Citizen Dashboard</p>
          <h1 className="mt-1 font-outfit text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-slate-805 leading-snug truncate w-full">
            {greeting()}, {dbUser?.fullName || 'Citizen'}
          </h1>
          <p className="mt-1 text-[10px] text-slate-450 leading-normal">Report local issues and keep track of every update.</p>
        </div>
        
        {/* Dashboard CTAs: Stacks vertically on mobile */}
        <div className="flex flex-col xs:flex-row gap-2 shrink-0 select-none w-full sm:w-auto">
          <Link 
            to="/citizen/complaints" 
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-button border border-slate-200 bg-white px-4 h-11 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer select-none"
          >
            <ClipboardList className="h-4 w-4 text-slate-450 shrink-0" /> 
            My Reports
          </Link>
          <Link 
            to="/citizen/report" 
            className="flex-grow inline-flex items-center justify-center gap-1.5 rounded-button bg-primary text-white px-4.5 h-11 text-xs font-bold shadow-premium hover:bg-primary-dark transition cursor-pointer select-none animate-pulse"
          >
            <Plus className="h-4 w-4 shrink-0" /> 
            Report Civic Issue
          </Link>
        </div>
      </header>

      {error ? (
        <Failure message={error} retry={loadComplaints} />
      ) : (
        <>
          {/* Stats metrics grid */}
          <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 w-full min-w-0">
            <Stat icon={ClipboardList} label="Total reports" value={stats.total} tone="blue" loading={loading} />
            <Stat icon={Clock3} label="Active" value={stats.active} tone="amber" loading={loading} />
            <Stat icon={CheckCircle2} label="Resolved" value={stats.resolved} tone="green" loading={loading} />
            <Stat icon={Route} label="Closed" value={stats.closed} tone="slate" loading={loading} />
          </section>
          
          {/* Spatial maps & Recent log panels */}
          <section className="grid gap-4 lg:grid-cols-3 w-full min-w-0">
            <div className="lg:col-span-2 min-w-0 w-full">
              <ComplaintsMap complaints={complaints} />
            </div>
            
            <div className="min-w-0 w-full">
              <RecentReports complaints={complaints} loading={loading} />
            </div>
          </section>
        </>
      )}

    </div>
  );
}

function Stat({ icon: Icon, label, value, tone, loading }) {
  const tones = { 
    blue: 'bg-blue-50 text-primary', 
    amber: 'bg-amber-50 text-amber-600', 
    green: 'bg-emerald-50 text-success', 
    slate: 'bg-slate-100 text-slate-650' 
  };

  return (
    <div className="rounded-card border border-slate-100 bg-white p-3.5 sm:p-4.5 shadow-soft w-full min-w-0">
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-xl ${tones[tone]} shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-outfit truncate">{label}</p>
      <p className="mt-0.5 font-outfit text-base sm:text-lg font-extrabold text-slate-805 truncate">
        {loading ? <span className="inline-block h-6 w-9 animate-pulse rounded bg-slate-100" /> : value}
      </p>
    </div>
  );
}

function RecentReports({ complaints, loading }) {
  if (loading) {
    return (
      <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-16 animate-pulse rounded-xl bg-slate-50" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0 flex flex-col justify-between">
      <div className="border-b pb-2 border-slate-50">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-805">Recent Reports</h2>
          <Link to="/citizen/complaints" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide shrink-0 font-outfit">
            See all
          </Link>
        </div>
        <p className="mt-0.5 text-[9.5px] text-slate-400">Latest activity log from your account</p>
      </div>

      {complaints.length === 0 ? (
        <div className="grid min-h-[220px] place-items-center text-center p-4">
          <div className="space-y-2">
            <MapPin className="mx-auto h-8 w-8 text-slate-300 animate-pulse" />
            <p className="text-xs font-bold text-slate-700">No civic reports yet</p>
            <p className="text-[10px] text-slate-400 leading-normal max-w-xs">Your submitted reports will appear here.</p>
            <Link to="/citizen/report" className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase font-outfit">
              Report an issue 
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2 w-full min-w-0">
          {complaints.slice(0, 4).map((complaint) => (
            <Link 
              key={complaint._id} 
              to={`/citizen/complaints/${complaint._id}`} 
              className="block rounded-xl border border-slate-100 p-2.5 transition hover:border-blue-200 hover:bg-blue-50/20 w-full min-w-0"
            >
              <div className="flex gap-2.5 min-w-0 w-full">
                {/* Thumb preview image with fixed ratio */}
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-50 border relative">
                  {complaint.complaintImages?.[0]?.url ? (
                    <img src={complaint.complaintImages[0].url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <MapPin className="m-2.5 h-5 w-5 text-slate-300" />
                  )}
                </div>
                
                <div className="min-w-0 flex-grow w-full">
                  <p className="truncate text-xs font-bold text-slate-800 leading-tight w-full">{complaint.title}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-505 w-full">{complaint.location?.address || 'Location being verified'}</p>
                  <div className="mt-2 flex flex-wrap gap-1 shrink-0 select-none">
                    <ComplaintStatusBadge status={complaint.status} />
                    <ComplaintPriorityBadge priority={complaint.priority} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Failure({ message, retry }) { 
  return (
    <section className="rounded-card border border-red-100 bg-white p-8 text-center shadow-soft w-full min-w-0">
      <AlertCircle className="mx-auto h-9 w-9 text-danger" />
      <h2 className="mt-3 font-outfit text-xs sm:text-sm font-bold text-slate-805">We couldn’t sync your dashboard</h2>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 leading-normal">{message}</p>
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
