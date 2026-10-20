import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { workerApi } from '../api/worker.api';
import { useSocket } from '../context/SocketContext';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User, 
  Wrench, 
  AlertCircle, 
  Bot, 
  CheckCircle, 
  Image as ImageIcon,
  Check,
  X,
  Play,
  Navigation,
  Sparkles,
  MessageSquare,
  Activity,
  Star,
  Shield,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import WorkerComplaintDetailsSkeleton from '../components/skeletons/WorkerComplaintDetailsSkeleton';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Haversine helper
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // meters
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Map center adjustment component
function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function WorkerComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Collapsible panels state for PWA mobile density
  const [aiExpanded, setAiExpanded] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(true);

  // Live worker GPS coordinates on Details page
  const [workerCoords, setWorkerCoords] = useState(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [detailRes, timelineRes] = await Promise.all([
        workerApi.details(id),
        workerApi.timeline(id)
      ]);
      if (detailRes.data.success) {
        setComplaint(detailRes.data.data);
      }
      if (timelineRes.data.success) {
        setTimeline(timelineRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      toast.error(err.message || 'Failed to load task details.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket || !id) return;

    const handleWorkerSocketEvent = (payload) => {
      const targetId = payload.complaint || payload.complaintId || payload.id;
      if (targetId === id) {
        loadData(false);
      }
    };

    socket.on('notification', handleWorkerSocketEvent);
    socket.on('status-updated', handleWorkerSocketEvent);
    socket.on('ai-completed', handleWorkerSocketEvent);
    socket.on('worker-assigned', handleWorkerSocketEvent);

    return () => {
      socket.off('notification', handleWorkerSocketEvent);
      socket.off('status-updated', handleWorkerSocketEvent);
      socket.off('ai-completed', handleWorkerSocketEvent);
      socket.off('worker-assigned', handleWorkerSocketEvent);
    };
  }, [socket, id, loadData]);

  // User coordinates setup
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWorkerCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => console.warn('Details map geolocation unavailable:', err.message),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const complaintCoords = useMemo(() => {
    const coords = complaint?.location?.coordinates || [];
    if (coords.length === 2) {
      return {
        longitude: coords[0],
        latitude: coords[1]
      };
    }
    return null;
  }, [complaint]);

  const mapCenter = useMemo(() => {
    if (complaintCoords) return [complaintCoords.latitude, complaintCoords.longitude];
    return null;
  }, [complaintCoords]);

  const hasReached = useMemo(() => {
    return timeline.some(e => e.eventType === 'Worker Reached Location');
  }, [timeline]);

  const isAccepted = useMemo(() => {
    return timeline.some(e => e.eventType === 'Worker Accepted') || ['In Progress', 'Resolved', 'Closed'].includes(complaint?.status);
  }, [timeline, complaint]);

  const currentDistance = useMemo(() => {
    if (!workerCoords || !complaintCoords) return null;
    return getDistance(
      workerCoords.latitude,
      workerCoords.longitude,
      complaintCoords.latitude,
      complaintCoords.longitude
    );
  }, [workerCoords, complaintCoords]);

  const handleAccept = async () => {
    try {
      setSubmitting(true);
      const res = await workerApi.accept(id);
      if (res.data.success) {
        toast.success('Complaint accepted.');
        await loadData(false);
      }
    } catch (err) {
      console.error("Accept details API Error:", err);
      toast.error(err.message || 'Failed to accept complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = () => {
    setRejectModalOpen(true);
  };

  const confirmReject = async (reason) => {
    if (!reason?.trim()) {
      toast.warning('A rejection reason is required.');
      return;
    }

    try {
      setIsRejecting(true);
      const res = await workerApi.reject(id, { reason });
      if (res.data.success) {
        toast.success('Complaint rejected.');
        setRejectModalOpen(false);
        navigate('/worker/dashboard');
      }
    } catch (err) {
      console.error("Reject details API Error:", err);
      toast.error(err.response?.data?.message || err.message || 'Failed to reject complaint.');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setSubmitting(true);
      const res = await workerApi.start(id);
      if (res.data.success) {
        toast.success('Work started on this complaint.');
        await loadData(false);
      }
    } catch (err) {
      console.error("Start work details API Error:", err);
      toast.error(err.message || 'Failed to start work.');
    } finally {
      setSubmitting(false);
    }
  };

  // Leaflet custom markers
  const complaintIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const workerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  if (loading && !complaint) {
    return <WorkerComplaintDetailsSkeleton />;
  }

  if (!complaint) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 text-center min-h-[50vh] w-full">
        <div className="space-y-4">
          <AlertCircle className="mx-auto h-10 w-10 text-danger" />
          <h1 className="font-outfit text-base font-bold text-slate-900">Task unavailable</h1>
          <p className="text-xs text-slate-500">This complaint may have been reassigned or resolved by another agent.</p>
          <Link to="/worker/dashboard" className="inline-block text-xs font-bold text-primary hover:underline">
            Return to Dashboard Queue
          </Link>
        </div>
      </div>
    );
  }

  const originalImage = complaint?.complaintImages?.find(img => img.imageType === 'Complaint')?.url || complaint?.complaintImages?.[0]?.url;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Navigation Header */}
      <div className="flex justify-between items-center w-full">
        <Link to="/worker/dashboard" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Hero Banner Card */}
      <header className="flex flex-col gap-3 rounded-card border border-slate-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <div className="min-w-0 w-full sm:w-auto">
          <p className="text-[9px] font-bold tracking-wide text-slate-400 bg-slate-50 border border-slate-205 px-2 py-0.5 rounded inline-block font-mono truncate max-w-[180px] break-all">
            {complaint.complaintNumber || 'CIR-UNASSIGNED'}
          </p>
          <h1 className="mt-2 font-outfit text-sm sm:text-base md:text-lg font-extrabold text-slate-800 leading-snug break-words w-full">{complaint.title}</h1>
          <p className="mt-1 text-[10px] text-slate-400">
            Assigned: {new Date(complaint.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0 select-none">
          <ComplaintStatusBadge status={complaint.status} />
          <ComplaintPriorityBadge priority={complaint.priority} />
        </div>
      </header>

      {/* Structured Layout: Stacked on mobile, 3-Columns on desktop */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 w-full min-w-0">
        
        {/* Column 1: Evidence & AI Classification */}
        <section className="space-y-4 min-w-0 w-full">
          {/* Evidence Details */}
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-4 w-full min-w-0">
            <h3 className="font-outfit text-[11px] font-bold uppercase tracking-wider text-slate-400">Original Evidence Image</h3>
            {originalImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-50 w-full">
                <img 
                  src={originalImage} 
                  alt="Incident evidence" 
                  className="h-44 sm:h-48 w-full object-cover" 
                />
              </div>
            ) : (
              <div className="grid h-32 place-items-center rounded-xl bg-slate-50 text-xs text-slate-400 border border-dashed w-full">
                <div className="text-center">
                  <ImageIcon className="h-6 w-6 mb-1 mx-auto text-slate-300" />
                  <span>No Evidence Image Attachment</span>
                </div>
              </div>
            )}
            <div className="space-y-1.5 text-xs w-full min-w-0">
              <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block">Citizen Description</span>
              <p className="text-slate-600 leading-normal italic bg-slate-50/50 p-3 rounded-lg border border-slate-100 break-words w-full">
                "{complaint.description || 'No descriptive comments provided.'}"
              </p>
            </div>
          </div>

          {/* AI Pipeline Information Block - Collapsible */}
          {complaint.ai?.processed && (
            <div className="bg-white border border-slate-100 rounded-card p-3.5 sm:p-4 shadow-soft space-y-3 w-full min-w-0">
              <button 
                type="button"
                onClick={() => setAiExpanded(!aiExpanded)}
                className="w-full flex items-center justify-between text-left focus:outline-none select-none cursor-pointer"
              >
                <h3 className="font-outfit text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 shrink-0">
                  <Bot className="h-4 w-4 text-indigo-500 animate-pulse" />
                  AI Classification details
                </h3>
                {aiExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {aiExpanded && (
                <div className="grid gap-2 grid-cols-2 text-xs pt-1 animate-fadeIn w-full min-w-0">
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">AI Category</p>
                    <p className="mt-0.5 font-bold text-slate-700 truncate">{complaint.ai.detectedCategory || complaint.category}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">AI Confidence</p>
                    <p className="mt-0.5 font-bold text-slate-700 truncate">{complaint.ai.confidence}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Severity Tag</p>
                    <p className="mt-0.5 font-bold text-slate-700 truncate">{complaint.ai.severity || 'Medium'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Risk Index</p>
                    <p className="mt-0.5 font-bold text-slate-700 truncate">{complaint.ai.riskScore || 0}%</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Column 2: Maps and Geolocation coordinates */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-4 w-full min-w-0">
            <div>
              <h3 className="font-outfit text-[11px] font-bold uppercase tracking-wider text-slate-400">Physical Coordinate Map</h3>
            </div>

            {mapCenter ? (
              <div className="h-52 sm:h-56 w-full rounded-xl overflow-hidden border border-slate-100 relative z-10">
                <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <ChangeMapView center={mapCenter} />
                  
                  {/* Complaint Marker */}
                  {complaintCoords && (
                    <>
                      <Marker position={[complaintCoords.latitude, complaintCoords.longitude]} icon={complaintIcon} />
                      <Circle center={[complaintCoords.latitude, complaintCoords.longitude]} radius={100} pathOptions={{ color: '#2563EB', fillOpacity: 0.05 }} />
                    </>
                  )}
                  
                  {/* Live Worker Marker */}
                  {workerCoords && (
                    <>
                      <Marker position={[workerCoords.latitude, workerCoords.longitude]} icon={workerIcon} />
                      <Polyline positions={[
                        [complaintCoords.latitude, complaintCoords.longitude],
                        [workerCoords.latitude, workerCoords.longitude]
                      ]} pathOptions={{ color: '#64748B', dashArray: '5, 5' }} />
                    </>
                  )}
                </MapContainer>
              </div>
            ) : (
              <div className="h-52 bg-slate-50 rounded-xl flex items-center justify-center text-xs text-slate-450 border w-full">
                Awaiting GPS coordinate updates...
              </div>
            )}

            {/* Proximity calculations */}
            <div className="space-y-3 border-t border-slate-50 pt-3 text-xs w-full min-w-0">
              <div className="flex gap-2 w-full min-w-0">
                <MapPin className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-grow w-full">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Dispatch Location</p>
                  <p className="font-semibold text-slate-700 leading-tight mt-0.5 break-words w-full">{complaint.location?.address || 'N/A'}</p>
                </div>
              </div>

              {currentDistance !== null && (
                <div className="flex gap-2 w-full min-w-0">
                  <Activity className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-grow">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Agent Site Proximity</p>
                    <p className={`font-bold mt-0.5 ${currentDistance <= 100 ? 'text-success' : 'text-danger'}`}>
                      {currentDistance.toFixed(1)} meters
                      <span className="font-semibold text-[9.5px] text-slate-400 block mt-0.5 leading-normal">
                        {currentDistance <= 100 ? 'Within verification range' : 'Outside required check-in limits (>100m)'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Column 3: Status Transition Trigger Bar */}
        <section className="space-y-4 min-w-0 w-full">
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3.5 w-full min-w-0">
            <h3 className="font-outfit text-[11px] font-bold uppercase tracking-wider text-slate-405">Operations Control</h3>
            <p className="text-xs text-slate-500 leading-normal font-medium">
              Accept the task to initiate dispatch, or submit verification and work resolution actions once repaired.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs w-full min-w-0">
              {complaint.status === 'Assigned' && !isAccepted && (
                <div className="space-y-3 w-full min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 block">NEXT: Accept Assignment</span>
                  <p className="text-slate-500 font-medium">Acknowledge responsibility to initiate field dispatch.</p>
                  {/* Buttons stack vertically on mobile (< sm) */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 w-full min-w-0">
                    <button
                      disabled={submitting}
                      onClick={handleReject}
                      className="flex-1 h-11 rounded-button border border-red-200 text-danger hover:bg-red-50 font-bold transition text-center text-xs disabled:opacity-50 select-none cursor-pointer w-full"
                    >
                      {submitting ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button
                      disabled={submitting}
                      onClick={handleAccept}
                      className="flex-1 bg-success hover:bg-success/90 text-white font-bold h-11 rounded-button transition shadow text-center text-xs disabled:opacity-50 select-none cursor-pointer w-full"
                    >
                      {submitting ? 'Accepting...' : 'Accept'}
                    </button>
                  </div>
                </div>
              )}

              {complaint.status === 'Assigned' && isAccepted && (
                <div className="space-y-3 w-full min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 block">NEXT: Start Work</span>
                  <p className="text-slate-500 font-medium">Flag that you have departed for the physical location.</p>
                  <button
                    disabled={submitting}
                    onClick={handleStartWork}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold h-11 rounded-button transition shadow flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 select-none cursor-pointer mt-1"
                  >
                    <Play className="w-4.5 h-4.5" />
                    {submitting ? 'Starting...' : 'Start Work Operations'}
                  </button>
                </div>
              )}

              {complaint.status === 'In Progress' && !hasReached && (
                <div className="space-y-3 w-full min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 block">NEXT: Reach Location</span>
                  <p className="text-slate-500 font-medium">GPS location verify check-in required within 100m of the site coordinates.</p>
                  
                  <div className="flex flex-col gap-2 pt-1 w-full min-w-0">
                    <Link
                      to={`/worker/complaints/${id}/navigation`}
                      className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-button bg-primary font-bold text-white shadow hover:bg-primary-dark transition text-center select-none"
                    >
                      <Navigation className="w-4 h-4 animate-pulse" />
                      In-App Live Navigation
                    </Link>
                  </div>
                </div>
              )}

              {complaint.status === 'In Progress' && hasReached && (
                <div className="space-y-3 w-full min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-success block">NEXT: Upload Progress / Resolve</span>
                  <p className="text-slate-500 font-medium">Check-in confirmed. File status reports or submit resolution evidence.</p>
                  
                  <div className="flex flex-col gap-2 pt-1 w-full min-w-0">
                    <Link
                      to={`/worker/complaints/${id}/progress`}
                      className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-button border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold transition text-center select-none"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      Upload Progress Image
                    </Link>
                    
                    <Link
                      to={`/worker/complaints/${id}/resolve`}
                      className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-button bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow transition text-center select-none animate-pulse"
                    >
                      <Sparkles className="w-4 h-4" />
                      Submit Work Resolution
                    </Link>
                  </div>
                </div>
              )}

              {complaint.status === 'Resolved' && (
                <div className="space-y-1 text-slate-500 w-full min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 block">NEXT: Admin Review</span>
                  <p className="leading-relaxed font-medium">Work completed. Awaiting administrator verification to formally close this file.</p>
                </div>
              )}

              {complaint.status === 'Closed' && (
                <div className="space-y-1 text-slate-400 w-full min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block font-mono">CASE TERMINATED</span>
                  <p className="font-medium">Incident fully resolved, audited, and closed. No actions required.</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Collapsible Timeline section */}
      <section className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-3 w-full min-w-0">
        <button 
          type="button"
          onClick={() => setTimelineExpanded(!timelineExpanded)}
          className="w-full flex items-center justify-between text-left focus:outline-none select-none cursor-pointer"
        >
          <h3 className="font-outfit text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 shrink-0">
            <Activity className="w-4 h-4 text-primary" />
            Audit Log Timeline
          </h3>
          {timelineExpanded ? <ChevronUp className="w-4 h-4 text-slate-405" /> : <ChevronDown className="w-4 h-4 text-slate-405" />}
        </button>

        {timelineExpanded && (
          <div className="pt-2 animate-fadeIn w-full min-w-0">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl w-full min-w-0 border">No logs registered yet.</p>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-3 pl-4 space-y-5 text-xs py-1 w-full min-w-0">
                {timeline.map((event) => (
                  <div key={event._id} className="relative w-full min-w-0">
                    {/* Circle marker */}
                    <span className="absolute -left-[25px] top-1 bg-white border-2 border-primary h-3.5 w-3.5 rounded-full flex items-center justify-center z-20">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    
                    <div className="flex flex-col gap-0.5 w-full min-w-0 pr-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 w-full">
                        <span className="font-bold text-slate-805 break-words">{event.eventType}</span>
                        <ComplaintStatusBadge status={event.status || complaint.status} />
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold truncate w-full">
                        Performer: {event.performedBy?.fullName || 'System Dispatcher'} ({event.performerRole})
                      </p>
                      {event.remarks && (
                        <p className="text-[11.5px] text-slate-600 leading-normal italic bg-slate-50/50 p-2.5 rounded border border-slate-105 mt-1 max-w-full break-words whitespace-pre-wrap">
                          "{event.remarks}"
                        </p>
                      )}
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Rejection Prompt Dialog */}
      <ConfirmDialog
        isOpen={rejectModalOpen}
        title="Reject Assigned Task"
        message="Please state your reason for rejecting this assignment. The complaint will be returned to the department queue for reassignment."
        confirmText="Confirm Rejection"
        confirmVariant="danger"
        iconType="warning"
        isLoading={isRejecting}
        isPrompt={true}
        promptLabel="Rejection Reason"
        promptPlaceholder="e.g., Outside assigned jurisdiction / emergency roadblock"
        promptRequired={true}
        onConfirm={confirmReject}
        onCancel={() => {
          if (!isRejecting) {
            setRejectModalOpen(false);
          }
        }}
      />

    </div>
  );
}
