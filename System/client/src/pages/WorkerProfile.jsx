import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { workerApi } from '../api/worker.api';
import { 
  User, 
  Briefcase, 
  MapPin, 
  Star, 
  CheckCircle, 
  Wrench, 
  Clock, 
  Award,
  Loader2,
  AlertCircle,
  Shield,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function WorkerProfile() {
  const { dbUser, setDbUser } = useApp();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingDuty, setUpdatingDuty] = useState(false);

  const handleToggleDuty = async () => {
    if (updatingDuty) return;
    const current = profileData?.profile?.availability || dbUser?.availability || 'Available';
    const nextStatus = current === 'Available' ? 'Offline' : 'Available';

    setProfileData((prev) => {
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
      setProfileData((prev) => {
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

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await workerApi.dashboard();
      if (res.data.success) {
        setProfileData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching worker profile:', err);
      setError(err.message || 'Failed to sync worker operational data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading && !profileData) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh] w-full">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400 font-outfit">Loading agent context...</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 min-h-[50vh] w-full">
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-soft w-full max-w-sm text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="text-sm font-bold text-slate-800 font-outfit">Sync Failed</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <button 
            onClick={loadProfile}
            className="w-full bg-primary text-white py-2 rounded-button text-xs font-bold hover:bg-primary-dark transition h-11"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  const { profile, statistics } = profileData || {};
  const skills = profile?.department?.skills || ['General Repairs', 'Pothole Filling', 'Debris Clearing', 'Site Inspection'];

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Header Back Button */}
      <div className="flex justify-between items-center w-full">
        <Link to="/worker/dashboard" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Identity Card - Mobile First */}
      <div className="bg-white border border-slate-100 rounded-card p-5 shadow-soft flex flex-col items-center text-center space-y-3.5 relative overflow-hidden w-full min-w-0">
        {/* Decorative Badge */}
        <div className="absolute top-3 right-3 flex gap-2">
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

        {/* Profile Avatar Big Icon */}
        <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-extrabold uppercase font-outfit shadow-inner shrink-0">
          {profile?.fullName ? profile.fullName.slice(0, 2) : 'WA'}
        </div>

        <div className="min-w-0 w-full">
          <h2 className="text-sm sm:text-base md:text-lg font-outfit font-extrabold text-slate-800 leading-snug truncate w-full">
            {profile?.fullName || 'Field Dispatcher'}
          </h2>
          <p className="text-[9.5px] font-bold text-primary uppercase mt-0.5 tracking-wider flex items-center justify-center gap-1">
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{profile?.department?.name || 'Road Operations Division'}</span>
          </p>
          <p className="text-[9px] text-slate-400 font-mono mt-1 truncate">
            Agent Code: {profile?.clerkId || 'CIR-381-PWA'}
          </p>
        </div>
      </div>

      {/* Performance Metrics Cards grid */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4 w-full min-w-0">
        {[
          { label: 'Completed Tasks', val: profile?.performance?.totalResolved || statistics?.resolved || 0, bg: 'bg-emerald-50 text-success', icon: CheckCircle },
          { label: 'Active Tasks', val: statistics?.active || 0, bg: 'bg-blue-50 text-primary', icon: Wrench },
          { label: 'Avg Rating', val: profile?.performance?.rating ? `${profile.performance.rating.toFixed(1)} ★` : '5.0 ★', bg: 'bg-yellow-50 text-yellow-600', icon: Star },
          { label: 'Avg Resolution Time', val: profile?.performance?.averageResolutionHours ? `${profile.performance.averageResolutionHours.toFixed(1)}h` : 'N/A', bg: 'bg-purple-50 text-purple-650', icon: Clock }
        ].map((metric, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-3 rounded-card shadow-soft text-center space-y-1 w-full min-w-0">
            <div className={`mx-auto grid h-8 w-8 place-items-center rounded-xl ${metric.bg} shrink-0`}>
              <metric.icon className="h-4 w-4" />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-outfit mt-1 truncate w-full">{metric.label}</p>
            <p className="font-outfit text-sm sm:text-base font-extrabold text-slate-800 truncate w-full">{metric.val}</p>
          </div>
        ))}
      </div>

      {/* Skills & Categories section */}
      <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3 w-full min-w-0">
        <h3 className="font-outfit text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b pb-2 border-slate-50 shrink-0">
          <Award className="w-4.5 h-4.5 text-primary" />
          Field dispatcher skill set
        </h3>
        <p className="text-[10px] text-slate-500 font-medium leading-normal">
          The dispatch engine routes tasks to your queue based on these department specialized skills:
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1 w-full">
          {skills.map((skill, idx) => (
            <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-705 px-2.5 py-1 rounded-button text-[9.5px] font-bold uppercase tracking-wider inline-block">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Organization Details Panel */}
      <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3.5 w-full min-w-0">
        <h3 className="font-outfit text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b pb-2 border-slate-50 shrink-0">
          <Shield className="w-4.5 h-4.5 text-primary" />
          Division Context
        </h3>
        <div className="space-y-3 text-xs text-slate-655 w-full min-w-0">
          <div className="flex justify-between items-center w-full gap-2">
            <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider shrink-0">Department Code</span>
            <span className="font-mono font-bold text-slate-700 truncate">{profile?.department?.code || 'RD-ICH-01'}</span>
          </div>
          <div className="flex justify-between items-center w-full gap-2">
            <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider shrink-0">Authorized Role</span>
            <span className="font-semibold text-slate-700 truncate">Official Municipal Worker</span>
          </div>
          <div className="flex justify-between items-center w-full gap-2">
            <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wider shrink-0">Assigned City Portal</span>
            <span className="font-semibold text-slate-700 truncate">JanSamadhan Smart City, Ichalkaranji</span>
          </div>
        </div>
      </div>

    </div>
  );
}
