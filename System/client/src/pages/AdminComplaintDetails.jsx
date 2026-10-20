import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { adminApi } from '../api/admin.api';
import { useSocket } from '../context/SocketContext';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User, 
  Building2, 
  AlertCircle, 
  Bot, 
  CheckCircle2, 
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Wrench,
  ChevronRight,
  UserCheck,
  Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';

const incidentIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function AdminComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pre-load reference lists for overrides
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Modal active states
  const [activeModal, setActiveModal] = useState(null); // 'priority' | 'department' | 'worker' | 'resolution' | null
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [reason, setReason] = useState('');
  const [overrideValue, setOverrideValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const detailRes = await adminApi.details(id);
      if (detailRes.data.success) {
        const payload = detailRes.data.data;
        setComplaint(payload?.complaint || payload);
        setTimeline(payload?.timeline || []);
      }
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      toast.error('Failed to retrieve incident details.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  const loadReferenceData = async () => {
    try {
      const res = await adminApi.dashboard();
      if (res.data.success) {
        setDepartments(res.data.data.departmentPerformance || []);
        setWorkers(res.data.data.workerPerformance || []);
      }
    } catch (err) {
      console.error('Failed to load control desk collections:', err);
    }
  };

  useEffect(() => {
    loadData(true);
    loadReferenceData();
  }, [id, loadData]);

  // Real-time update checks via socket
  useEffect(() => {
    if (!socket || !id) return;

    const handleAdminSocketUpdate = (payload) => {
      console.log('🔄 Sockets event received in AdminComplaintDetails:', payload);
      const targetId = payload.complaint || payload.complaintId || payload.id;
      if (targetId === id) {
        loadData(false);
      }
    };

    socket.on('notification', handleAdminSocketUpdate);
    socket.on('status-updated', handleAdminSocketUpdate);
    socket.on('ai-completed', handleAdminSocketUpdate);
    socket.on('worker-assigned', handleAdminSocketUpdate);

    return () => {
      socket.off('notification', handleAdminSocketUpdate);
      socket.off('status-updated', handleAdminSocketUpdate);
      socket.off('ai-completed', handleAdminSocketUpdate);
      socket.off('worker-assigned', handleAdminSocketUpdate);
    };
  }, [socket, id, loadData]);

  // Extract maps configuration
  const coordinates = useMemo(() => complaint?.location?.coordinates || [], [complaint]);
  const mapPosition = coordinates.length === 2 ? [coordinates[1], coordinates[0]] : null;
  
  const originalImage = complaint?.complaintImages?.find(img => img.imageType === 'Complaint')?.url || complaint?.complaintImages?.[0]?.url;
  const resolutionImage = complaint?.resolution?.afterImages?.[0]?.url;

  // Filter workers who belong to the currently assigned department
  const filteredWorkers = useMemo(() => {
    if (!complaint?.assignment?.department) return [];
    const deptId = complaint.assignment.department._id || complaint.assignment.department;
    return workers.filter(w => {
      const workerDeptId = w.department?._id || w.department;
      return workerDeptId && workerDeptId.toString() === deptId.toString();
    });
  }, [complaint, workers]);

  // Submit Administrative Overrides
  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideValue) {
      toast.warning('A new selection value is required.');
      return;
    }
    if (!reason.trim()) {
      toast.warning('An override justification reason is required.');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (activeModal === 'priority') {
        res = await adminApi.overridePriority(id, { priority: overrideValue, reason });
      } else if (activeModal === 'department') {
        res = await adminApi.overrideDepartment(id, { departmentId: overrideValue, reason });
      } else if (activeModal === 'worker') {
        res = await adminApi.reassignWorker(id, { workerId: overrideValue, reason });
      } else if (activeModal === 'resolution') {
        res = await adminApi.overrideResolution(id, { decision: overrideValue, reason });
      }

      if (res?.data?.success) {
        toast.success('Administrative override executed successfully.');
        setActiveModal(null);
        setReason('');
        setOverrideValue('');
        loadData(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit override.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseComplaint = () => {
    setCloseModalOpen(true);
  };

  const confirmCloseComplaint = async (remarks) => {
    setIsClosing(true);
    try {
      const res = await adminApi.close(id, { remarks: remarks || 'Resolved and closed after audit verification' });
      if (res.data.success) {
        toast.success('Complaint status updated to Closed.');
        setCloseModalOpen(false);
        loadData(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to close complaint.');
    } finally {
      setIsClosing(false);
    }
  };

  if (loading && !complaint) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh] w-full bg-slate-50">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400 font-outfit">Syncing governance details desk...</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50 px-4 text-center min-h-[50vh] w-full">
        <div className="space-y-4">
          <AlertCircle className="mx-auto h-10 w-10 text-danger" />
          <h1 className="font-outfit text-base font-bold text-slate-900">Incident not found</h1>
          <p className="text-xs text-slate-500">The incident ID could not be loaded from database registry.</p>
          <Link to="/admin/complaints" className="inline-block text-xs font-bold text-primary hover:underline">
            Return to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6 w-full min-w-0">
        
        {/* Back Link */}
        <Link to="/admin/complaints" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
          <ArrowLeft className="h-3.5 w-3.5" />
          All Complaints Queue
        </Link>

        {/* Hero Header */}
        <header className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
              {complaint.complaintNumber || 'CIR-UNASSIGNED'}
            </p>
            <h1 className="mt-2 font-outfit text-2xl font-extrabold text-slate-950">{complaint.title}</h1>
            <p className="mt-1 text-xs text-slate-400">
              Filed: {new Date(complaint.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ComplaintStatusBadge status={complaint.status} />
            <ComplaintPriorityBadge priority={complaint.priority} />
          </div>
        </header>

        {/* Overrides Control Console */}
        <section className="bg-white border border-slate-200 rounded-card p-5 shadow-soft space-y-4">
          <h3 className="font-outfit text-base font-extrabold text-slate-950 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Administrative Override Actions
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            As an administrator, you have authoritative override rights. Update priority rankings, departments, worker tasks, or bypass AI classification outputs.
          </p>
          
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => { setActiveModal('priority'); setOverrideValue(complaint.priority); }}
              className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-button text-xs font-bold shadow-sm hover:bg-slate-100 transition"
            >
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              Override Priority
            </button>
            <button
              onClick={() => { setActiveModal('department'); setOverrideValue(complaint.assignment?.department?._id || ''); }}
              className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-button text-xs font-bold shadow-sm hover:bg-slate-100 transition"
            >
              <Building2 className="w-4 h-4 text-primary" />
              Override Department
            </button>
            <button
              onClick={() => { 
                if (!complaint.assignment?.department) {
                  toast.error('Assign a department first to select from its available workers.');
                  return;
                }
                setActiveModal('worker'); 
                setOverrideValue(complaint.assignment?.worker?._id || ''); 
              }}
              className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-button text-xs font-bold shadow-sm hover:bg-slate-100 transition"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Reassign Worker
            </button>
            
            {complaint.resolution?.afterImages?.length > 0 && (
              <button
                onClick={() => { setActiveModal('resolution'); setOverrideValue(complaint.resolution?.aiVerified ? 'Resolved' : 'Not Resolved'); }}
                className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-button text-xs font-bold shadow-sm hover:bg-slate-100 transition"
              >
                <Bot className="w-4 h-4 text-indigo-500" />
                Override AI Decision
              </button>
            )}

            {complaint.status === 'Resolved' && (
              <button
                onClick={handleCloseComplaint}
                className="inline-flex items-center gap-1 bg-success text-white px-4 py-1.5 rounded-button text-xs font-bold shadow hover:bg-success/90 transition ml-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                Close Complaint
              </button>
            )}
          </div>
        </section>

        {complaint.ai?.duplicateDetected && (
          <div className="bg-red-50 border border-red-200 text-danger p-4 rounded-card flex items-start gap-3 text-xs shadow-soft">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold font-outfit text-sm">Duplicate Complaint Detected</p>
              <p className="mt-1 leading-relaxed text-slate-600">
                The AI classification pipeline identified this issue as a duplicate of another incident.
                {complaint.ai.duplicateComplaint && (
                  <span className="block mt-1.5 font-semibold text-slate-700">
                    Related Complaint ID: <span className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">{complaint.ai.duplicateComplaint}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {!complaint.ai?.processed && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-card flex items-start gap-3 text-xs shadow-soft animate-pulse">
            <Loader2 className="h-5 w-5 text-primary shrink-0 mt-0.5 animate-spin" />
            <div>
              <p className="font-extrabold font-outfit text-sm text-primary">AI Vision Classification in Progress...</p>
              <p className="mt-0.5 leading-relaxed text-slate-600">
                The YOLO11 computer vision pipeline is analyzing the evidence photo, calculating severity & risk scores, and routing to the appropriate department.
              </p>
            </div>
          </div>
        )}

        {complaint.ai?.processed && (complaint.category === 'Other' || complaint.ai?.isCivicIssue === false) && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-card flex items-start gap-3 text-xs shadow-soft">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold font-outfit text-sm text-amber-900">No Recognized Civic Issue Detected (Non-Civic Submission)</p>
              <p className="mt-1 leading-relaxed text-amber-800">
                The AI vision model analyzed the uploaded image and found no municipal civic issue (e.g. Pothole, Road Damage, Garbage Overflow, Water Leakage, Open Manhole, Fallen Tree, Broken Streetlight). No department was assigned.
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
                Administrators can verify the image and use the override console above to assign a department if this was an edge case, or keep it closed.
              </p>
            </div>
          </div>
        )}

        {/* Content Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Main Details & Images */}
          <main className="space-y-6 lg:col-span-2">
            
            {/* Incident Image & Description */}
            <section className="rounded-card border border-slate-200 bg-white p-5 shadow-soft space-y-4">
              <h3 className="font-outfit text-base font-extrabold text-slate-950">Incident Evidence</h3>
              {originalImage ? (
                <img 
                  src={originalImage} 
                  alt="Original Incident photo" 
                  className="h-80 w-full rounded-xl object-cover border border-slate-100" 
                />
              ) : (
                <div className="grid h-48 place-items-center rounded-xl bg-slate-50 text-xs text-slate-400">
                  <ImageIcon className="h-5 w-5 mb-1" />
                  No Image Available
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Citizen Comments</p>
                <p className="text-xs leading-relaxed text-slate-700">{complaint.description || 'No comment descriptions logged.'}</p>
              </div>
            </section>

            {/* AI Summary Panel */}
            {complaint.ai?.processed && (
              <section className="rounded-card border border-slate-200 bg-white p-5 shadow-soft space-y-4">
                <h3 className="font-outfit text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                  <Bot className="h-5 w-5 text-indigo-500 animate-pulse" />
                  AI Classification Analysis
                </h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AI Category</p>
                    <p className="mt-1 font-bold text-slate-800">{complaint.ai.detectedCategory}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AI Confidence</p>
                    <p className="mt-1 font-bold text-slate-800">{complaint.ai.confidence}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AI Risk Score</p>
                    <p className="mt-1 font-bold text-slate-800">{complaint.ai.riskScore || 0}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duplicate Alert</p>
                    <p className={`mt-1 font-bold ${complaint.ai.duplicateDetected ? 'text-danger' : 'text-success'}`}>
                      {complaint.ai.duplicateDetected ? 'Duplicate Detected' : 'Unique Incident'}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Progress Images */}
            {complaint.resolution?.progressImages?.length > 0 && (
              <section className="rounded-card border border-slate-200 bg-white p-5 shadow-soft space-y-4">
                <h3 className="font-outfit text-base font-extrabold text-slate-950">Field Unit Progress Evidence</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.resolution.progressImages.map((img, index) => (
                    <div key={index} className="rounded-lg border border-slate-100 overflow-hidden bg-slate-50 flex flex-col">
                      <img src={img.url} alt="Progress update" className="h-28 w-full object-cover" />
                      <span className="text-[9px] text-slate-400 p-2 block text-center truncate">
                        Uploaded: {new Date(img.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Resolution evidence */}
            {resolutionImage && (
              <section className="rounded-card border border-slate-200 bg-white p-5 shadow-soft space-y-4">
                <h3 className="font-outfit text-base font-extrabold text-slate-950">Repair Submission Evidence</h3>
                <img 
                  src={resolutionImage} 
                  alt="Resolution proof" 
                  className="h-72 w-full rounded-xl object-cover border border-slate-100" 
                />
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block">AI Verification Decision</span>
                    <span className={`font-bold inline-block mt-1 ${complaint.resolution.aiVerified ? 'text-success' : 'text-danger'}`}>
                      AI Verified: {complaint.resolution.aiVerified ? 'Resolved' : 'Not Resolved'}
                    </span>
                    {complaint.resolution.verificationScore > 0 && (
                      <p className="text-[10px] text-slate-400 mt-1">Confidence verification score: {complaint.resolution.verificationScore}%</p>
                    )}
                  </div>
                  
                  {complaint.resolution.adminOverride && (
                    <div className="space-y-1 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-xs">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-indigo-400 block">Administrative Override Override Decision</span>
                      <span className="font-bold text-slate-900 inline-block mt-1">
                        Admin Decided: {complaint.resolution.adminOverrideDecision}
                      </span>
                      {complaint.resolution.adminOverrideReason && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">"Reason: {complaint.resolution.adminOverrideReason}"</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Worker Remarks</p>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                    "{complaint.resolution.remarks || 'No remarks provided.'}"
                  </p>
                </div>
              </section>
            )}

            {/* Citizen Feedback Rating */}
            {complaint.feedback?.submittedAt && (
              <section className="rounded-card border border-slate-200 bg-white p-5 shadow-soft space-y-3">
                <h3 className="font-outfit text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Citizen Feedback
                </h3>
                <div className="text-xs space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-700">Citizen Confirmation:</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      complaint.feedback.confirmed ? 'bg-emerald-50 text-success' : 'bg-red-50 text-danger'
                    }`}>
                      {complaint.feedback.confirmed ? 'Confirmed Resolved' : 'Flagged Incomplete'}
                    </span>
                  </div>
                  {complaint.feedback.comment && (
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                      "{complaint.feedback.comment}"
                    </p>
                  )}
                </div>
              </section>
            )}
          </main>
          
          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Target Address Info */}
            <section className="rounded-card border border-slate-200 bg-white p-5 shadow-soft space-y-4">
              <h3 className="font-outfit text-base font-extrabold text-slate-950">Assignment Summary</h3>
              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Address</p>
                    <p className="font-semibold text-slate-700 mt-0.5">{complaint.location?.address || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <User className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporting Citizen</p>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {complaint.citizen?.fullName || (complaint.citizen?.firstName ? `${complaint.citizen.firstName} ${complaint.citizen.lastName || ''}`.trim() : complaint.citizen?.name) || 'Anonymous Citizen'}
                    </p>
                    {(complaint.citizen?.email || complaint.citizen?.phone) && (
                      <p className="text-[10px] text-slate-400 font-medium">
                        {complaint.citizen?.email || complaint.citizen?.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Department</p>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {complaint.assignment?.department?.name || 'Unassigned'}
                      {complaint.assignment?.department && (
                        complaint.assignment.isAutoAssigned ? (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-200">
                            AI Recommended
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-slate-50 text-slate-500 border border-slate-200">
                            Admin Override
                          </span>
                        )
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Wrench className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Field Agent</p>
                    <p className="font-semibold text-slate-700 mt-0.5">
                      {complaint.assignment?.worker?.fullName || 'Awaiting assignment'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Static Leaflet map */}
            {mapPosition && (
              <section className="h-60 overflow-hidden rounded-card border border-slate-200 bg-white shadow-soft">
                <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={mapPosition} icon={incidentIcon} />
                </MapContainer>
              </section>
            )}

            {/* Timeline Audit Logs */}
            <section className="rounded-card border border-slate-200 bg-white p-5 shadow-soft space-y-4">
              <h3 className="font-outfit text-base font-extrabold text-slate-950">Audit log Timeline</h3>
              <ol className="relative border-l-2 border-slate-100 pl-4 space-y-4">
                {timeline.map((event) => (
                  <li key={event._id || event.id || Math.random()} className="relative">
                    <span className={`absolute -left-[21px] top-0 h-2.5 w-2.5 rounded-full border border-white ${
                      (event.eventType || '').includes('Resolved') || (event.eventType || '').includes('Verified') ? 'bg-success' :
                      (event.eventType || '').includes('Override') || (event.eventType || '').includes('Change') ? 'bg-indigo-500' :
                      (event.eventType || '').includes('Rejected') ? 'bg-danger' : 'bg-primary'
                    }`} />
                    <p className="text-xs font-bold text-slate-800">{event.eventType || 'System Event'}</p>
                    <p className="text-[11px] leading-relaxed text-slate-500 mt-0.5">{event.description || ''}</p>
                    {event.remarks && <p className="text-[10px] text-slate-400 italic mt-0.5">"{event.remarks}"</p>}
                    <time className="text-[9px] text-slate-400 block mt-1">
                      {event.createdAt ? new Date(event.createdAt).toLocaleString() : ''}
                    </time>
                  </li>
                ))}
              </ol>
            </section>
          </aside>

        </div>
      </div>

      {/* OVERRIDE MODAL DIALOGS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white border border-slate-200 shadow-premium w-full max-w-md rounded-card overflow-hidden">
            <header className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h4 className="font-outfit text-sm font-extrabold text-slate-850 uppercase tracking-wide">
                {activeModal === 'priority' ? 'Override Priority Level' :
                 activeModal === 'department' ? 'Override Route Department' :
                 activeModal === 'worker' ? 'Reassign Incident Worker' :
                 'Override AI Resolution Status'}
              </h4>
              <button 
                onClick={() => { setActiveModal(null); setReason(''); setOverrideValue(''); }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times; Close
              </button>
            </header>

            <form onSubmit={handleOverrideSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Overriding selector values */}
              {activeModal === 'priority' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 block">Select Priority Rank</label>
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-button focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              )}

              {activeModal === 'department' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 block">Select Target Department</label>
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-button focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeModal === 'worker' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 block">Select Field Worker</label>
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-button focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="">-- Choose Worker --</option>
                    {filteredWorkers.map(w => (
                      <option key={w._id} value={w._id}>
                        {w.fullName} ({w.availability} - Load: {w.workload})
                      </option>
                    ))}
                  </select>
                  {filteredWorkers.length === 0 && (
                    <p className="text-[10px] text-amber-500 font-semibold mt-1">
                      ⚠️ No active workers registered in the assigned department.
                    </p>
                  )}
                </div>
              )}

              {activeModal === 'resolution' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-600 block">Select Resolution Outcome</label>
                  <select
                    value={overrideValue}
                    onChange={(e) => setOverrideValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-button focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="Resolved">Resolved</option>
                    <option value="Not Resolved">Not Resolved</option>
                  </select>
                </div>
              )}

              {/* Justification remarks textarea */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 block">Justification Reason</label>
                <textarea
                  rows="4"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide audit justification details for executing this override..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-button focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Form buttons */}
              <footer className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); setReason(''); setOverrideValue(''); }}
                  className="flex-1 py-2 rounded-button border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-2 rounded-button transition shadow"
                >
                  {submitting ? 'Applying Override...' : 'Submit Override'}
                </button>
              </footer>

            </form>
          </div>
        </div>
      )}

      {/* Complaint Close Confirmation / Audit Remarks Dialog */}
      <ConfirmDialog
        isOpen={closeModalOpen}
        title="Close Complaint Audit Verification"
        message="Please provide closing audit remarks before finalizing and archiving this complaint."
        confirmText="Finalize & Close Complaint"
        confirmVariant="primary"
        iconType="info"
        isLoading={isClosing}
        isPrompt={true}
        promptLabel="Audit Remarks / Closing Notes"
        promptPlaceholder="e.g., Physical site inspection verified and approved for final closure."
        promptRequired={false}
        onConfirm={confirmCloseComplaint}
        onCancel={() => {
          if (!isClosing) {
            setCloseModalOpen(false);
          }
        }}
      />

    </div>
  );
}
