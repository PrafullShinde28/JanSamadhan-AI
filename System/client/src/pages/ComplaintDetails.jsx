import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'react-toastify';
import { 
  AlertCircle, 
  ArrowLeft, 
  Bot, 
  CheckCircle2, 
  Clock3, 
  Image as ImageIcon, 
  MapPin, 
  UserRound,
  Calendar,
  Activity,
  UserCheck,
  Loader2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSocket } from '../context/SocketContext';
import { complaintApi } from '../api/complaint.api';
import { workerApi } from '../api/worker.api';
import { adminApi } from '../api/admin.api';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import CitizenComplaintDetailsSkeleton from '../components/skeletons/CitizenComplaintDetailsSkeleton';

// Helper custom marker for leaflet
const incidentIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ComplaintDetails() {
  const { id } = useParams();
  const { dbUser } = useApp();
  const socket = useSocket();
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const role = dbUser?.role;
  
  // Directly routing user back
  const backPath = useMemo(() => {
    if (role === 'Admin') return '/admin/dashboard';
    if (role === 'Worker') return '/worker/dashboard';
    return '/citizen/complaints';
  }, [role]);

  const coordinates = useMemo(() => complaint?.location?.coordinates || [], [complaint]);
  
  const mapPosition = useMemo(() => {
    return coordinates.length === 2 ? [coordinates[1], coordinates[0]] : null;
  }, [coordinates]);

  const originalImage = complaint?.complaintImages?.[0]?.url;
  const resolutionImage = complaint?.resolution?.afterImages?.[0]?.url;
  const canConfirm = role === 'Citizen' && complaint?.status === 'Resolved' && !complaint?.feedback?.submittedAt;

  const load = useCallback(async (showLoading = true) => {
    if (!role) return;
    if (showLoading) setLoading(true);
    try {
      const api = role === 'Admin' ? adminApi : role === 'Worker' ? workerApi : complaintApi;
      const detailRequest = api.details || api.citizenDetails;
      const timelineRequest = api.timeline || api.citizenTimeline;
      
      const [detailResponse, timelineResponse] = await Promise.all([
        detailRequest(id), 
        timelineRequest(id)
      ]);
      
      setComplaint(detailResponse.data.data?.complaint || detailResponse.data.data);
      setTimeline(timelineResponse.data.data || []);
    } catch (error) {
      console.error('Failed to load complaint logs:', error);
      toast.error(error.message || 'Verification pipeline sync failure.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id, role]);

  useEffect(() => {
    load(true);
  }, [load]);

  // Real-time socket updates for complaint details
  useEffect(() => {
    if (!socket || !id) return;

    const handleRefetchEvent = (data) => {
      console.log('🔄 Socket event received in ComplaintDetails:', data);
      const targetComplaintId = data.complaint || data.complaintId || data.id;
      
      if (targetComplaintId === id) {
        console.log('🔍 Socket event matches current complaint, reloading data in background...');
        load(false);
      }
    };

    socket.on('notification', handleRefetchEvent);
    socket.on('status-updated', handleRefetchEvent);
    socket.on('ai-completed', handleRefetchEvent);
    socket.on('worker-assigned', handleRefetchEvent);

    return () => {
      socket.off('notification', handleRefetchEvent);
      socket.off('status-updated', handleRefetchEvent);
      socket.off('ai-completed', handleRefetchEvent);
      socket.off('worker-assigned', handleRefetchEvent);
    };
  }, [socket, id, load]);

  const confirmResolution = async (confirmed) => {
    try {
      setSubmitting(true);
      const response = await complaintApi.submitFeedback(id, { 
        confirmed, 
        rating: confirmed ? 5 : undefined, 
        comment: confirmed ? 'Resolution confirmed by citizen.' : 'The issue is still present.' 
      });
      setComplaint(response.data.data);
      toast.success(confirmed ? 'Thank you for confirming the resolution.' : 'The complaint has been reopened for action.');
    } catch (error) {
      toast.error(error.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !complaint) {
    return <CitizenComplaintDetailsSkeleton />;
  }

  if (!complaint) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh] px-4 w-full">
        <div className="text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-danger animate-pulse" />
          <h1 className="font-outfit text-sm sm:text-base font-bold text-slate-805">Complaint Details Unavailable</h1>
          <Link to={backPath} className="inline-block text-xs font-bold text-primary uppercase tracking-wide hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Back button link */}
      <div>
        <Link 
          to={backPath} 
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary select-none"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" /> 
          Back to Reports
        </Link>
      </div>

      {/* Main status header banner */}
      <header className="flex flex-col gap-4 rounded-card border border-slate-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <div className="min-w-0">
          <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border px-1.5 py-0.5 rounded inline-block">
            #{complaint.complaintNumber || complaint._id.slice(-6).toUpperCase()}
          </span>
          <h1 className="mt-1.5 font-outfit text-sm sm:text-base md:text-lg font-extrabold text-slate-805 leading-snug break-words">
            {complaint.title}
          </h1>
          <div className="flex items-center gap-1.5 text-[9.5px] text-slate-450 mt-1 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Reported: {new Date(complaint.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5 shrink-0 select-none">
          <ComplaintStatusBadge status={complaint.status} />
          <ComplaintPriorityBadge priority={complaint.priority} />
        </div>
      </header>

      {/* Duplicate detection warning */}
      {complaint.ai?.duplicateDetected && (
        <div className="bg-red-50 border border-red-200 text-danger p-4 rounded-card flex items-start gap-2.5 text-xs shadow-soft w-full min-w-0">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-extrabold font-outfit text-xs">Duplicate Complaint Detected</p>
            <p className="mt-1 leading-normal text-slate-600 break-words">
              The AI incident pipeline identified this issue as a duplicate of an already reported incident.
              {complaint.ai.duplicateComplaint && (
                <span className="block mt-1.5 font-bold text-slate-700">
                  Related Complaint ID: <span className="font-mono text-[10px] text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{complaint.ai.duplicateComplaint}</span>
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* AI Processing Status (while AI job is analyzing) */}
      {!complaint.ai?.processed && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-card flex items-start gap-3 text-xs shadow-soft w-full min-w-0 animate-pulse">
          <Loader2 className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-spin" />
          <div className="min-w-0">
            <p className="font-extrabold font-outfit text-xs text-primary">AI Vision Classification in Progress...</p>
            <p className="mt-0.5 leading-normal text-slate-600">
              The YOLO11 computer vision pipeline is analyzing your evidence photo to identify civic issue type, calculate severity, and automatically route to the responsible municipal department.
            </p>
          </div>
        </div>
      )}

      {/* Non-Civic / Unrecognized Issue Notice (Only after AI completes and confirms no civic issue) */}
      {complaint.ai?.processed && (complaint.ai?.isCivicIssue === false || complaint.category === 'Other') && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-card flex items-start gap-3 text-xs shadow-soft w-full min-w-0">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-extrabold font-outfit text-xs text-amber-900">No Recognized Civic Issue Detected</p>
            <p className="mt-1 leading-normal text-amber-800">
              The AI vision model analyzed the submitted evidence image, but did not detect any recognized municipal civic problem (such as a Pothole, Road Damage, Garbage Overflow, Water Leakage, Open Manhole, Fallen Tree, or Broken Streetlight).
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
              Since no municipal issue was identified, no field worker dispatch was required and this report has been closed. If this was an error, please capture a clear photo of the actual civic issue.
            </p>
          </div>
        </div>
      )}

      {/* Two Column Layout on Desktop, Single Column stack on Mobile */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3 w-full min-w-0">
        
        {/* Left main content columns */}
        <main className="space-y-4 sm:space-y-6 lg:col-span-2 min-w-0 w-full">
          
          {/* Issue Evidence Card */}
          <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
            <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-805 border-b pb-2 border-slate-50">Issue Evidence</h2>
            
            {originalImage ? (
              <div className="mt-3.5 relative overflow-hidden rounded-xl border border-slate-150">
                <img src={originalImage} alt="Original civic issue" className="h-48 sm:h-72 w-full object-cover" />
              </div>
            ) : (
              <div className="mt-3.5 grid h-44 place-items-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-1 font-semibold">Image Preview Unavailable</p>
                </div>
              </div>
            )}
            
            <p className="mt-3.5 text-xs leading-relaxed text-slate-655 break-words font-medium">
              {complaint.description}
            </p>
          </section>

          {/* AI Analysis classifications info */}
          <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
            <div className="flex items-center gap-1.5 border-b pb-2 border-slate-50">
              <Bot className="h-5 w-5 text-primary shrink-0" />
              <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-805">AI Detection Insights</h2>
            </div>
            
            <div className="mt-3.5 grid gap-2 grid-cols-1 sm:grid-cols-3 w-full min-w-0">
              <Fact label="Class Category" value={complaint.category || 'Processing'} />
              <Fact label="Confidence score" value={complaint.ai?.confidence ? `${complaint.ai.confidence}%` : 'Processing'} />
              <Fact label="Estimated ETA" value={complaint.ai?.etaHours ? `${complaint.ai.etaHours} Hours` : 'Processing'} />
            </div>
          </section>

          {/* Resolution Evidence Form details */}
          {resolutionImage && (
            <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
              <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-805 border-b pb-2 border-slate-50">Resolution Evidence</h2>
              
              <div className="mt-3.5 relative overflow-hidden rounded-xl border border-slate-150">
                <img src={resolutionImage} alt="Resolution evidence" className="h-48 sm:h-64 w-full object-cover" />
              </div>
              
              <p className="mt-3.5 text-xs text-slate-655 leading-relaxed break-words font-semibold bg-slate-50 border p-3 rounded-lg">
                <strong>Worker Remarks: </strong> {complaint.resolution?.remarks}
              </p>
            </section>
          )}

          {/* Citizen Resolution approval checkbox */}
          {canConfirm && (
            <section className="rounded-card border border-emerald-200 bg-emerald-50/20 p-4 shadow-soft w-full min-w-0">
              <div className="flex gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div className="min-w-0">
                  <h2 className="font-outfit font-bold text-xs sm:text-sm text-slate-805">Is the issue resolved?</h2>
                  <p className="mt-0.5 text-[10px] sm:text-xs text-slate-600">Please verify the resolution. This updates and completes the service request.</p>
                </div>
              </div>
              
              <div className="mt-4 grid gap-2 grid-cols-2 w-full select-none">
                <button 
                  disabled={submitting} 
                  onClick={() => confirmResolution(true)} 
                  className="rounded-button bg-success hover:bg-success-dark text-white font-bold h-10 text-xs flex items-center justify-center shadow select-none cursor-pointer transition disabled:opacity-60"
                >
                  Yes, Confirm
                </button>
                <button 
                  disabled={submitting} 
                  onClick={() => confirmResolution(false)} 
                  className="rounded-button bg-white hover:bg-red-50 hover:text-red-600 text-danger h-10 text-xs font-bold flex items-center justify-center border border-red-200 select-none cursor-pointer transition disabled:opacity-60"
                >
                  No, Still Exists
                </button>
              </div>
            </section>
          )}
        </main>

        {/* Right sidebars */}
        <aside className="space-y-4 sm:space-y-6 min-w-0 w-full">
          
          {/* Assignment telemetry Card */}
          <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
            <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-805 border-b pb-2 border-slate-50">Assignment Summary</h2>
            
            <div className="mt-3.5 space-y-3.5 min-w-0">
              <Info icon={MapPin} label="Confirmed Location" value={complaint.location?.address || 'Being verified'} />
              <Info icon={UserRound} label="Assigned Department" value={complaint.assignment?.department?.name || 'AI routing in progress'} />
              <Info icon={UserCheck} label="Dispatched Worker" value={complaint.assignment?.worker?.fullName || 'Awaiting assignment'} />
            </div>
          </section>

          {/* Leaflet map snippet panel */}
          {mapPosition && (
            <section className="h-60 overflow-hidden rounded-card border border-slate-150 bg-white shadow-soft z-10 w-full relative">
              <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={mapPosition} icon={incidentIcon} />
              </MapContainer>
            </section>
          )}

          {/* Vertical progress dot timeline */}
          <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
            <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-805 border-b pb-2 border-slate-50 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary shrink-0 animate-pulse" />
              Complaint Timeline
            </h2>
            
            <ol className="mt-4 w-full min-w-0 space-y-0.5">
              {timeline.length ? (
                timeline.map((event, idx) => (
                  <li key={event._id} className="relative pl-6 pb-4 last:pb-0 min-w-0">
                    {/* Line connector */}
                    {idx < timeline.length - 1 && (
                      <span className="absolute left-[6.5px] top-3 bottom-0 w-0.5 bg-slate-105" />
                    )}
                    {/* Circle dot marker */}
                    <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow-sm" />
                    
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 break-words leading-tight">{event.eventType}</p>
                      <p className="mt-0.5 text-[9.5px] text-slate-500 leading-normal break-words">{event.description}</p>
                      <time className="mt-1 block text-[8.5px] font-semibold text-slate-400">
                        {new Date(event.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </time>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400 p-4 text-center">Status updates will synchronize here.</li>
              )}
            </ol>
          </section>
        </aside>

      </div>

    </div>
  );
}

function Fact({ label, value }) { 
  return (
    <div className="rounded-xl bg-slate-50 border p-3 w-full min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-outfit truncate">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-slate-700 truncate leading-snug">{value}</p>
    </div>
  ); 
}

function Info({ icon: Icon, label, value }) { 
  return (
    <div className="flex gap-2.5 min-w-0 w-full">
      <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-grow w-full">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-outfit truncate">{label}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-700 leading-normal break-words">{value}</p>
      </div>
    </div>
  ); 
}
