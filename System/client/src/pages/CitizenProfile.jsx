import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { complaintApi } from '../api/complaint.api';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Settings, 
  LogOut, 
  ClipboardList, 
  CheckCircle2, 
  Clock3,
  ChevronRight,
  Bell
} from 'lucide-react';

import { toast } from 'react-toastify';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function CitizenProfile() {
  const { dbUser } = useApp();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await complaintApi.citizenList();
        setComplaints(response.data.data || []);
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = useMemo(() => ({
    total: complaints.length,
    active: complaints.filter(c => ['Pending', 'Under Review', 'Assigned', 'In Progress'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'Resolved').length
  }), [complaints]);

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      toast.error('Failed to sign out.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!dbUser) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-2xl mx-auto overflow-x-hidden min-w-0 flex flex-col">
        {/* Avatar and name skeleton */}
        <div className="bg-white border border-slate-100 rounded-card p-5 shadow-soft flex flex-col items-center space-y-3 animate-pulse motion-reduce:animate-none">
          <div className="h-16 w-16 rounded-full bg-slate-200" />
          <div className="h-4 w-28 bg-slate-200 rounded" />
          <div className="h-5 w-32 bg-slate-200 rounded" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 p-3 rounded-xl shadow-soft flex flex-col items-center space-y-2 animate-pulse motion-reduce:animate-none">
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
              <div className="h-3 w-10 bg-slate-200 rounded" />
              <div className="h-4 w-6 bg-slate-200 rounded" />
            </div>
          ))}
        </div>

        {/* Account Details skeleton */}
        <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3.5 animate-pulse motion-reduce:animate-none">
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-6 w-6 rounded bg-slate-200 shrink-0" />
                <div className="space-y-1.5 flex-grow">
                  <div className="h-2 w-12 bg-slate-200 rounded" />
                  <div className="h-3 w-1/3 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions list skeleton */}
        <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3 animate-pulse motion-reduce:animate-none">
          <div className="h-10 w-full bg-slate-200 rounded" />
          <div className="h-10 w-full bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-2xl mx-auto overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Identity Summary Card */}
      <section className="rounded-card border border-slate-100 bg-white p-5 shadow-soft w-full min-w-0 flex flex-col items-center text-center space-y-3">
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary border-4 border-primary-light flex items-center justify-center text-xl font-extrabold uppercase font-outfit select-none">
          {dbUser?.fullName ? dbUser.fullName.slice(0, 2) : 'CZ'}
        </div>
        
        <div className="min-w-0 w-full">
          <h2 className="font-outfit text-base sm:text-lg font-extrabold text-slate-805 leading-snug truncate">
            {dbUser?.fullName || 'Citizen Reporter'}
          </h2>
          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider select-none font-outfit">
            <Shield className="w-3 h-3 text-primary shrink-0" />
            Registered Citizen
          </span>
        </div>
      </section>

      {/* Stats summaries columns */}
      <section className="grid grid-cols-3 gap-2 w-full min-w-0">
        <StatItem label="Filed" value={stats.total} icon={ClipboardList} color="text-primary bg-blue-50" loading={loading} />
        <StatItem label="Active" value={stats.active} icon={Clock3} color="text-amber-600 bg-amber-50" loading={loading} />
        <StatItem label="Resolved" value={stats.resolved} icon={CheckCircle2} color="text-success bg-emerald-50" loading={loading} />
      </section>

      {/* Account Details */}
      <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0 space-y-3.5">
        <h3 className="font-outfit text-xs font-bold text-slate-805 border-b pb-2 border-slate-50 uppercase tracking-wide">
          Account details
        </h3>
        
        <div className="space-y-3 min-w-0">
          <DetailRow icon={User} label="Full name" value={dbUser?.fullName} />
          <DetailRow icon={Mail} label="Email Address" value={dbUser?.email} />
          {dbUser?.phone && (
            <DetailRow icon={Phone} label="Contact phone" value={dbUser?.phone} />
          )}
        </div>
      </section>

      {/* Navigation menu options */}
      <section className="rounded-card border border-slate-100 bg-white overflow-hidden shadow-soft w-full min-w-0 divide-y divide-slate-100">
        <Link 
          to="/citizen/notifications" 
          className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition text-xs font-bold text-slate-700 select-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-slate-450 shrink-0" />
            <span>Notification Preferences</span>
          </div>
          <ChevronRight className="w-4.5 h-4.5 text-slate-300 shrink-0" />
        </Link>

        <Link 
          to="/citizen/settings" 
          className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition text-xs font-bold text-slate-700 select-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-slate-450 shrink-0" />
            <span>System Settings</span>
          </div>
          <ChevronRight className="w-4.5 h-4.5 text-slate-300 shrink-0" />
        </Link>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-3.5 hover:bg-red-50/50 transition text-xs font-bold text-danger select-none cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4.5 h-4.5 text-red-400 shrink-0" />
            <span>Sign Out Account</span>
          </div>
          <ChevronRight className="w-4.5 h-4.5 text-red-200 shrink-0" />
        </button>
      </section>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutModalOpen}
        title="Sign Out"
        message="Are you sure you want to sign out of your JanSamadhan account?"
        confirmText="Sign Out"
        confirmVariant="danger"
        iconType="danger"
        isLoading={isLoggingOut}
        onConfirm={confirmLogout}
        onCancel={() => {
          if (!isLoggingOut) {
            setLogoutModalOpen(false);
          }
        }}
      />

    </div>
  );
}

function StatItem({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-soft w-full min-w-0">
      <div className={`mx-auto h-8 w-8 rounded-lg ${color} flex items-center justify-center mb-1 shrink-0`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-[9px] font-bold text-slate-400 font-outfit uppercase tracking-wider truncate">{label}</p>
      <p className="mt-0.5 font-outfit text-sm font-extrabold text-slate-805 truncate">
        {loading ? <span className="inline-block h-5 w-6 animate-pulse rounded bg-slate-100" /> : value}
      </p>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0 w-full">
      <Icon className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-grow w-full">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-outfit truncate">{label}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-700 truncate">{value || 'Not configured'}</p>
      </div>
    </div>
  );
}
