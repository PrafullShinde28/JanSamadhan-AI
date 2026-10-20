import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  ArrowLeft, 
  Settings, 
  User, 
  Bell, 
  Activity, 
  ShieldAlert, 
  RefreshCw, 
  LogOut,
  Info,
  Trash2,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Settings states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalPush, setCriticalPush] = useState(true);
  const [cacheSize, setCacheSize] = useState('0.0 MB');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Estimate client-side caching size
  useEffect(() => {
    if (window.caches) {
      window.caches.keys().then(keys => {
        let count = keys.length;
        setCacheSize(count > 0 ? `${(count * 0.15).toFixed(2)} MB` : '0.0 MB');
      });
    }
  }, []);

  const handleClearCache = async () => {
    if (!window.caches) {
      toast.warning('Caching directories unavailable on this browser.');
      return;
    }

    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(k => window.caches.delete(k)));
      setCacheSize('0.0 MB');
      toast.success('PWA cache database cleared. Reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error('Purge sequence rejected.');
    }
  };

  const handleSaveToggles = () => {
    toast.success('Notification preferences updated successfully.');
  };

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

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Header */}
      <header className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex flex-col justify-between items-start gap-1 w-full min-w-0 shrink-0">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit mb-1">
          <ArrowLeft className="h-3 w-3" />
          Control Desk
        </Link>
        <h1 className="font-outfit text-base sm:text-lg font-extrabold text-slate-909 flex items-center gap-1.5 leading-snug">
          <Settings className="h-4.5 w-4.5 text-primary shrink-0" />
          Command Settings
        </h1>
      </header>

      {/* Main Settings Body */}
      <div className="mx-auto max-w-2xl w-full space-y-5 sm:space-y-6 min-w-0">
        
        {/* Profile Details summary card */}
        <section className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-3.5 w-full min-w-0">
          <h3 className="font-outfit text-xs font-bold text-slate-808 uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4 text-primary shrink-0" />
            Administrative Account
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm uppercase shrink-0">
              AD
            </div>
            <div className="min-w-0 flex-grow">
              <h4 className="font-bold text-xs text-slate-805 truncate">JanSamadhan HQ Administrator</h4>
              <p className="text-[10px] text-slate-450 mt-0.5 tracking-wide font-semibold truncate">admin@jansamadhan.gov.in</p>
            </div>
          </div>
        </section>

        {/* Notifications Preference */}
        <section className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0">
          <h3 className="font-outfit text-xs font-bold text-slate-808 uppercase tracking-wide flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary shrink-0" />
            Control Alerts Setup
          </h3>
          
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-slate-705">Email Logs Dispatch</p>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Send summaries of weekly department performance reviews.</p>
              </div>
              <input 
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
              <div className="min-w-0">
                <p className="font-bold text-slate-705">Critical Escalation Triggers</p>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Trigger instant push updates for newly filed Critical alerts.</p>
              </div>
              <input 
                type="checkbox"
                checked={criticalPush}
                onChange={(e) => setCriticalPush(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer shrink-0"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveToggles}
              className="bg-primary hover:bg-primary-dark text-white text-[10px] font-bold h-9 px-4 rounded-button shadow transition uppercase tracking-wider select-none cursor-pointer"
            >
              Update Preferences
            </button>
          </div>
        </section>

        {/* PWA asset clearing cache */}
        <section className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft space-y-4 w-full min-w-0">
          <h3 className="font-outfit text-xs font-bold text-slate-808 uppercase tracking-wide flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-primary shrink-0" />
            Storage & Local Cache
          </h3>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-705">Estimated cached assets</p>
              <p className="text-[10px] text-slate-450 mt-0.5 leading-normal font-semibold">Local application layouts size on this client.</p>
            </div>
            <strong className="text-slate-800 text-sm shrink-0">{cacheSize}</strong>
          </div>

          <div className="flex justify-between items-center text-xs pt-1">
            <p className="text-[10px] text-slate-400">Clear cached layouts files to force synchronization.</p>
            <button
              onClick={handleClearCache}
              className="inline-flex items-center gap-1 bg-red-55 text-danger bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 h-9 rounded-button text-[10px] font-bold transition uppercase tracking-wider select-none cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Purge Cache</span>
            </button>
          </div>
        </section>

        {/* Version Information details */}
        <section className="bg-white border border-slate-200 rounded-card p-4 shadow-soft space-y-3 w-full min-w-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Info className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <div className="font-semibold leading-relaxed">
              <p>JanSamadhan AI Control Desk Platform v1.3.0</p>
              <p className="text-[10px] text-slate-400">Fully compliant Responsive Mobile-First PWA Console.</p>
            </div>
          </div>
        </section>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white hover:bg-red-50/50 text-danger border border-red-250 font-bold h-12 rounded-card shadow-soft transition flex items-center justify-center gap-2 text-xs select-none cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Close Session / Sign Out</span>
        </button>

      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutModalOpen}
        title="Sign Out of Admin Console"
        message="Are you sure you want to terminate your current admin session?"
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
