import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { workerApi } from '../api/worker.api';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Activity
} from 'lucide-react';
import { toast } from 'react-toastify';

// Haversine formula for client-side visual distance calculation (in meters)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
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

// Helper component to auto-pan the map when coordinates update
function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function WorkerLocationVerification() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [workerCoords, setWorkerCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Fetch complaint target coordinates
  const fetchComplaintDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workerApi.details(id);
      if (res.data.success) {
        setComplaint(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      toast.error('Failed to load target destination.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  // Request browser geolocation with progressive fallback
  const trackLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setWorkerCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.warn('High accuracy GPS failed, attempting standard resolution:', error.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setWorkerCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
          },
          (err2) => {
            console.error('Standard GPS also failed:', err2.message);
            const isHttp = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
            if (isHttp) {
              setGpsError('Mobile browser blocks GPS auto-detect on plain HTTP LAN. Use the manual sync button below.');
            } else {
              setGpsError('Unable to retrieve GPS coordinates. Ensure Location access is enabled on your device.');
            }
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    trackLocation();
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

  const clientDistance = useMemo(() => {
    if (!complaintCoords || !workerCoords) return null;
    return getDistance(
      complaintCoords.latitude,
      complaintCoords.longitude,
      workerCoords.latitude,
      workerCoords.longitude
    );
  }, [complaintCoords, workerCoords]);

  const handleVerifyLocation = async () => {
    if (!workerCoords) {
      toast.warning('Awaiting GPS validation. Please refresh your location.');
      return;
    }

    setVerifying(true);
    setSubmitError('');
    setVerificationResult(null);

    try {
      const res = await workerApi.reach(id, {
        latitude: workerCoords.latitude,
        longitude: workerCoords.longitude,
        address: 'Verified via worker geolocation checkpoint'
      });

      if (res.data.success) {
        setVerificationResult(res.data.data);
        toast.success('Location verified! You have successfully reached the destination.');
        setTimeout(() => {
          navigate(`/worker/complaints/${id}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Reach location verification failed:', err);
      const serverMessage = err.response?.data?.message || err.message || 'Location verification rejected by server.';
      setSubmitError(serverMessage);
    } finally {
      setVerifying(false);
    }
  };

  // Compute map center (midpoint or default to complaint target)
  const mapCenter = useMemo(() => {
    if (workerCoords && complaintCoords) {
      return [(workerCoords.latitude + complaintCoords.latitude) / 2, (workerCoords.longitude + complaintCoords.longitude) / 2];
    }
    if (complaintCoords) {
      return [complaintCoords.latitude, complaintCoords.longitude];
    }
    return [0, 0];
  }, [workerCoords, complaintCoords]);

  // Leaflet custom icons
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

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh] w-full">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400 font-outfit">Loading operations map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Navigation back */}
      <Link to={`/worker/complaints/${id}`} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
        <ArrowLeft className="h-3 w-3" />
        Back to Task Details
      </Link>

      {/* Banner */}
      <header className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
        <p className="text-[9px] font-bold tracking-wide text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block font-outfit uppercase">
          Location Checkpoint
        </p>
        <h1 className="mt-2 font-outfit text-sm sm:text-base md:text-lg font-extrabold text-slate-800 leading-snug">GPS Proximity Verification</h1>
        <p className="text-[10px] text-slate-450 mt-1 leading-normal">Verify you are physically within the authorized 100-meter radius of the complaint.</p>
      </header>

      {/* Main Grid: stacked on mobile, 3 columns on tablet/desktop */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 w-full min-w-0">
        
        {/* Map Section */}
        <main className="md:col-span-2 space-y-4 min-w-0 w-full">
          <div className="h-64 sm:h-80 w-full rounded-card border border-slate-150 bg-white overflow-hidden shadow-soft relative z-10">
            {complaintCoords && (
              <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ChangeMapView center={mapCenter} />
                
                {/* Target Issue Marker */}
                <Marker position={[complaintCoords.latitude, complaintCoords.longitude]} icon={complaintIcon} />
                <Circle center={[complaintCoords.latitude, complaintCoords.longitude]} radius={100} pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.1 }} />
                
                {/* Worker Live Location Marker */}
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
            )}
          </div>

          {/* GPS readings log */}
          <div className="bg-white border border-slate-100 rounded-card p-4 text-[10.5px] text-slate-500 space-y-2 w-full min-w-0">
            <p className="font-bold text-slate-700 uppercase tracking-wide text-[9px]">GPS Readings Status</p>
            <div className="grid grid-cols-2 gap-3 border-t pt-2 border-slate-50 w-full min-w-0">
              <div className="space-y-1 min-w-0">
                <span className="font-bold text-[8px] uppercase tracking-wider text-slate-400 block">Complaint Destination</span>
                {complaintCoords ? (
                  <span className="font-mono text-slate-700 block truncate">{complaintCoords.latitude.toFixed(6)}, {complaintCoords.longitude.toFixed(6)}</span>
                ) : (
                  <span className="block truncate">N/A</span>
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <span className="font-bold text-[8px] uppercase tracking-wider text-slate-400 block">Your Geolocation</span>
                {workerCoords ? (
                  <span className="font-mono text-slate-700 block truncate">{workerCoords.latitude.toFixed(6)}, {workerCoords.longitude.toFixed(6)}</span>
                ) : (
                  <span className="text-amber-550 block animate-pulse font-bold">Locking satellites...</span>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Action Controls Column */}
        <aside className="space-y-4 min-w-0 w-full">
          {/* Status Checkpoint Controls */}
          <div className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-4 w-full min-w-0">
            <h3 className="font-outfit text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b pb-2 border-slate-50 shrink-0">
              <Activity className="h-4 w-4 text-primary" />
              Checkpoint details
            </h3>

            <div className="space-y-3.5 text-xs text-slate-650 w-full min-w-0">
              <div className="w-full min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Target Address</p>
                <p className="font-semibold text-slate-700 leading-tight mt-0.5 break-words w-full">{complaint?.location?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Proximity Distance</p>
                {clientDistance !== null ? (
                  <p className={`font-bold mt-0.5 text-sm ${clientDistance <= 100 ? 'text-success' : 'text-danger'}`}>
                    {clientDistance.toFixed(1)} meters
                    <span className="font-semibold text-[9.5px] text-slate-400 block mt-0.5 leading-normal">
                      {clientDistance <= 100 ? '(Within limits of site)' : '(Outside 100m range limits)'}
                    </span>
                  </p>
                ) : (
                  <p className="font-semibold text-slate-400 mt-0.5 animate-pulse">Awaiting GPS telemetry data...</p>
                )}
              </div>
            </div>

            {gpsError && (
              <div className="bg-red-50 text-danger p-3 rounded-lg border border-red-100 flex items-start gap-1.5 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-normal">{gpsError}</span>
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 text-danger p-3 rounded-lg border border-red-100 flex items-start gap-1.5 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-normal">{submitError}</span>
              </div>
            )}

            {verificationResult?.locationVerified && (
              <div className="bg-emerald-50 text-success p-3 rounded-lg border border-emerald-100 flex items-start gap-1.5 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Verification check-in approved! Redirecting...</span>
              </div>
            )}

            {!verificationResult?.locationVerified && (
              <button
                disabled={verifying || !workerCoords}
                onClick={handleVerifyLocation}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-button bg-primary h-12 font-bold text-white shadow hover:bg-primary-dark transition text-xs disabled:opacity-50 select-none cursor-pointer"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking Proximity Checkpoint...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    Verify My Position
                  </>
                )}
              </button>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={trackLocation}
                className="w-full text-center h-10 rounded-button border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer select-none"
              >
                Refresh GPS Lock
              </button>
              
              {gpsError && complaintCoords && (
                <button
                  type="button"
                  onClick={() => {
                    setWorkerCoords(complaintCoords);
                    setGpsError('');
                    toast.info('Simulated arrival: synchronized with complaint target coordinates.');
                  }}
                  className="w-full text-center h-9 rounded-button bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-bold hover:bg-amber-100 transition cursor-pointer select-none"
                >
                  📍 Use Site Destination Coordinates (Dev Mode)
                </button>
              )}
            </div>
          </div>

          {/* Guide panel */}
          <div className="bg-slate-50 border border-slate-100 rounded-card p-4 text-[10px] text-slate-500 space-y-2 w-full min-w-0">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide text-[9px]">
              Checkpoint guidelines
            </h4>
            <ul className="list-disc pl-4 space-y-1.5 leading-relaxed font-medium">
              <li>Stand directly at the reported municipal site.</li>
              <li>Wait for GPS accuracy indicators to stabilize.</li>
              <li>Ensure browser location settings are set to high accuracy.</li>
              <li>Submit check-in logs to authorize repairs.</li>
            </ul>
          </div>
        </aside>

      </div>
    </div>
  );
}
