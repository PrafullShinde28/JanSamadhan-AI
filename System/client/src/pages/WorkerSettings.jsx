import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  MapPin, 
  HardDrive, 
  LogOut, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function WorkerSettings() {
  const { signOut } = useAuth();
  const { dbUser } = useApp();
  const navigate = useNavigate();

  // Browser Permission states
  const [notifPermission, setNotifPermission] = useState(Notification.permission);
  const [gpsPermission, setGpsPermission] = useState('prompt');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load GPS permission diagnostics on mount
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setGpsPermission(status.state);
        status.onchange = () => {
          setGpsPermission(status.state);
        };
      });
    }
  }, []);

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        toast.success('Notification permissions enabled!');
      } else {
        toast.warning('Notifications permission denied.');
      }
    } catch (err) {
      console.error('Failed to request notifications permission:', err);
    }
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
        toast.success('PWA cache cleared successfully. App will reload to sync.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        toast.error('Failed to clear client caches.');
      }
    } else {
      toast.warning('Cache storage is not supported by this browser.');
    }
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success('Successfully logged out.');
      navigate('/');
    } catch (err) {
      toast.error('Sign out failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Back button */}
      <div className="flex justify-between items-center w-full">
        <Link to="/worker/dashboard" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <header className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
        <p className="text-[9px] font-bold tracking-wide text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block font-outfit uppercase">
          App Settings
        </p>
        <h1 className="mt-2 font-outfit text-sm sm:text-base md:text-lg font-extrabold text-slate-800 leading-snug">PWA Client Controls</h1>
        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Manage browser permissions, local cached shell storage and login sessions.</p>
      </header>

      {/* Settings Options Stack */}
      <div className="space-y-4 w-full min-w-0">
        
        {/* Notifications Permission settings */}
        <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft flex items-center justify-between gap-3 w-full min-w-0">
          <div className="flex gap-3 items-start min-w-0">
            <div className="h-9 w-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm">In-App Notifications</h3>
              <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal font-semibold">
                Permission status: <span className="font-bold font-mono text-slate-655 uppercase">{notifPermission}</span>
              </p>
            </div>
          </div>
          
          {notifPermission !== 'granted' ? (
            <button
              onClick={requestNotifPermission}
              className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3 py-2 rounded-button transition shrink-0 select-none cursor-pointer h-9"
            >
              Request
            </button>
          ) : (
            <div className="text-success flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded border border-emerald-100 shrink-0">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Active</span>
            </div>
          )}
        </div>

        {/* GPS Geolocation permissions diagnostic */}
        <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft flex items-center justify-between gap-3 w-full min-w-0">
          <div className="flex gap-3 items-start min-w-0">
            <div className="h-9 w-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm">GPS Geolocation Lock</h3>
              <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal font-semibold">
                Authorization diagnostic: <span className="font-bold font-mono text-slate-655 uppercase">{gpsPermission}</span>
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider px-2 py-1 rounded border shrink-0 ${
            gpsPermission === 'granted' 
              ? 'text-success bg-emerald-50 border-emerald-100' 
              : 'text-amber-600 bg-amber-50 border-amber-200'
          }`}>
            {gpsPermission === 'granted' ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Prompt</span>
              </>
            )}
          </div>
        </div>

        {/* Cache Storage Management */}
        <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft flex items-center justify-between gap-3 w-full min-w-0">
          <div className="flex gap-3 items-start min-w-0">
            <div className="h-9 w-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <h3 className="font-bold text-slate-805 text-xs sm:text-sm">Storage Cache</h3>
              <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal font-semibold">Flush local app shell and asset cache variables to trigger synchronization update.</p>
            </div>
          </div>
          
          <button
            onClick={handleClearCache}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-button transition shrink-0 select-none cursor-pointer h-9"
          >
            Flush Cache
          </button>
        </div>

        {/* Logout Section */}
        <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft flex items-center justify-between gap-3 w-full min-w-0">
          <div className="flex gap-3 items-start min-w-0">
            <div className="h-9 w-9 bg-red-50 text-danger rounded-xl flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <h3 className="font-bold text-slate-805 text-xs sm:text-sm">Logout Session</h3>
              <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal font-semibold">Terminate active agent session credentials on this browser.</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="bg-danger hover:bg-danger/90 text-white text-xs font-bold px-4 py-2 rounded-button transition shrink-0 select-none cursor-pointer h-9"
          >
            Sign Out
          </button>
        </div>

      </div>

      {/* Version details info */}
      <div className="text-center text-[10px] text-slate-400 font-semibold pt-4 shrink-0 select-none">
        JanSamadhan AI PWA • Version 1.0.0 (Production)
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutModalOpen}
        title="Sign Out of Worker Portal"
        message="Are you sure you want to end your current session? You will need to sign in again to access assignments."
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
