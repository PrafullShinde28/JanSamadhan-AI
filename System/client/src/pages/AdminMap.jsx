import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { adminApi } from '../api/admin.api';
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Filter, 
  ArrowLeft,
  Map as MapIcon,
  X,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';
import SkeletonMap from '../components/ui/skeleton/SkeletonMap';

export default function AdminMap() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Map filters state
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Selected incident details panel state
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Fetch departments list for the filter
  const fetchDepartments = async () => {
    try {
      const res = await adminApi.dashboard();
      if (res.data.success) {
        setDepartments(res.data.data.departmentPerformance || []);
      }
    } catch (err) {
      console.error('Failed to pre-fetch departments list:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchMapComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: 1,
        limit: 100, // Load up to 100 coordinates to plot on map
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
        ...(departmentId && { department: departmentId })
      };

      const res = await adminApi.complaints(params);
      if (res.data.success) {
        setComplaints(res.data.data.complaints || []);
      }
    } catch (err) {
      console.error('Error fetching map coordinates:', err);
      setError(err.message || 'Failed to sync spatial data.');
    } finally {
      setLoading(false);
    }
  }, [status, priority, category, departmentId]);

  useEffect(() => {
    fetchMapComplaints();
  }, [fetchMapComplaints]);

  // Leaflet custom marker markers based on status
  const getMarkerIcon = (status) => {
    let color = 'blue';
    if (status === 'Pending') color = 'red';
    else if (status === 'Assigned') color = 'orange';
    else if (status === 'In Progress') color = 'violet';
    else if (status === 'Resolved') color = 'green';
    else if (status === 'Closed') color = 'grey';

    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Center coordinate of markers or fallback to Mumbai default center
  const mapCenter = useMemo(() => {
    const validCoords = complaints.filter(c => c.location?.coordinates?.length === 2);
    if (validCoords.length > 0) {
      const latSum = validCoords.reduce((acc, curr) => acc + curr.location.coordinates[1], 0);
      const lonSum = validCoords.reduce((acc, curr) => acc + curr.location.coordinates[0], 0);
      return [latSum / validCoords.length, lonSum / validCoords.length];
    }
    return [19.0760, 72.8777]; // Default Mumbai Center coordinates
  }, [complaints]);

  const categories = ['Pothole', 'Garbage Overflow', 'Broken Streetlight', 'Water Leakage', 'Drainage Issue', 'Road Damage', 'Fallen Tree', 'Open Manhole', 'Other'];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-5 w-full max-w-full h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-hidden min-w-0 flex flex-col relative">
      
      {/* Header (collapsible/compact) */}
      <header className="bg-white border border-slate-200 rounded-card p-3 sm:p-4 shadow-soft flex flex-col justify-between items-start gap-1 w-full min-w-0 shrink-0">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
          <ArrowLeft className="h-3 w-3" />
          Control Center
        </Link>
        <h1 className="font-outfit text-sm sm:text-base font-extrabold text-slate-909 flex items-center gap-1.5 leading-snug">
          <MapIcon className="h-4.5 w-4.5 text-primary shrink-0" />
          Incidents Spatial Map
        </h1>
      </header>

      {/* Filters Toolbar */}
      <section className="bg-white border border-slate-200 rounded-card p-3 shadow-soft grid gap-2 grid-cols-2 sm:grid-cols-4 shrink-0 w-full min-w-0">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-button px-2 h-9">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSelectedIncident(null); }}
            className="w-full bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none"
          >
            <option value="">Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-button px-2 h-9">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setSelectedIncident(null); }}
            className="w-full bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none"
          >
            <option value="">Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-button px-2 h-9">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSelectedIncident(null); }}
            className="w-full bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none"
          >
            <option value="">Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-button px-2 h-9">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <select
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setSelectedIncident(null); }}
            className="w-full bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none"
          >
            <option value="">Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Map Content panel */}
      <div className="flex-grow w-full rounded-card border border-slate-200 bg-white overflow-hidden shadow-soft relative z-10 min-h-0">
        
        {loading && complaints.length === 0 ? (
          <SkeletonMap className="h-full w-full rounded-none" />
        ) : error ? (
          <div className="h-full w-full flex items-center justify-center p-6 text-center">
            <div className="space-y-3">
              <AlertCircle className="w-10 h-10 text-danger mx-auto" />
              <h3 className="font-bold text-slate-808 text-sm">Failed to Sync Spatial Map</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">{error}</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full relative">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {complaints
                .filter(c => c.location?.coordinates?.length === 2)
                .map((c) => {
                  const position = [c.location.coordinates[1], c.location.coordinates[0]];
                  return (
                    <Marker 
                      key={c._id} 
                      position={position} 
                      icon={getMarkerIcon(c.status)}
                      eventHandlers={{
                        click: () => {
                          setSelectedIncident(c);
                        }
                      }}
                    />
                  );
                })}
            </MapContainer>

            {/* Desktop Overlay Selected Panel Panel - displays floating absolute right */}
            {selectedIncident && (
              <div className="absolute right-4 top-4 bottom-4 w-80 bg-white shadow-premium border border-slate-200 rounded-xl z-20 p-4 space-y-3.5 overflow-y-auto hidden md:flex flex-col justify-between select-none animate-slideLeft">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border px-2 py-0.5 rounded">
                      #{selectedIncident.complaintNumber || selectedIncident._id.slice(-6).toUpperCase()}
                    </span>
                    <button
                      onClick={() => setSelectedIncident(null)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                      aria-label="Close summary card"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">Title / Category</span>
                    <h4 className="font-extrabold text-slate-805 text-xs leading-snug">{selectedIncident.title}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{selectedIncident.category}</p>
                  </div>

                  <div className="flex gap-1.5 py-0.5">
                    <ComplaintStatusBadge status={selectedIncident.status} />
                    <ComplaintPriorityBadge priority={selectedIncident.priority} />
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      Address Coordinates
                    </span>
                    <p className="text-slate-600 leading-normal font-semibold pl-4.5">{selectedIncident.location?.address || 'N/A'}</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[10px] space-y-1 text-slate-500 font-semibold">
                    <div className="flex justify-between truncate gap-2">
                      <span>Division:</span>
                      <strong className="text-slate-800">{selectedIncident.assignment?.department?.code || 'Unassigned'}</strong>
                    </div>
                    <div className="flex justify-between truncate gap-2">
                      <span>Worker:</span>
                      <strong className="text-slate-800">{selectedIncident.assignment?.worker?.fullName || 'Unassigned'}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Link 
                    to={`/admin/complaints/${selectedIncident._id}`}
                    className="w-full h-11 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-button shadow transition flex items-center justify-center gap-1"
                  >
                    <ClipboardList className="w-4 h-4 shrink-0" />
                    <span>Manage Dispatch details</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Sliding Bottom Sheet Selected Incident Drawer (hidden >= md) */}
      {selectedIncident && (
        <div 
          className="md:hidden fixed inset-0 z-45 bg-black/35 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedIncident(null)}
        />
      )}

      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-150 rounded-t-card p-4 space-y-4.5 shadow-soft transform transition-transform duration-300 pb-[calc(1.5rem+env(safe-area-inset-bottom))] ${
        selectedIncident ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex justify-between items-center border-b pb-2 border-slate-100">
          <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border px-2 py-0.5 rounded">
            #{selectedIncident?.complaintNumber || selectedIncident?._id?.slice(-6).toUpperCase()}
          </span>
          <button 
            type="button"
            onClick={() => setSelectedIncident(null)}
            className="p-1 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected parameters */}
        <div className="space-y-3.5 min-w-0">
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-808 text-xs leading-normal break-words">{selectedIncident?.title}</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{selectedIncident?.category}</p>
          </div>

          <div className="flex gap-1.5 select-none">
            {selectedIncident && (
              <>
                <ComplaintStatusBadge status={selectedIncident.status} />
                <ComplaintPriorityBadge priority={selectedIncident.priority} />
              </>
            )}
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              Address Coordinates
            </span>
            <p className="text-slate-600 leading-normal font-semibold pl-5 break-words">{selectedIncident?.location?.address || 'N/A'}</p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[10px] space-y-1.5 text-slate-500 font-semibold min-w-0">
            <div className="flex justify-between truncate gap-2">
              <span>Department:</span>
              <strong className="text-slate-850">{selectedIncident?.assignment?.department?.code || 'Unassigned'}</strong>
            </div>
            <div className="flex justify-between truncate gap-2">
              <span>Worker:</span>
              <strong className="text-slate-850">{selectedIncident?.assignment?.worker?.fullName || 'Unassigned'}</strong>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="pt-1 w-full">
          <Link
            to={`/admin/complaints/${selectedIncident?._id}`}
            className="w-full h-12 inline-flex items-center justify-center gap-1.5 rounded-button bg-primary text-white text-xs font-bold shadow hover:bg-primary-dark transition select-none"
          >
            <span>Manage Incident details</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
