import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { 
  Home, 
  FileText, 
  Map, 
  Bell, 
  User, 
  Settings, 
  Wifi, 
  WifiOff,
  LogOut,
  MapPin,
  Camera
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function CitizenAppShell() {
  const { dbUser, unreadNotificationsCount } = useApp();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // Socket state
  const [socketConnected, setSocketConnected] = useState(false);

  // Offline status tracking
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSyncing, setShowSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowSyncing(true);
      setTimeout(() => setShowSyncing(false), 2000);
      toast.success('Internet connection restored. Syncing reports...');
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning('Working offline. Some maps and submissions will be unavailable.');
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

  const navItems = [
    { label: 'Home', path: '/citizen/dashboard', icon: Home },
    { label: 'Reports', path: '/citizen/complaints', icon: FileText },
    { label: 'Map', path: '/citizen/map', icon: Map },
    { label: 'Alerts', path: '/citizen/notifications', icon: Bell, badge: unreadNotificationsCount },
    { label: 'Profile', path: '/citizen/profile', icon: User }
  ];

  const isMapOrCameraPage = location.pathname === '/citizen/map' || location.pathname === '/citizen/report';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden w-full">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 animate-pulse shadow-md transition-all duration-300">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are currently offline. Submissions will be blocked.</span>
        </div>
      )}

      {/* Reconnected sync notification */}
      {showSyncing && (
        <div className="bg-emerald-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md transition-all duration-300">
          <Wifi className="w-4 h-4 shrink-0 animate-bounce" />
          <span>Connected. Synchronizing citizen portal...</span>
        </div>
      )}

      {/* Top Header App Bar - iOS safe-area top padding */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm w-full pt-[env(safe-area-inset-top)] shrink-0">
        <div className="h-14 md:h-16 px-3 sm:px-4 flex items-center justify-between w-full">
          {/* Brand Logo */}
          <Link to="/citizen/dashboard" className="flex items-center gap-1.5 text-primary shrink-0 select-none">
            <MapPin className="h-5.5 w-5.5 text-primary animate-pulse" />
            <span className="font-extrabold text-sm sm:text-base tracking-tight font-outfit text-slate-800">
              JanSamadhan<span className="text-primary"> AI</span>
            </span>
          </Link>

          {/* Action Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Socket / Server Connection State */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-205 px-2 py-0.5 rounded-full" title="Presence Status">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${socketConnected ? 'bg-success' : 'bg-danger'}`} />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                {socketConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Notification Quick Badge */}
            <Link to="/citizen/notifications" className="relative p-1.5 text-slate-500 hover:text-primary transition rounded-full hover:bg-slate-50">
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-danger text-white text-[8px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full border border-white">
                  {unreadNotificationsCount}
                </span>
              )}
            </Link>

            {/* Clerk Account Profile Widget */}
            <div className="flex items-center shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Layout: Sidebar (desktop) + Outlet Page Content */}
      <div className="flex-grow flex w-full relative min-w-0">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-100 shrink-0 sticky top-16 h-[calc(100vh-4rem)] p-4 justify-between select-none">
          <div className="space-y-6">
            
            {/* Citizen Context Header */}
            {dbUser && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-205 text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-sm font-extrabold font-outfit uppercase">
                  {dbUser.fullName ? dbUser.fullName.slice(0, 2) : 'CZ'}
                </div>
                <h4 className="font-bold text-slate-805 text-xs mt-2 font-outfit truncate">{dbUser.fullName || 'Citizen Reporter'}</h4>
                <p className="text-[9px] font-bold text-primary uppercase mt-0.5 tracking-wider truncate">Registered Citizen</p>
                <div className="mt-2 flex items-center justify-center gap-1 text-[9.5px] font-semibold text-slate-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-success' : 'bg-danger'}`} />
                  <span>Portal: <strong>Active</strong></span>
                </div>
              </div>
            )}

            {/* Sidebar Navigation Options */}
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-button text-[11px] font-bold tracking-wide transition ${
                      isActive 
                        ? 'bg-primary text-white shadow-premium' 
                        : 'text-slate-505 hover:text-slate-850 hover:bg-slate-50'
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
              
              {/* Settings Nav Option */}
              <NavLink
                to="/citizen/settings"
                className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-button text-[11px] font-bold tracking-wide transition ${
                  isActive 
                    ? 'bg-primary text-white shadow-premium' 
                    : 'text-slate-505 hover:text-slate-850 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </NavLink>
            </nav>
          </div>

          <Link
            to="/citizen/settings"
            className="flex items-center gap-2 px-3 py-2 rounded-button text-[11px] font-bold text-danger hover:bg-red-50/50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Settings Page</span>
          </Link>
        </aside>

        {/* Primary Page Component viewport - min-w-0 prevents layout blowout */}
        <main className={`flex-grow w-full relative flex flex-col ${
          isMapOrCameraPage
            ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 overflow-hidden'
            : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6 overflow-y-auto'
        } min-w-0`}>
          {/* Layout Container */}
          <div className="w-full max-w-[1440px] mx-auto flex-grow flex flex-col min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Tab Bar - iOS safe-area bottom padding */}
      <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around pb-[env(safe-area-inset-bottom)] h-[calc(3.5rem+env(safe-area-inset-bottom))] shadow-lg shrink-0">
        {navItems.map((item) => {
          const IconComp = item.icon;
          const isTabActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition text-center ${
                isTabActive ? 'text-primary' : 'text-slate-400 hover:text-slate-655'
              }`}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <div className="relative">
                <IconComp className={`w-4.5 h-4.5 transition-transform duration-200 ${isTabActive ? 'scale-110 stroke-[2.5px]' : ''}`} />
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
      </nav>
    </div>
  );
}
