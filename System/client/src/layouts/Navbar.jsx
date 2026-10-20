import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Menu, 
  X, 
  MapPin, 
  ClipboardList, 
  Settings, 
  UserCheck, 
  ShieldAlert, 
  LogOut,
  Home,
  PlusCircle,
  Map,
  Building2,
  Users,
  TrendingUp,
  User,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

export default function Navbar() {
  const { isSignedIn, signOut } = useAuth();
  const { dbUser, notifications, unreadNotificationsCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Hide Navbar inside dedicated portal shell layouts
  if (location.pathname.startsWith('/worker') || location.pathname.startsWith('/citizen') || location.pathname.startsWith('/admin')) {
    return null;
  }

  const role = dbUser?.role;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-primary text-white border-b border-primary-dark pt-[env(safe-area-inset-top)] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 min-h-[56px]">
            
            {/* Logo / Brand */}
            <Link 
              to="/" 
              className="flex items-center gap-2 text-white group focus:outline-none focus:ring-2 focus:ring-white/40 rounded-xl p-1"
              aria-label="JanSamadhan AI Homepage"
            >
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs group-hover:bg-white/20 transition shrink-0">
                <MapPin className="h-5 w-5 text-blue-200" />
              </div>
              <span className="font-extrabold text-base sm:text-lg lg:text-xl tracking-tight font-outfit truncate">
                JanSamadhan<span className="text-blue-200"> AI</span>
              </span>
            </Link>

            {/* Desktop Navigation Links (>= 768px) */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" aria-label="Main Navigation">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-button text-xs lg:text-sm font-semibold hover:bg-white/10 transition ${
                  location.pathname === '/' ? 'bg-white/15 text-white font-bold' : 'text-white/85'
                }`}
              >
                Home
              </Link>

              {isSignedIn && dbUser && (
                <>
                  {role === 'Citizen' && (
                    <>
                      <Link 
                        to="/citizen/dashboard" 
                        className={`px-3 py-2 rounded-button text-xs lg:text-sm font-semibold hover:bg-white/10 transition ${
                          location.pathname.startsWith('/citizen/dashboard') ? 'bg-white/15 text-white font-bold' : 'text-white/85'
                        }`}
                      >
                        Citizen Portal
                      </Link>
                      <Link 
                        to="/citizen/report" 
                        className="px-3 py-2 rounded-button text-xs lg:text-sm font-semibold hover:bg-white/10 transition text-white/85"
                      >
                        Report Issue
                      </Link>
                      <Link 
                        to="/citizen/complaints" 
                        className="px-3 py-2 rounded-button text-xs lg:text-sm font-semibold hover:bg-white/10 transition text-white/85"
                      >
                        My Complaints
                      </Link>
                    </>
                  )}

                  {role === 'Admin' && (
                    <>
                      <Link 
                        to="/admin/dashboard" 
                        className="px-3 py-2 rounded-button text-xs lg:text-sm font-semibold hover:bg-white/10 transition text-white/85"
                      >
                        Control Desk
                      </Link>
                      <Link 
                        to="/admin/complaints" 
                        className="px-3 py-2 rounded-button text-xs lg:text-sm font-semibold hover:bg-white/10 transition text-white/85"
                      >
                        Complaints
                      </Link>
                    </>
                  )}

                  {role === 'Worker' && (
                    <>
                      <Link 
                        to="/worker/dashboard" 
                        className="px-3 py-2 rounded-button text-xs lg:text-sm font-semibold hover:bg-white/10 transition text-white/85"
                      >
                        Worker Tasks
                      </Link>
                      <Link 
                        to="/worker/map" 
                        className="px-3 py-2 rounded-button text-xs lg:text-sm font-semibold hover:bg-white/10 transition text-white/85"
                      >
                        Field Map
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>

            {/* Actions & Profile (Right side on Desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Notification Bell */}
              {isSignedIn && (
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    aria-label="View notifications"
                    className="h-10 w-10 rounded-full hover:bg-white/10 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white/40 relative cursor-pointer"
                  >
                    <Bell className="h-5 w-5 text-white" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-black text-white shadow-xs">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-card shadow-premium border border-slate-200 overflow-hidden z-50 text-slate-800 animate-fadeIn">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700 font-outfit">Notifications</span>
                        {unreadNotificationsCount > 0 && (
                          <button 
                            onClick={markAllNotificationsRead}
                            className="text-[11px] text-primary font-bold hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs text-slate-400">
                            No notifications registered yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => {
                                if (!notif.isRead) markNotificationRead(notif._id);
                                setNotifOpen(false);
                                if (notif.complaint) {
                                  const routePath = role === 'Admin' ? `/admin/complaints/${notif.complaint}` : role === 'Worker' ? `/worker/complaints/${notif.complaint}` : `/citizen/complaints/${notif.complaint}`;
                                  navigate(routePath);
                                } else if (notif.actionUrl) {
                                  navigate(notif.actionUrl);
                                }
                              }}
                              className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition text-xs ${!notif.isRead ? 'bg-blue-50/50 font-semibold' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-1.5">
                                <p className="font-bold text-slate-800 pr-1.5">{notif.title}</p>
                                {!notif.isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0 inline-block mt-1"></span>}
                              </div>
                              <p className="text-slate-500 mt-1 line-clamp-2 text-[11px] leading-relaxed">{notif.message}</p>
                              <span className="text-[9px] text-slate-400 block mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <Link 
                        to={role === 'Admin' ? '/admin/notifications' : role === 'Worker' ? '/worker/notifications' : '/citizen/notifications'}
                        onClick={() => setNotifOpen(false)}
                        className="block text-center py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-bold text-primary hover:bg-slate-100 transition"
                      >
                        View all alerts &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* User Auth Buttons */}
              {isSignedIn ? (
                <div className="flex items-center gap-2 pl-1">
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link 
                    to="/sign-in" 
                    className="px-3.5 py-2 text-xs font-bold text-white hover:text-blue-100 transition"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/sign-up" 
                    className="bg-white text-primary px-4 py-2 rounded-button text-xs font-extrabold shadow-soft hover:bg-slate-50 transition active:scale-95"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Right Controls (< 768px) */}
            <div className="md:hidden flex items-center space-x-1.5">
              {isSignedIn && (
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="View notifications"
                  className="h-10 w-10 rounded-xl hover:bg-white/10 transition flex items-center justify-center relative active:scale-95 cursor-pointer"
                >
                  <Bell className="h-5 w-5 text-white" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-black text-white shadow-xs">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
                aria-expanded={mobileMenuOpen}
                className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                <Menu className="h-5 w-5 text-white" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ============================================================
          SOLID SLIDE-OVER MOBILE DRAWER (ZERO TRANSPARENCY BLEED)
          ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          
          {/* Solid Opaque Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Solid Menu Panel */}
          <div 
            className="relative z-50 w-[85%] max-w-sm h-full bg-slate-900 text-white shadow-2xl flex flex-col justify-between p-5 border-l border-slate-800 overflow-y-auto"
            style={{ 
              paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))'
            }}
          >
            
            {/* Drawer Top Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <span className="font-black text-base tracking-tight font-outfit text-white">
                    JanSamadhan <span className="text-primary-light">AI</span>
                  </span>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Card (if authenticated) */}
              {isSignedIn && dbUser && (
                <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary text-white font-extrabold flex items-center justify-center shrink-0 text-sm uppercase shadow-sm">
                      {dbUser.firstName?.[0] || dbUser.fullName?.[0] || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs text-white truncate font-outfit">
                        {dbUser.fullName || dbUser.firstName || 'Signed In User'}
                      </p>
                      <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-blue-300 border border-primary/30">
                        {role === 'Admin' ? 'Administrator' : role === 'Worker' ? 'Municipal Worker' : 'Citizen'}
                      </span>
                    </div>
                  </div>
                  <UserButton afterSignOutUrl="/" />
                </div>
              )}

              {/* Navigation Items List */}
              <nav className="space-y-1.5 pt-1">
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className={`min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    location.pathname === '/' ? 'bg-primary text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-blue-300 shrink-0" />
                    <span>Home Overview</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>

                {/* Public Navigation */}
                {!isSignedIn && (
                  <>
                    <a 
                      href="#about" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>About Platform</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </a>

                    <a 
                      href="#live-feed" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Live Reports & Feed</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </a>

                    <a 
                      href="#departments" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>Municipal Departments</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </a>

                    <a 
                      href="#contact" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>24/7 Helpline Desk</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </a>
                  </>
                )}

                {/* Authenticated Citizen Navigation */}
                {isSignedIn && role === 'Citizen' && (
                  <>
                    <Link 
                      to="/citizen/dashboard" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>Citizen Dashboard</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>

                    <Link 
                      to="/citizen/report" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Report Civic Issue</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>

                    <Link 
                      to="/citizen/complaints" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>My Filed Complaints</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>

                    <Link 
                      to="/citizen/map" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <Map className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>Civic Issues Map</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>
                  </>
                )}

                {/* Authenticated Admin Navigation */}
                {isSignedIn && role === 'Admin' && (
                  <>
                    <Link 
                      to="/admin/dashboard" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>Admin Control Desk</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>

                    <Link 
                      to="/admin/complaints" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>All Complaints Queue</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>

                    <Link 
                      to="/admin/departments" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>Municipal Departments</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>

                    <Link 
                      to="/admin/workers" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>Field Workers Directory</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>
                  </>
                )}

                {/* Authenticated Worker Navigation */}
                {isSignedIn && role === 'Worker' && (
                  <>
                    <Link 
                      to="/worker/dashboard" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-4 h-4 text-blue-300 shrink-0" />
                        <span>Assigned Tasks Queue</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>

                    <Link 
                      to="/worker/map" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="min-h-[48px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <div className="flex items-center gap-3">
                        <Map className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Field Operations Map</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Bottom Actions inside Drawer */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              {isSignedIn ? (
                <button 
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                    navigate('/');
                  }}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-xs font-extrabold shadow-md transition active:scale-98 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Account</span>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link 
                    to="/sign-in" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="w-full min-h-[48px] flex items-center justify-center rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-800 text-white transition active:scale-98"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/sign-up" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="w-full min-h-[48px] flex items-center justify-center bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black shadow-md transition active:scale-98 uppercase tracking-wide"
                  >
                    Sign Up / Register
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </>
  );
}
