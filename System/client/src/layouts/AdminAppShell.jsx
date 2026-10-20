import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { 
  Home, 
  ClipboardList, 
  Users, 
  Bell, 
  Menu, 
  X, 
  Building2, 
  Map, 
  TrendingUp, 
  Settings, 
  LogOut,
  Wifi, 
  WifiOff,
  MapPin,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import AdminErrorBoundary from '../components/AdminErrorBoundary';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function AdminAppShell() {
  const { unreadNotificationsCount } = useApp();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Socket state
  const [socketConnected, setSocketConnected] = useState(false);

  // Connection & Offline indicators
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSyncing, setShowSyncing] = useState(false);
  
  // Mobile drawer controls
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowSyncing(true);
      setTimeout(() => setShowSyncing(false), 2000);
      toast.success('Internet restored. Synchronizing management console...');
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning('Working offline. Some live controls may be disabled.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor socket status
  useEffect(() => {
    if (!socket) {
      setSocketConnected(false);
      return;
    }

    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  // Handle auto-closing more menu on navigation
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', path: '/admin/dashboard', icon: Home },
    { label: 'Complaints', path: '/admin/complaints', icon: ClipboardList },
    { label: 'Workers', path: '/admin/workers', icon: Users },
    { label: 'Alerts', path: '/admin/notifications', icon: Bell, badge: unreadNotificationsCount }
  ];

  const moreItems = [
    { label: 'Staff Management', path: '/admin/staff', icon: UserCheck },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    { label: 'Operations Map', path: '/admin/map', icon: Map },
    { label: 'Analytics', path: '/admin/analytics', icon: TrendingUp },
    { label: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      toast.error('Sign out failed.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isMapPage = location.pathname === '/admin/map';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden w-full">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 animate-pulse shadow-md">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Operations control console running offline.</span>
        </div>
      )}

      {/* Sync Notification Banner */}
      {showSyncing && (
        <div className="bg-emerald-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <Wifi className="w-4 h-4 shrink-0 animate-bounce" />
          <span>Connected. Syncing real-time parameters...</span>
        </div>
      )}

      {/* Top App Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm w-full pt-[env(safe-area-inset-top)] shrink-0">
        <div className="h-14 md:h-16 px-3 sm:px-4 flex items-center justify-between w-full">
          {/* Logo */}
          <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-primary shrink-0 select-none">
            <MapPin className="h-5.5 w-5.5 text-primary animate-pulse" />
            <span className="font-extrabold text-sm sm:text-base tracking-tight font-outfit text-slate-805">
              JanSamadhan<span className="text-primary-dark font-black"> HQ</span>
            </span>
          </Link>

          {/* Action stats */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Server Connection Indicators */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full" title="Presence Status">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${socketConnected ? 'bg-success' : 'bg-danger'}`} />
              <span className="text-[9px] font-bold text-slate-505 uppercase tracking-wide">
                {socketConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Notification alert bells */}
            <Link to="/admin/notifications" className="relative p-1.5 text-slate-500 hover:text-primary transition rounded-full hover:bg-slate-50">
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-danger text-white text-[8px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full border border-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            {/* Clerk Account Widget */}
            <div className="flex items-center shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Layout View */}
      <div className="flex-grow flex w-full relative min-w-0">
        
        {/* Desktop sidebar - shown at viewports >= md */}
        <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-100 shrink-0 sticky top-16 h-[calc(100vh-4rem)] p-4 justify-between select-none">
          <div className="space-y-6">
            {/* Header Identity Badge */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-sm font-extrabold uppercase">
                AD
              </div>
              <h4 className="font-bold text-slate-805 text-xs mt-2 font-outfit truncate">Command Desk</h4>
              <p className="text-[9px] font-bold text-primary uppercase mt-0.5 tracking-wider truncate">System Administrator</p>
            </div>

            {/* Sidebar Navigation Link items */}
            <nav className="space-y-0.5">
              {[...navItems, ...moreItems].map((item) => {
                const IconComp = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-button text-[11px] font-bold tracking-wide transition ${
                      isActive 
                        ? 'bg-primary text-white shadow-premium' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded-full ${
                        location.pathname === item.path ? 'bg-white text-primary' : 'bg-danger text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-button text-[11px] font-bold text-danger hover:bg-red-50/50 transition cursor-pointer text-left w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* Core content wrapper */}
        <main className={`flex-grow w-full relative flex flex-col ${
          isMapPage
            ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden'
            : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6 overflow-y-auto'
        } min-w-0`}>
          <div className="w-full max-w-[1600px] mx-auto flex-grow flex flex-col min-w-0">
            <AdminErrorBoundary>
              <Outlet />
            </AdminErrorBoundary>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation bar - viewports < md */}
      <nav className="md:hidden bg-white/95 backdrop-blur border-t border-slate-100 fixed bottom-0 left-0 right-0 z-45 flex items-center justify-around pb-[env(safe-area-inset-bottom)] h-[calc(3.5rem+env(safe-area-inset-bottom))] shadow-lg shrink-0">
        {navItems.map((item) => {
          const IconComp = item.icon;
          const isTabActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition text-center ${
                isTabActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <div className="relative">
                <IconComp className={`w-4.5 h-4.5 transition-transform duration-205 ${isTabActive ? 'scale-110 stroke-[2.5px]' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-danger text-white text-[8px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full border border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[8.5px] font-bold mt-0.5 tracking-wide ${isTabActive ? 'font-extrabold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Options Tab trigger bottom sheet */}
        <button
          onClick={() => setMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition text-center focus:outline-none ${
            moreItems.some(i => location.pathname === i.path) ? 'text-primary' : 'text-slate-400 hover:text-slate-655'
          }`}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Menu className="w-4.5 h-4.5" />
          <span className="text-[8.5px] font-bold mt-0.5 tracking-wide">More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer Backdrop */}
      {moreMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/45 backdrop-blur-sm transition-opacity"
          onClick={() => setMoreMenuOpen(false)}
        />
      )}

      {/* Mobile "More" Bottom Sheet drawer */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-150 rounded-t-card p-4 space-y-4 shadow-soft transform transition-transform duration-300 pb-[calc(1rem+env(safe-area-inset-bottom))] ${
        moreMenuOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex justify-between items-center border-b pb-2 border-slate-100">
          <h3 className="font-outfit text-xs font-bold text-slate-808 uppercase tracking-wide">Administrative Desk</h3>
          <button 
            type="button"
            onClick={() => setMoreMenuOpen(false)}
            className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {moreItems.map((item) => {
            const IconComp = item.icon;
            const isItemActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between p-3 rounded-button text-xs font-bold transition select-none ${
                  isItemActive 
                    ? 'bg-primary text-white shadow-soft font-extrabold' 
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComp className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${isItemActive ? 'text-white' : 'text-slate-300'}`} />
              </Link>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 rounded-button text-xs font-bold text-danger hover:bg-red-50/50 transition cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              <span>Sign Out Session</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-200" />
          </button>
        </nav>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutModalOpen}
        title="Sign Out of Admin Desk"
        message="Are you sure you want to terminate your current administrative session?"
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
