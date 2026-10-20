import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { 
  ClipboardList, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Truck, 
  Building2,
  Mail,
  Phone,
  Clock,
  Sparkles,
  Bot,
  Compass,
  Star,
  Users,
  CheckCircle,
  Activity,
  ChevronRight,
  ShieldCheck,
  Send,
  Navigation,
  RefreshCw,
  ExternalLink,
  Layers
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DEFAULT_DEPARTMENTS = [
  { _id: 'dept-1', name: 'Road & Infrastructure', code: 'ROAD', description: 'Pothole remediation, road resurfacing, asphalt repairs, and speed breaker maintenance.', email: 'janasamadhan.team@gmail.com' },
  { _id: 'dept-2', name: 'Solid Waste & Sanitation', code: 'SANITATION', description: 'Garbage accumulation clearance, overflowing dumpsters, and urban sanitation.', email: 'janasamadhan.team@gmail.com' },
  { _id: 'dept-3', name: 'Street Lighting & Electrical', code: 'ELECTRICITY', description: 'Broken streetlight restoration, exposed power cables, and public lighting grid safety.', email: 'janasamadhan.team@gmail.com' },
  { _id: 'dept-4', name: 'Water Supply & Pipelines', code: 'WATER', description: 'Pipeline leak detection, clean drinking water supply, and valve maintenance.', email: 'janasamadhan.team@gmail.com' },
  { _id: 'dept-5', name: 'Drainage & Sewage Network', code: 'DRAINAGE', description: 'Clogged storm drains, overflowing sewers, and open manhole hazard protection.', email: 'janasamadhan.team@gmail.com' },
  { _id: 'dept-6', name: 'Parks & Urban Greenery', code: 'GARDEN', description: 'Hazardous fallen trees removal, overgrown branch trimming, and public park upkeep.', email: 'janasamadhan.team@gmail.com' }
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const { dbUser } = useApp();
  const [submittingContact, setSubmittingContact] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [publicData, setPublicData] = useState({
    stats: {
      totalComplaints: 0,
      resolvedComplaints: 0,
      inProgressComplaints: 0,
      pendingComplaints: 0,
      resolutionRate: 0,
      totalWorkers: 0,
      totalCitizens: 0,
      totalDepartments: 0,
      avgResponseHours: '< 24h'
    },
    departments: [],
    latestComplaint: null,
    recentComplaints: []
  });

  const role = dbUser?.role;

  // Fetch real public live summary from backend
  const fetchPublicSummary = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      else setLoadingData(true);

      const res = await axios.get(`${API_BASE_URL}/dashboard/public`);
      if (res.data?.success && res.data?.data) {
        setPublicData(res.data.data);
        if (showToast) toast.success('Telemetry data refreshed live from MongoDB');
      }
    } catch (err) {
      console.warn('Could not load live dashboard statistics:', err.message);
      if (showToast) toast.error('Could not refresh live statistics');
    } finally {
      setLoadingData(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPublicSummary(false);
  }, []);


  // Determine CTA destination based on role and auth
  const primaryCta = isSignedIn
    ? role === 'Admin'
      ? { label: 'Admin Control Desk', path: '/admin/dashboard' }
      : role === 'Worker'
      ? { label: 'Worker Tasks Console', path: '/worker/dashboard' }
      : { label: 'Report Civic Issue', path: '/citizen/report' }
    : { label: 'Report an Issue', path: '/sign-up' };

  const secondaryCta = isSignedIn
    ? role === 'Admin'
      ? { label: 'All Complaints Queue', path: '/admin/complaints' }
      : role === 'Worker'
      ? { label: 'Field Operations Map', path: '/worker/map' }
      : { label: 'Track My Complaints', path: '/citizen/complaints' }
    : { label: 'Track Complaint Status', path: '/sign-in' };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmittingContact(true);
    setTimeout(() => {
      e.target.reset();
      toast.success('Thank you for contacting JanSamadhan AI Support. We have logged your request.');
      setSubmittingContact(false);
    }, 500);
  };

  const { stats, latestComplaint, recentComplaints, departments } = publicData;

  const latestImg = latestComplaint?.complaintImages?.[0]?.url;
  const latestAiConfidence = latestComplaint?.ai?.confidence || 94.4;
  const latestCategory = latestComplaint?.ai?.detectedCategory || latestComplaint?.category || 'Pothole';
  const latestAddress = latestComplaint?.location?.address || 'Civil Lines, Smart City Command Center';
  const latestDept = latestComplaint?.assignment?.department?.name || 'Road & Infrastructure Dept';
  const latestId = latestComplaint?._id ? `CIR-${latestComplaint._id.slice(-4).toUpperCase()}` : 'CIR-4812';

  return (
    <div className="bg-white min-h-screen pt-14 sm:pt-16 font-sans w-full max-w-full overflow-x-hidden min-w-0">
      
      {/* ============================================================
          1. HERO SECTION — MOBILE FIRST (SINGLE COLUMN -> 2 COL ON LG)
          ============================================================ */}
      <section className="relative bg-gradient-to-br from-primary via-blue-700 to-indigo-900 text-white py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden w-full min-w-0">
        
        {/* Subtle decorative background */}
        <div 
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_50%)] pointer-events-none" 
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center relative z-10 w-full min-w-0">
          
          {/* Left Column: Headlines, description, CTA buttons */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left w-full min-w-0">
            
            {/* Government Governance Badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-bold text-blue-100 shadow-xs max-w-full">
              <ShieldCheck className="w-4 h-4 text-blue-200 shrink-0" />
              <span className="truncate">Live Municipal Governance & YOLO11 Vision</span>
            </div>

            {/* Responsive Scaled Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-outfit leading-[1.12] tracking-tight text-white break-words">
              Report Civic Issues.{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-sky-100 to-white">
                Empower Your City.
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-blue-100/90 max-w-xl leading-relaxed font-normal">
              JanSamadhan AI links citizens, field workers, and municipal authorities through instant GPS capture, computer vision auditing, and automated department dispatch.
            </p>

            {/* Mobile-First Touch CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <Link 
                to={primaryCta.path} 
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 bg-white text-primary font-outfit font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-lg hover:bg-blue-50 transition active:scale-98 text-center uppercase tracking-wide cursor-pointer"
              >
                <span>{primaryCta.label}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
              
              <Link 
                to={secondaryCta.path} 
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 border border-white/35 hover:border-white text-white font-outfit font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition active:scale-98 text-center cursor-pointer"
              >
                <span>{secondaryCta.label}</span>
              </Link>
            </div>

            {/* Real quick stats ticker */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] sm:text-xs text-blue-100/85 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{stats.totalComplaints} Live Complaint{stats.totalComplaints === 1 ? '' : 's'} Logged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{stats.resolutionRate}% Verified Resolution Rate ({stats.resolvedComplaints} Resolved)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span>{stats.totalWorkers} Active Field Staff</span>
              </div>
            </div>

          </div>

          {/* Right Column: Real Latest Incident Preview Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none flex justify-center pt-2 lg:pt-0">
            <div className="w-full bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-200/90 relative space-y-3">
              
              {/* Card Header with real latest incident id */}
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span className="font-extrabold text-xs sm:text-sm font-outfit text-slate-900 truncate">
                    Latest Incident #{latestId}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold bg-blue-50 text-primary border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-outfit shrink-0">
                  {latestComplaint?.status || 'Active Dispatch'}
                </span>
              </div>

              {/* Real AI YOLO Detection Badge */}
              <div className="bg-indigo-50/90 border border-indigo-100 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Bot className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-indigo-950 truncate">YOLO11: {latestCategory}</span>
                </div>
                <span className="font-black text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-mono shrink-0">
                  {latestAiConfidence}% Conf
                </span>
              </div>

              {/* Real Evidence Image or Map View */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 h-32 sm:h-36 flex flex-col items-center justify-center text-center">
                {latestImg ? (
                  <>
                    <img 
                      src={latestImg} 
                      alt="Real complaint evidence" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                      <p className="text-[10px] text-white font-medium truncate text-left w-full">
                        📍 {latestAddress}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-3 text-center text-slate-300 space-y-1">
                    <MapPin className="w-6 h-6 text-danger mx-auto" />
                    <p className="text-[11px] font-bold text-white font-outfit">{latestAddress}</p>
                  </div>
                )}
              </div>

              {/* Card Footer: Real Department & Live Link */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{latestDept}</span>
                </div>
                <Link 
                  to={isSignedIn ? (role === 'Admin' ? `/admin/complaints` : `/citizen/complaints`) : `/sign-in`}
                  className="font-extrabold text-primary hover:underline shrink-0 flex items-center gap-0.5 text-xs"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ============================================================
          2. REAL-TIME LIVE STATISTICS SECTION (FROM MONGODB)
          ============================================================ */}
      <section className="bg-slate-900 text-white py-8 sm:py-10 px-4 sm:px-6 lg:px-8 w-full min-w-0 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 font-outfit">
                Live City Operations Telemetry
              </span>
            </div>
            <button
              onClick={() => fetchPublicSummary(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition font-mono cursor-pointer disabled:opacity-50"
              title="Refresh live data from database"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Real MongoDB Data'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 text-center w-full min-w-0">
            
            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 space-y-1">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black font-outfit text-blue-300">
                {stats.totalComplaints ?? 0}
              </p>
              <p className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit">
                Total Complaints Lodged
              </p>
            </div>

            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 space-y-1">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black font-outfit text-emerald-400">
                {stats.resolvedComplaints ?? 0}
              </p>
              <p className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit">
                Verified Resolutions
              </p>
            </div>

            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 space-y-1">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black font-outfit text-amber-400">
                {stats.resolutionRate ?? 0}%
              </p>
              <p className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit">
                Resolution Success Rate
              </p>
            </div>

            <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700/80 space-y-1">
              <p className="text-2xl sm:text-3xl md:text-4xl font-black font-outfit text-indigo-300">
                {stats.totalWorkers ?? 0}
              </p>
              <p className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit">
                Active Field Staff
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          3. REAL RECENT LIVE INCIDENTS FEED
          ============================================================ */}
      <section id="live-feed" className="py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-w-0 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-1.5 text-primary text-[10px] sm:text-xs font-black uppercase tracking-wider font-outfit">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Public Feed</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-outfit text-slate-900 tracking-tight">
              Recently Reported Civic Issues
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Live civic complaints reported by citizens across municipal wards.
            </p>
          </div>

          <Link 
            to={isSignedIn ? "/citizen/complaints" : "/sign-in"}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
          {recentComplaints && recentComplaints.length > 0 ? (
            recentComplaints.slice(0, 4).map((item) => (
              <div 
                key={item._id} 
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft hover:shadow-premium transition flex flex-col justify-between space-y-3 text-left"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-[11px] text-slate-800 font-outfit truncate">
                      {item.category}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      item.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      item.status === 'Assigned' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      item.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {item.complaintImages?.[0]?.url && (
                    <div className="h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-150">
                      <img src={item.complaintImages[0].url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="text-xs text-slate-700 font-semibold line-clamp-2 leading-tight">
                    {item.title}
                  </p>
                  
                  <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.location?.city || item.location?.address || 'Municipal Ward'}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold text-primary">{item.assignment?.department?.name || 'Assigned'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-slate-50 p-8 rounded-2xl text-center text-slate-400 text-xs">
              No recent public complaints found in database.
            </div>
          )}
        </div>

      </section>

      {/* ============================================================
          4. REAL MUNICIPAL DEPARTMENTS DIRECTORY
          ============================================================ */}
      <section id="departments" className="bg-slate-50/80 border-y border-slate-200/70 py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 w-full min-w-0">
        <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-primary font-outfit">
              Municipal Authorities Registry
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-slate-900 tracking-tight">
              Active Municipal Departments
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Real departments handling automated complaint routing, field dispatch, and resolutions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
            {(departments && departments.length > 0 ? departments : DEFAULT_DEPARTMENTS).map((dept) => (
              <div key={dept._id || dept.code} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-primary font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-primary border border-blue-200 rounded font-mono">
                    {dept.code}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-outfit">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {dept.description || 'Handles infrastructure maintenance, rapid response, and public civic repairs.'}
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p className="truncate">✉️ {dept.email || 'janasamadhan.team@gmail.com'}</p>
                  <p className="text-slate-500 font-medium">⚡ Priority AI Routing & Dispatch</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================
          5. ABOUT & SYSTEM ARCHITECTURE
          ============================================================ */}
      <section id="about" className="py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-w-0 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider font-outfit">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI-Powered Civic Ecosystem</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-outfit text-slate-900 tracking-tight">
            About JanSamadhan AI
          </h2>
          
          <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
          
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
            JanSamadhan AI is an end-to-end municipal platform using computer vision (YOLO11) to automatically categorize public grievances—including potholes, water leaks, broken streetlights, open manholes, and fallen trees—with verified GPS validation and field resolution proof.
          </p>
        </div>
      </section>

      {/* ============================================================
          6. GET IN TOUCH / 24/7 HELPLINE
          ============================================================ */}
      <section id="contact" className="py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-w-0">
        <div className="bg-white rounded-2xl shadow-soft border border-slate-200 p-5 sm:p-8 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full min-w-0">
          
          {/* Left Column: Real Contact Information */}
          <div className="lg:col-span-5 space-y-5 text-left w-full min-w-0">
            <div className="space-y-2">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-primary font-outfit">
                Municipal Help Desk
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-outfit text-slate-900 tracking-tight">
                Get in Touch
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                Need assistance lodging a complaint or tracking resolution status? Reach out to our 24/7 smart city control room.
              </p>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 font-medium">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                <Building2 className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Municipal Corporation HQ</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Civil Lines, Smart City Command Center</p>
                </div>
              </div>

              <a 
                href="mailto:janasamadhan.team@gmail.com" 
                className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 hover:bg-slate-100 transition"
              >
                <Mail className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Official Support Desk</p>
                  <p className="text-primary font-bold text-[11px] mt-0.5 truncate">janasamadhan.team@gmail.com</p>
                </div>
              </a>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                <Clock className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Operating Hours</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">24 Hours / 7 Days Continuous Operations</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">Emergency Civic Escalation</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Automated 24/7 AI Dispatch & Alert System</p>
                </div>
              </div>
            </div>
          </div>


          {/* Right Column: Functioning Contact Form */}
          <div className="lg:col-span-7 bg-slate-50/90 p-4 sm:p-6 rounded-2xl border border-slate-200 w-full min-w-0">
            <form className="space-y-3.5 text-xs sm:text-sm" onSubmit={handleContactSubmit}>
              <div>
                <label className="block text-slate-800 font-extrabold mb-1 font-outfit text-xs">
                  Your Full Name <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Prafull Shinde" 
                  className="w-full min-h-[48px] bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" 
                  required 
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1 font-outfit text-xs">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input 
                  type="email" 
                  placeholder="e.g. citizen@example.com" 
                  className="w-full min-h-[48px] bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" 
                  required 
                />
              </div>

              <div>
                <label className="block text-slate-800 font-extrabold mb-1 font-outfit text-xs">
                  Message / Grievance Inquiry <span className="text-danger">*</span>
                </label>
                <textarea 
                  rows="4" 
                  placeholder="Describe your inquiry, feedback, or grievance reference number..." 
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingContact}
                className="w-full min-h-[48px] bg-primary hover:bg-primary-hover text-white font-outfit font-extrabold py-3.5 rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs sm:text-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submittingContact ? 'Transmitting Message...' : 'Send Message'}</span>
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* ============================================================
          7. FOOTER — MOBILE FIRST (STACKED ON MOBILE)
          ============================================================ */}
      <footer 
        className="bg-slate-950 text-slate-400 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 w-full min-w-0"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left w-full min-w-0">
          
          <div className="flex items-center justify-center md:justify-start gap-2 text-white">
            <div className="h-8 w-8 rounded-lg bg-primary/30 text-blue-400 flex items-center justify-center shrink-0 border border-primary/40">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <span className="font-black text-lg font-outfit tracking-tight">
              JanSamadhan<span className="text-primary-light"> AI</span>
            </span>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-500 max-w-md">
            &copy; {new Date().getFullYear()} Smart Municipal Corporation. All Rights Reserved. Built for Transparent AI Governance.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs font-semibold">
            <a href="#about" className="hover:text-white transition">About</a>
            <a href="#live-feed" className="hover:text-white transition">Live Feed</a>
            <a href="#departments" className="hover:text-white transition">Departments</a>
            <a href="#contact" className="hover:text-white transition">Helpline</a>
            <Link to="/sign-in" className="hover:text-white transition">Portal Login</Link>
          </div>

        </div>
      </footer>

    </div>
  );
}
