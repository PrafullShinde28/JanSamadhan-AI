import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { workerApi } from '../api/worker.api';
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Wrench,
  CheckCircle,
  Clock,
  Star,
  Activity,
  User,
  Eye,
  Inbox,
  Check,
  X,
  Navigation,
  ArrowRight,
  Bell,
  BarChart2,
  Play
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import WorkerDashboardSkeleton from '../components/skeletons/WorkerDashboardSkeleton';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function WorkerDashboard() {
  const { dbUser, setDbUser } = useApp();
  const socket = useSocket();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'Assigned' | 'In Progress' | 'Resolved'

  // Socket presence states
  const [isOnline, setIsOnline] = useState('loading'); // 'loading' | 'online' | 'offline'
  const [updatingDuty, setUpdatingDuty] = useState(false);

  // Loading states per task ID to track API progress
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [startingId, setStartingId] = useState(null);

  // Rejection prompt modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleToggleDuty = async () => {
    if (updatingDuty) return;
    const current = dashboardData?.profile?.availability || dbUser?.availability || 'Available';
    const nextStatus = current === 'Available' ? 'Offline' : 'Available';

    // Optimistic UI updates
    setDashboardData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: {
          ...prev.profile,
          availability: nextStatus
        }
      };
    });
    if (setDbUser) {
      setDbUser((prev) => (prev ? { ...prev, availability: nextStatus } : prev));
    }

    setUpdatingDuty(true);
    try {
      const res = await workerApi.updateDutyStatus(nextStatus);
      if (res.data.success) {
        toast.success(`Duty status updated to ${nextStatus}`);
      }
    } catch (err) {
      // Revert on error
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            availability: current
          }
        };
      });
      if (setDbUser) {
        setDbUser((prev) => (prev ? { ...prev, availability: current } : prev));
      }
      toast.error(err.response?.data?.message || err.message || 'Failed to update duty status');
    } finally {
      setUpdatingDuty(false);
    }
  };

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [dashRes, tasksRes] = await Promise.all([
        workerApi.dashboard(),
        workerApi.complaints()
      ]);
      
      if (dashRes.data.success) {
        setDashboardData(dashRes.data.data);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching worker data:', err);
      setError(err.message || 'Failed to fetch field tasks queue.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Track socket connection state for real-time presence status
  useEffect(() => {
    if (!socket) {
      setIsOnline('loading');
      return;
    }

    setIsOnline(socket.connected ? 'online' : 'offline');

    const handleConnect = () => setIsOnline('online');
    const handleDisconnect = () => setIsOnline('offline');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleWorkerUpdate = (data) => {
      console.log('🔄 Sockets update received on Worker Dashboard:', data);
      loadData(false);
    };

    const handleAvailabilityUpdate = (data) => {
      console.log('🔄 Worker availability update received on Dashboard:', data);
      if (data?.clerkId === dbUser?.clerkId || data?.workerId === dbUser?._id) {
        setDashboardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            profile: {
              ...prev.profile,
              availability: data.availability
            }
          };
        });
      }
    };

    socket.on('notification', handleWorkerUpdate);
    socket.on('status-updated', handleWorkerUpdate);
    socket.on('worker-assigned', handleWorkerUpdate);
    socket.on('worker-availability-updated', handleAvailabilityUpdate);

    return () => {
      socket.off('notification', handleWorkerUpdate);
      socket.off('status-updated', handleWorkerUpdate);
      socket.off('worker-assigned', handleWorkerUpdate);
      socket.off('worker-availability-updated', handleAvailabilityUpdate);
    };
  }, [socket, loadData, dbUser?.clerkId, dbUser?._id]);

  // Identify active task
  const activeTask = useMemo(() => {
    return tasks.find(t => ['Assigned', 'In Progress'].includes(t.status));
  }, [tasks]);

  const isAccepted = useMemo(() => {
    if (!activeTask) return false;
    return activeTask.timeline?.some(event => event.eventType === 'Worker Accepted') || false;
  }, [activeTask]);

  const hasReachedLocation = useMemo(() => {
    if (!activeTask) return false;
    return activeTask.timeline?.some(event => event.eventType === 'Worker Reached Location') || false;
  }, [activeTask]);

  // Next Action Engine
  const nextAction = useMemo(() => {
    if (!activeTask) return null;

    if (activeTask.status === 'Assigned') {
      if (!isAccepted) {
        return {
          text: 'Awaiting your action. Accept this task to start planning field actions, or reject it with comments.',
          step: 'Accept assignment',
          status: 'Assigned'
        };
      } else {
        return {
          text: 'Task accepted. Ready to begin work operations.',
          step: 'Start Work',
          status: 'Accepted'
        };
      }
    }

    if (activeTask.status === 'In Progress') {
      if (!hasReachedLocation) {
        return {
          text: 'Verify your GPS location once you reach the physical complaint site (within 100 meters).',
          step: 'Verify location checkin',
          status: 'Reach Location',
          actionUrl: `/worker/complaints/${activeTask._id}/location`
        };
      }
      return {
        text: 'Location verified. Upload progress updates or submit resolution evidence when work is completed.',
        step: 'Upload updates / Resolve',
        status: 'Update Work',
        actionUrl: `/worker/complaints/${activeTask._id}`
      };
    }

    return null;
  }, [activeTask, isAccepted, hasReachedLocation]);

  const handleAccept = async (id) => {
    setAcceptingId(id);
    try {
      const res = await workerApi.accept(id);
      if (res.data.success) {
        toast.success('Complaint accepted. Start work when ready.');
        await loadData(false);
      }
    } catch (err) {
      console.error("Accept API Error:", err);
      toast.error(err.message || 'Failed to accept complaint.');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = (id) => {
    setRejectTargetId(id);
    setRejectModalOpen(true);
  };

  const confirmReject = async (reason) => {
    if (!rejectTargetId) return;
    if (!reason?.trim()) {
      toast.warning('A rejection reason is required.');
      return;
    }

    setIsRejecting(true);
    setRejectingId(rejectTargetId);
    try {
      const res = await workerApi.reject(rejectTargetId, { reason });
      if (res.data.success) {
        toast.success('Complaint reassigned back to queue.');
        setRejectModalOpen(false);
        setRejectTargetId(null);
        await loadData(false);
      }
    } catch (err) {
      console.error("Reject API Error:", err);
      toast.error(err.response?.data?.message || err.message || 'Failed to reject complaint.');
    } finally {
      setIsRejecting(false);
      setRejectingId(null);
    }
  };

  const handleStartWork = async (id) => {
    setStartingId(id);
    try {
      const res = await workerApi.start(id);
      if (res.data.success) {
        toast.success('Work started on this complaint.');
        await loadData(false);
      }
    } catch (err) {
      console.error("Start Work API Error:", err);
      toast.error(err.message || 'Failed to start work.');
    } finally {
      setStartingId(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const isTaskAccepted = task.timeline?.some(event => event.eventType === 'Worker Accepted') || false;
    
    if (statusFilter === 'active') {
      return ['Assigned', 'In Progress'].includes(task.status);
    }
    if (statusFilter === 'Assigned') {
      return task.status === 'Assigned' && !isTaskAccepted;
    }
    if (statusFilter === 'Accepted') {
      return task.status === 'Assigned' && isTaskAccepted;
    }
    return task.status === statusFilter;
  });

  if (loading && !dashboardData) {
    return <WorkerDashboardSkeleton />;
  }

  if (error && !dashboardData) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 min-h-[50vh] w-full">
        <div className="bg-white p-5 rounded-card border border-slate-205 shadow-soft w-full max-w-xs text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto animate-pulse" />
          <h2 className="text-sm font-bold text-slate-800 font-outfit">Connection Failed</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
          <button 
            onClick={() => loadData(true)}
            className="w-full bg-primary text-white py-2 rounded-button text-xs font-bold hover:bg-primary-dark transition h-11"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { profile, statistics } = dashboardData || {};

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Banner Greeting Card */}
      <div className="bg-white rounded-card shadow-soft p-4 border border-slate-100/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full min-w-0">
        <div className="flex gap-3 items-center min-w-0 w-full sm:w-auto">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-grow">
            <p className="text-[9px] font-bold text-primary uppercase tracking-wider font-outfit truncate">
              {profile?.department?.name || 'Department'} Field Agent
            </p>
            <h2 className="text-sm sm:text-base font-outfit font-extrabold text-slate-800 truncate">
              {profile?.fullName || 'Field Agent'}
            </h2>
            <p className="text-[9px] text-slate-400 font-semibold truncate">
              ID Code: <span className="text-slate-655 font-mono">{profile?.department?.code || 'N/A'}</span>
            </p>
          </div>
        </div>
        
        {/* Availability Badge Row */}
        <div className="flex gap-1.5 items-center w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-slate-50 shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
            isOnline === 'online' ? 'bg-emerald-50 text-success border-emerald-200' :
            isOnline === 'loading' ? 'bg-slate-50 text-slate-400 border-slate-200' :
            'bg-red-50 text-danger border-red-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full mr-1 ${
              isOnline === 'online' ? 'bg-success' :
              isOnline === 'loading' ? 'bg-slate-400 animate-pulse' :
              'bg-danger'
            }`} />
            {isOnline === 'online' ? 'Online' :
             isOnline === 'loading' ? 'Checking presence...' : 'Offline'}
          </span>

          <button
            onClick={handleToggleDuty}
            disabled={updatingDuty}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border transition hover:scale-105 active:scale-95 cursor-pointer select-none ${
              profile?.availability === 'Available' 
                ? 'bg-emerald-50 text-success border-emerald-200 hover:bg-emerald-100' 
                : profile?.availability === 'Busy'
                ? 'bg-amber-50 text-warning border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title="Click to toggle Duty Status (Available / Offline)"
          >
            <Activity className={`w-3.5 h-3.5 mr-1 ${profile?.availability === 'Available' ? 'text-success animate-pulse' : 'text-slate-400'}`} />
            Duty: {profile?.availability || 'Offline'}
            <span className="ml-1 text-[8px] opacity-70">✎</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid: 2 columns on mobile, 3 on tablet, 6 on desktop */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 w-full min-w-0">
        {[
          { label: 'Active Queue', val: statistics?.active || 0, bg: 'bg-blue-50 text-primary', icon: Activity },
          { label: 'Awaiting Accept', val: statistics?.assigned || 0, bg: 'bg-amber-50 text-warning', icon: Clock },
          { label: 'In Progress', val: statistics?.inProgress || 0, bg: 'bg-indigo-50 text-indigo-650', icon: Wrench },
          { label: 'Resolved', val: profile?.performance?.totalResolved || statistics?.resolved || 0, bg: 'bg-emerald-50 text-success', icon: CheckCircle },
          { label: 'Avg Res Time', val: profile?.performance?.averageResolutionHours ? `${profile.performance.averageResolutionHours.toFixed(1)}h` : 'N/A', bg: 'bg-purple-50 text-purple-650', icon: BarChart2 },
          { label: 'Rating', val: profile?.performance?.rating ? `${profile.performance.rating.toFixed(1)} ★` : '5.0 ★', bg: 'bg-yellow-50 text-yellow-600', icon: Star }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-100/90 p-3 rounded-card shadow-soft w-full min-w-0">
            <div className={`mb-2 grid h-8 w-8 place-items-center rounded-xl ${stat.bg} shrink-0`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-outfit truncate">{stat.label}</p>
            <p className="mt-0.5 font-outfit text-base sm:text-lg font-extrabold text-slate-800 truncate">{stat.val}</p>
          </div>
        ))}
      </section>

      {/* Current Active Task and NEXT ACTION Engine */}
      {activeTask && (
        <section className="bg-gradient-to-br from-blue-50/50 to-indigo-50/20 border border-blue-150 rounded-card p-3.5 sm:p-5 shadow-soft space-y-3 w-full min-w-0 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 w-full min-w-0">
            <div className="min-w-0 w-full sm:w-auto">
              <span className="font-mono text-[9px] font-bold text-primary bg-white border border-primary/20 px-2 py-0.5 rounded inline-block">
                Active Task: #{activeTask.complaintNumber || activeTask._id.slice(-6).toUpperCase()}
              </span>
              <h3 className="font-outfit text-xs sm:text-sm md:text-base font-extrabold text-slate-800 mt-2 truncate w-full">{activeTask.title}</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate w-full">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{activeTask.location?.address}</span>
              </p>
            </div>
            <div className="flex gap-1 shrink-0 mt-1 sm:mt-0 select-none">
              <ComplaintStatusBadge status={activeTask.status} />
              <ComplaintPriorityBadge priority={activeTask.priority} />
            </div>
          </div>

          {/* NEXT ACTION Card - Vertical stacking buttons on mobile */}
          {nextAction && (
            <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full min-w-0">
              <div className="space-y-0.5 min-w-0 flex-grow">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-indigo-500 block">
                  Next Step: {nextAction.step}
                </span>
                <p className="text-[11px] text-slate-500 leading-normal font-medium break-words">
                  {nextAction.text}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-1.5 shrink-0 w-full sm:w-auto">
                {nextAction.status === 'Assigned' && (
                  <>
                    <button
                      disabled={rejectingId === activeTask._id || acceptingId === activeTask._id}
                      onClick={() => handleReject(activeTask._id)}
                      className="rounded-button border border-red-200 text-danger hover:bg-red-50 px-4 h-11 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto select-none cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                      <span>{rejectingId === activeTask._id ? 'Rejecting...' : 'Reject'}</span>
                    </button>
                    <button
                      disabled={acceptingId === activeTask._id || rejectingId === activeTask._id}
                      onClick={() => handleAccept(activeTask._id)}
                      className="rounded-button bg-emerald-600 hover:bg-emerald-700 text-white px-4.5 h-11 text-xs font-bold shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto select-none cursor-pointer"
                    >
                      <Check className="w-4.5 h-4.5" />
                      <span>Accept Assignment</span>
                    </button>
                  </>
                )}

                {nextAction.status === 'Accepted' && (
                  <button
                    disabled={startingId === activeTask._id}
                    onClick={() => handleStartWork(activeTask._id)}
                    className="rounded-button bg-primary hover:bg-primary-dark text-white px-5 h-11 text-xs font-bold shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto select-none cursor-pointer"
                  >
                    <Play className="w-4.5 h-4.5" />
                    <span>Start Work Operations</span>
                  </button>
                )}

                {nextAction.status === 'Reach Location' && (
                  <>
                    <Link
                      to={`/worker/complaints/${activeTask._id}/navigation`}
                      className="rounded-button bg-primary hover:bg-primary-dark text-white px-5 h-11 text-xs font-bold shadow transition flex items-center justify-center gap-1.5 w-full sm:w-auto select-none"
                    >
                      <Navigation className="w-4.5 h-4.5 animate-pulse" />
                      <span>Live In-App Navigation</span>
                    </Link>
                  </>
                )}

                {nextAction.status === 'Update Work' && (
                  <Link
                    to={`/worker/complaints/${activeTask._id}`}
                    className="rounded-button bg-primary hover:bg-primary-dark text-white px-5 h-11 text-xs font-bold shadow transition flex items-center justify-center gap-1.5 w-full sm:w-auto select-none"
                  >
                    <span>Update Progress Details</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Task Queue Section */}
      <div className="bg-white border border-slate-100 rounded-card shadow-soft p-4 space-y-4 w-full min-w-0 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 pb-3 gap-3 w-full min-w-0">
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm md:text-base font-outfit flex items-center gap-2">
              <Wrench className="w-4.5 h-4.5 text-primary" />
              Assigned Dispatch Queue
            </h3>
            <p className="text-[9.5px] text-slate-400 mt-0.5">List of municipal dispatcher tasks assigned to your division.</p>
          </div>
          
          {/* Scrollable Filters - Scroll Bar contained dynamically to prevent page-width leaks */}
          <div className="w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-none flex bg-slate-50 border border-slate-205 p-0.5 rounded-button text-[10px] select-none">
            {[
              { label: 'Active Queue', value: 'active' },
              { label: 'Awaiting', value: 'Assigned' },
              { label: 'Accepted', value: 'Accepted' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Resolved', value: 'Resolved' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-button font-bold transition inline-block text-center ${
                  statusFilter === tab.value 
                    ? 'bg-white text-primary shadow-sm font-extrabold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-205 w-full min-w-0">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <h4 className="font-bold text-slate-700 text-xs">Empty Queue</h4>
            <p className="text-[9.5px] text-slate-400 max-w-xs mx-auto mt-0.5">
              You have no active tasks matching this selected filter state.
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 w-full min-w-0">
            {filteredTasks.map((c) => {
              const isTaskAccepted = c.timeline?.some(event => event.eventType === 'Worker Accepted') || false;
              
              return (
                <div 
                  key={c._id} 
                  className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm hover:shadow-premium hover:border-slate-200 transition flex flex-col justify-between gap-3.5 w-full min-w-0 max-w-full"
                >
                  <div className="space-y-2 min-w-0 w-full">
                    <div className="flex justify-between items-center gap-2 w-full min-w-0">
                      <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate shrink-0 max-w-[100px]">
                        #{c.complaintNumber || c._id.slice(-6).toUpperCase()}
                      </span>
                      <div className="flex gap-1 shrink-0 select-none">
                        <ComplaintStatusBadge status={c.status} />
                        <ComplaintPriorityBadge priority={c.priority} />
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-805 text-xs sm:text-sm line-clamp-1 w-full">{c.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 w-full break-words">{c.description}</p>
                    
                    <div className="flex items-start gap-1.5 text-[10.5px] text-slate-500 pt-1 w-full min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                      <span className="truncate flex-grow">{c.location?.address || 'Pending location verification'}</span>
                    </div>
                  </div>

                  {/* Card Actions Bottom Row - Optimized button sizing and vertical stacking on mobile */}
                  <div className="border-t border-slate-50 pt-3 mt-1 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center w-full min-w-0">
                    <span className="text-[9px] text-slate-400 font-semibold shrink-0">
                      Assigned: {new Date(c.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex gap-1.5 w-full sm:w-auto justify-end">
                      {c.status === 'Assigned' && !isTaskAccepted && (
                        <>
                          <button
                            disabled={rejectingId === c._id || acceptingId === c._id}
                            onClick={() => handleReject(c._id)}
                            className="inline-flex items-center justify-center w-11 h-11 rounded-button text-danger border border-red-150 hover:bg-red-50 transition disabled:opacity-50 shrink-0 cursor-pointer select-none"
                            title="Reject and re-route task"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                          <button
                            disabled={acceptingId === c._id || rejectingId === c._id}
                            onClick={() => handleAccept(c._id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 h-11 rounded-button text-xs font-bold bg-emerald-50 text-success border border-emerald-250 hover:bg-emerald-100/50 transition disabled:opacity-50 flex-grow sm:flex-grow-0 cursor-pointer select-none"
                          >
                            <Check className="w-4 h-4" />
                            <span>{acceptingId === c._id ? 'Accepting...' : 'Accept'}</span>
                          </button>
                        </>
                      )}

                      {c.status === 'Assigned' && isTaskAccepted && (
                        <button
                          disabled={startingId === c._id}
                          onClick={() => handleStartWork(c._id)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-button text-xs font-bold bg-primary text-white border border-primary hover:bg-primary-dark transition disabled:opacity-50 flex-grow sm:flex-grow-0 cursor-pointer select-none"
                        >
                          <Play className="w-4 h-4" />
                          <span>{startingId === c._id ? 'Starting...' : 'Start Work'}</span>
                        </button>
                      )}

                      <Link 
                        to={`/worker/complaints/${c._id}`}
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-100 text-slate-750 hover:bg-slate-200 px-3.5 h-11 rounded-button font-bold text-xs transition flex-grow sm:flex-grow-0 select-none"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                        <span>Details</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Rejection Prompt Dialog */}
      <ConfirmDialog
        isOpen={rejectModalOpen}
        title="Reject Task Assignment"
        message="Please state your reason for rejecting this assignment. The complaint will be returned to the department pool for reassignment."
        confirmText="Confirm Rejection"
        confirmVariant="danger"
        iconType="warning"
        isLoading={isRejecting}
        isPrompt={true}
        promptLabel="Rejection Reason"
        promptPlaceholder="e.g., Equipment unavailable / outside jurisdiction"
        promptRequired={true}
        onConfirm={confirmReject}
        onCancel={() => {
          if (!isRejecting) {
            setRejectModalOpen(false);
            setRejectTargetId(null);
          }
        }}
      />

    </div>
  );
}
