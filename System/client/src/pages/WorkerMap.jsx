import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, Circle, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { workerApi } from '../api/worker.api';
import { useSocket } from '../context/SocketContext';
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Navigation, 
  Compass, 
  Wrench, 
  ArrowRight,
  Filter,
  Activity,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ComplaintPriorityBadge, ComplaintStatusBadge } from '../components/complaint/ComplaintStatusBadge';

// Helper to pan map
function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Distance helper
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

export default function WorkerMap() {
  const socket = useSocket();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Geolocation states
  const [workerCoords, setWorkerCoords] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await workerApi.complaints();
      if (res.data.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load map tasks:', err);
      setError(err.message || 'Failed to download spatial dispatcher logs.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  // Track socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchTasks(false);
    socket.on('notification', handleUpdate);
    socket.on('status-updated', handleUpdate);
    socket.on('worker-assigned', handleUpdate);
    return () => {
      socket.off('notification', handleUpdate);
      socket.off('status-updated', handleUpdate);
      socket.off('worker-assigned', handleUpdate);
    };
  }, [socket, fetchTasks]);

  // Get live worker GPS lock
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setWorkerCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => console.warn('WorkerMap location lock ignored:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      const hasCoords = c.location?.coordinates?.length === 2;
      return matchesStatus && matchesPriority && hasCoords;
    });
  }, [complaints, statusFilter, priorityFilter]);

  // Determine active task selection
  const selectedComplaint = useMemo(() => {
    if (selectedId) {
      return complaints.find(c => c._id === selectedId);
    }
    // Default select first active task if available
    return complaints.find(c => ['Assigned', 'In Progress'].includes(c.status));
  }, [selectedId, complaints]);

  // Coordinates
  const selectedCoords = useMemo(() => {
    if (!selectedComplaint) return null;
    const coords = selectedComplaint.location?.coordinates || [];
    if (coords.length === 2) {
      return { longitude: coords[0], latitude: coords[1] };
    }
    return null;
  }, [selectedComplaint]);

  // Distance computation
  const selectedDistance = useMemo(() => {
    if (!selectedCoords || !workerCoords) return null;
    return getDistance(
      selectedCoords.latitude,
      selectedCoords.longitude,
      workerCoords.latitude,
      workerCoords.longitude
    );
  }, [selectedCoords, workerCoords]);

  // Center coordinate of Leaflet viewport: Focus selected marker first, then worker, then fallback
  const mapCenter = useMemo(() => {
    if (selectedCoords) {
      return [selectedCoords.latitude, selectedCoords.longitude];
    }
    if (workerCoords) {
      return [workerCoords.latitude, workerCoords.longitude];
    }
    if (filteredComplaints.length > 0) {
      const first = filteredComplaints[0].location.coordinates;
      return [first[1], first[0]];
    }
    return [19.0760, 72.8777]; // Default fallback
  }, [selectedCoords, workerCoords, filteredComplaints]);

  // Custom marker markers based on status
  const getMarkerIcon = (status, isSel) => {
    let color = 'blue';
    if (status === 'Assigned') color = 'orange';
    else if (status === 'In Progress') color = 'violet';
    else if (status === 'Resolved') color = 'green';
    else if (status === 'Closed') color = 'grey';

    // If selected, use a larger scale icon
    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: isSel ? [30, 48] : [25, 41],
      iconAnchor: isSel ? [15, 48] : [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  const workerIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  if (loading && complaints.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh] w-full">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400 font-outfit">Loading dispatch maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-7rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] md:h-[calc(100vh-4rem)] relative w-full overflow-hidden min-w-0">
      
      {/* Top Filter Bar - Compact Floating Widget */}
      <div className="absolute top-3 left-3 right-3 z-30 flex gap-2 max-w-lg md:max-w-md bg-white/95 backdrop-blur shadow-soft p-2.5 rounded-xl border border-slate-100/50">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-button h-9 px-2.5 text-[10px] font-bold text-slate-700 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-button h-9 px-2.5 text-[10px] font-bold text-slate-700 focus:outline-none"
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
          title="Sync map tasks"
        >
          <Compass className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Map Viewport Container */}
      <div className="flex-grow w-full h-full relative z-10 min-w-0">
        <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ChangeMapView center={mapCenter} />

          {/* User Geolocation Marker */}
          {workerCoords && (
            <>
              <Marker position={[workerCoords.latitude, workerCoords.longitude]} icon={workerIcon}>
                <Popup><span className="text-xs font-bold text-slate-805">You are here (GPS locked)</span></Popup>
              </Marker>
              <Circle center={[workerCoords.latitude, workerCoords.longitude]} radius={50} pathOptions={{ color: '#2563EB', fillOpacity: 0.03 }} />
            </>
          )}

          {/* Complaint Location Markers */}
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

          {/* Polyline line connector from Worker to Selected Complaint */}
          {workerCoords && selectedCoords && (
            <Polyline 
              positions={[
                [workerCoords.latitude, workerCoords.longitude],
                [selectedCoords.latitude, selectedCoords.longitude]
              ]} 
              pathOptions={{ color: '#4F46E5', dashArray: '6, 6', weight: 2 }} 
            />
          )}
        </MapContainer>
      </div>

      {/* Details Drawer: floats absolute bottom on mobile, sits relative right panel on desktop */}
      <div className={`absolute md:relative bottom-0 left-0 right-0 z-[1000] md:z-20 max-h-[45%] md:max-h-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-150 shadow-lg flex flex-col transition-all duration-300 ${
        !selectedComplaint ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Detail Panel Content */}
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
                  
                  {/* Close/Dismiss Button for mobile drawers */}
                  <button 
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition shrink-0 cursor-pointer ml-1"
                    title="Dismiss selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="min-w-0">
                <h4 className="font-outfit text-[9px] font-bold uppercase tracking-wider text-slate-400">Selected Assignment</h4>
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug mt-1 font-outfit line-clamp-1 break-words">{selectedComplaint.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-normal break-words">{selectedComplaint.description}</p>
              </div>

              <div className="space-y-2 border-t pt-3 border-slate-50 text-[10.5px] text-slate-600 min-w-0">
                <div className="flex items-start gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight flex-grow break-words">{selectedComplaint.location?.address}</span>
                </div>
                {selectedDistance !== null && (
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 shrink-0">
                    <Activity className="w-4 h-4 text-primary shrink-0" />
                    <span>Est. Distance: {selectedDistance >= 1000 ? `${(selectedDistance/1000).toFixed(2)} km` : `${selectedDistance.toFixed(0)} meters`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick dispatch operations buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 shrink-0">
              <div className="flex gap-2">
                {selectedCoords && (
                  <Link
                    to={`/worker/complaints/${selectedComplaint._id}/navigation`}
                    className="flex-1 bg-primary text-white text-center font-bold text-xs h-10 rounded-button flex items-center justify-center shadow select-none hover:bg-primary-dark transition cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                    Live Navigation
                  </Link>
                )}
              </div>
              
              <Link
                to={`/worker/complaints/${selectedComplaint._id}`}
                className="w-full text-center text-xs font-bold text-primary py-2 rounded-button bg-slate-50 hover:bg-primary/10 transition uppercase tracking-wide font-outfit"
              >
                View Full Details Page &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex p-8 text-center flex-grow items-center justify-center text-slate-400 text-xs">
            <div className="space-y-2">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
              <p className="font-semibold">No assignment selected</p>
              <p className="text-[10px] text-slate-400">Tap any marker on the map to inspect details.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
