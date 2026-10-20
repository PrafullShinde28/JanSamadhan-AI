import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { complaintApi } from '../api/complaint.api';
import { useSocket } from '../context/SocketContext';
import { 
  Loader2, 
  MapPin, 
  Compass, 
  ArrowRight,
  Filter,
  Activity,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';

// Center map component
function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function CitizenMap() {
  const socket = useSocket();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection tracking
  const [selectedId, setSelectedId] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await complaintApi.citizenList();
      setComplaints(res.data.data || []);
    } catch (err) {
      console.error('Failed to load citizen maps:', err);
      setError(err.message || 'Failed to sync spatial telemetry.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  // Track real-time socket events to update map pins
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchTasks(false);
    socket.on('notification', handleUpdate);
    socket.on('status-updated', handleUpdate);
    socket.on('ai-completed', handleUpdate);
    return () => {
      socket.off('notification', handleUpdate);
      socket.off('status-updated', handleUpdate);
      socket.off('ai-completed', handleUpdate);
    };
  }, [socket, fetchTasks]);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      const hasCoords = c.location?.coordinates?.length === 2;
      return matchesStatus && matchesPriority && hasCoords;
    });
  }, [complaints, statusFilter, priorityFilter]);

  // Selected complaint details
  const selectedComplaint = useMemo(() => {
    if (selectedId) {
      return complaints.find(c => c._id === selectedId);
    }
    return null;
  }, [selectedId, complaints]);

  // Center coordinate of map view
  const mapCenter = useMemo(() => {
    if (selectedComplaint) {
      const coords = selectedComplaint.location?.coordinates || [];
      if (coords.length === 2) {
        return [coords[1], coords[0]];
      }
    }
    if (filteredComplaints.length > 0) {
      const first = filteredComplaints[0].location.coordinates;
      return [first[1], first[0]];
    }
    return [19.0760, 72.8777]; // Default city center fallback
  }, [selectedComplaint, filteredComplaints]);

  // Marker icon builder by status color
  const getMarkerIcon = (status, isSel) => {
    let color = 'blue';
    if (status === 'Pending') color = 'orange';
    else if (status === 'Under Review') color = 'gold';
    else if (status === 'Assigned') color = 'violet';
    else if (status === 'In Progress') color = 'red';
    else if (status === 'Resolved') color = 'green';
    else if (status === 'Closed') color = 'grey';

    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: isSel ? [30, 48] : [25, 41],
      iconAnchor: isSel ? [15, 48] : [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh] w-full">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400 font-outfit">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-7rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-[calc(100vh-4rem)] relative w-full overflow-hidden min-w-0">
      
      {/* Floating Filter selectors bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex gap-2 max-w-lg md:max-w-md bg-white/95 backdrop-blur shadow-soft p-2.5 rounded-xl border border-slate-100/50">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-205 rounded-button h-9 px-2.5 text-[10px] font-bold text-slate-700 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-205 rounded-button h-9 px-2.5 text-[10px] font-bold text-slate-700 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <button 
          onClick={() => fetchTasks(false)} 
          className="h-9 w-9 bg-primary/10 text-primary flex items-center justify-center rounded-button shrink-0 hover:bg-primary/20 transition cursor-pointer"
          title="Refresh markers"
        >
          <Compass className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Leaflet map frame */}
      <div className="flex-grow w-full h-full relative z-10 min-w-0">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ChangeMapView center={mapCenter} />

          {/* Render markers */}
          {filteredComplaints.map((c) => {
            const isSel = selectedComplaint?._id === c._id;
            return (
              <Marker 
                key={c._id} 
                position={[c.location.coordinates[1], c.location.coordinates[0]]} 
                icon={getMarkerIcon(c.status, isSel)}
                eventHandlers={{
                  click: () => {
                    setSelectedId(c._id);
                  }
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Details sidebar (desktop) / Drawer panel overlay (mobile) */}
      <div className={`absolute md:relative bottom-0 left-0 right-0 z-[1000] md:z-20 max-h-[45%] md:max-h-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-150 shadow-lg flex flex-col transition-all duration-300 ${
        !selectedComplaint ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedComplaint ? (
          <div className="p-4 flex-grow flex flex-col justify-between overflow-y-auto space-y-4 min-w-0">
            <div className="space-y-3 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border px-2 py-0.5 rounded truncate max-w-[120px]">
                  #{selectedComplaint.complaintNumber || selectedComplaint._id.slice(-6).toUpperCase()}
                </span>
                
                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <ComplaintStatusBadge status={selectedComplaint.status} />
                  <ComplaintPriorityBadge priority={selectedComplaint.priority} />
                  
                  {/* Close button */}
                  <button 
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition cursor-pointer shrink-0 ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="min-w-0">
                <h4 className="font-outfit text-[9px] font-bold uppercase tracking-wider text-slate-400">Report details</h4>
                <h3 className="font-bold text-slate-805 text-xs sm:text-sm leading-snug mt-1 font-outfit line-clamp-1 break-words">{selectedComplaint.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-normal break-words">{selectedComplaint.description}</p>
              </div>

              <div className="space-y-2 border-t pt-3 border-slate-50 text-[10.5px] text-slate-600 min-w-0">
                <div className="flex items-start gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight flex-grow break-words">{selectedComplaint.location?.address}</span>
                </div>
              </div>
            </div>

            {/* Link details redirect */}
            <div className="pt-2 border-t border-slate-100 shrink-0">
              <Link
                to={`/citizen/complaints/${selectedComplaint._id}`}
                className="block w-full text-center text-xs font-bold text-primary py-2.5 rounded-button bg-slate-50 hover:bg-primary/10 transition uppercase tracking-wide font-outfit cursor-pointer"
              >
                Inspect Details Page &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex p-8 text-center flex-grow items-center justify-center text-slate-400 text-xs">
            <div className="space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
              <p className="font-semibold">No report selected</p>
              <p className="text-[10px] text-slate-400 font-medium">Tap any of your pins on the map to see details.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
