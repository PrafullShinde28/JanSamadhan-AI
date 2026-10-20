import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, Circle, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { workerApi } from '../api/worker.api';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Crosshair,
  Compass,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Maximize2,
  Sparkles,
  Camera
} from 'lucide-react';
import { toast } from 'react-toastify';

// Custom Leaflet Icons
const incidentIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -38],
  shadowSize: [41, 41]
});

const workerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [28, 46],
  iconAnchor: [14, 46],
  popupAnchor: [1, -38],
  shadowSize: [41, 41]
});

// Haversine distance formula (in meters)
const calculateHaversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Map View Controller for dynamic auto-fit & recentering
function MapController({ workerPosition, destinationPosition, recenterTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (workerPosition && destinationPosition) {
      const bounds = L.latLngBounds([
        [workerPosition.latitude, workerPosition.longitude],
        [destinationPosition.latitude, destinationPosition.longitude]
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
    } else if (workerPosition) {
      map.setView([workerPosition.latitude, workerPosition.longitude], 16);
    } else if (destinationPosition) {
      map.setView([destinationPosition.latitude, destinationPosition.longitude], 16);
    }
  }, [recenterTrigger, map]);

  return null;
}

export default function WorkerLiveNavigation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [workerLocation, setWorkerLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [heading, setHeading] = useState(null);
  const [gpsError, setGpsError] = useState('');
  
  // Route details
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeDistanceMeters, setRouteDistanceMeters] = useState(null);
  const [routeDurationSeconds, setRouteDurationSeconds] = useState(null);
  const [routingFailed, setRoutingFailed] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  // States
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [verifyingArrival, setVerifyingArrival] = useState(false);
  const [recenterCounter, setRecenterCounter] = useState(0);
  const [hasReached, setHasReached] = useState(false);

  const watchIdRef = useRef(null);
  const lastRouteFetchTimeRef = useRef(0);

  // 1. Fetch Complaint Information
  const loadComplaint = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const res = await workerApi.details(id);
      if (res.data.success) {
        setComplaint(res.data.data);
        if (res.data.data?.status === 'In Progress' && res.data.data?.timeline) {
          // Check if already reached
          const reachedEvent = res.data.data.timeline.some(e => e.eventType === 'Worker Reached Location');
          if (reachedEvent) setHasReached(true);
        }
      }
    } catch (err) {
      console.error('Failed to load incident details:', err);
      toast.error('Failed to retrieve target destination details.');
    } finally {
      setLoadingDetails(false);
    }
  }, [id]);

  useEffect(() => {
    loadComplaint();
  }, [loadComplaint]);

  // Target Destination Coords
  const destinationCoords = useMemo(() => {
    const coords = complaint?.location?.coordinates;
    if (coords && coords.length === 2) {
      return {
        longitude: coords[0],
        latitude: coords[1],
      };
    }
    return null;
  }, [complaint]);

  // 2. Start Live GPS Tracking via watchPosition()
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsError('');

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy: posAccuracy, heading: posHeading } = position.coords;
      setWorkerLocation({ latitude, longitude });
      setAccuracy(posAccuracy || 10);
      if (posHeading !== null && !isNaN(posHeading)) {
        setHeading(posHeading);
      }
      setGpsError('');
    };

    const handleError = (err) => {
      console.warn('Live GPS watch error:', err.message);
      const isHttp = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
      if (isHttp) {
        setGpsError('Mobile browser requires HTTPS or localhost for continuous live GPS.');
      } else {
        setGpsError(`GPS tracking signal weak: ${err.message}`);
      }
    };

    // First do a quick getCurrentPosition
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
    });

    // Then start watchPosition
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 3. Compute Real-time Route using OSRM API (with throttled updates)
  useEffect(() => {
    if (!workerLocation || !destinationCoords) return;

    const now = Date.now();
    // Throttle route API calls to at most once every 6 seconds
    if (now - lastRouteFetchTimeRef.current < 6000 && routeCoordinates.length > 0) {
      return;
    }
    lastRouteFetchTimeRef.current = now;

    const fetchRoute = async () => {
      setIsRouting(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${workerLocation.longitude},${workerLocation.latitude};${destinationCoords.longitude},${destinationCoords.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes?.[0]) {
          const route = data.routes[0];
          // Leaflet expects [lat, lng]
          const latLngs = route.geometry.coordinates.map((c) => [c[1], c[0]]);
          setRouteCoordinates(latLngs);
          setRouteDistanceMeters(route.distance);
          setRouteDurationSeconds(route.duration);
          setRoutingFailed(false);
        } else {
          setRoutingFailed(true);
        }
      } catch (err) {
        console.warn('OSRM routing unavailable, using fallback straight-line:', err);
        setRoutingFailed(true);
        // Fallback to straight line
        setRouteCoordinates([
          [workerLocation.latitude, workerLocation.longitude],
          [destinationCoords.latitude, destinationCoords.longitude]
        ]);
        const directDist = calculateHaversine(
          workerLocation.latitude,
          workerLocation.longitude,
          destinationCoords.latitude,
          destinationCoords.longitude
        );
        setRouteDistanceMeters(directDist);
        setRouteDurationSeconds((directDist / 30000) * 3600); // assume ~30 km/h
      } finally {
        setIsRouting(false);
      }
    };

    fetchRoute();
  }, [workerLocation, destinationCoords, routeCoordinates.length]);

  // Visual Direct Distance Fallback
  const currentDistanceMeters = useMemo(() => {
    if (routeDistanceMeters !== null) return routeDistanceMeters;
    if (!workerLocation || !destinationCoords) return null;
    return calculateHaversine(
      workerLocation.latitude,
      workerLocation.longitude,
      destinationCoords.latitude,
      destinationCoords.longitude
    );
  }, [routeDistanceMeters, workerLocation, destinationCoords]);

  const formattedDistance = useMemo(() => {
    if (currentDistanceMeters === null) return 'Locating...';
    if (currentDistanceMeters < 1000) {
      return `${Math.round(currentDistanceMeters)} m`;
    }
    return `${(currentDistanceMeters / 1000).toFixed(1)} km`;
  }, [currentDistanceMeters]);

  const formattedEta = useMemo(() => {
    if (routeDurationSeconds !== null) {
      const mins = Math.max(1, Math.round(routeDurationSeconds / 60));
      return `${mins} min`;
    }
    if (currentDistanceMeters !== null) {
      // Estimate at ~25 km/h urban speed
      const estimatedMins = Math.max(1, Math.round((currentDistanceMeters / 25000) * 60));
      return `${estimatedMins} min`;
    }
    return 'Calculating...';
  }, [routeDurationSeconds, currentDistanceMeters]);

  const isNearby = currentDistanceMeters !== null && currentDistanceMeters <= 100;

  // 4. Handle Authoritative Proximity Verification
  const handleVerifyArrival = async () => {
    if (!workerLocation) {
      toast.warning('Awaiting live GPS coordinates lock.');
      return;
    }

    setVerifyingArrival(true);
    try {
      const res = await workerApi.reach(id, {
        latitude: workerLocation.latitude,
        longitude: workerLocation.longitude,
        address: complaint?.location?.address || 'Incident site check-in'
      });

      if (res.data.success) {
        setHasReached(true);
        toast.success('Arrival check-in verified successfully!');
        setTimeout(() => {
          navigate(`/worker/complaints/${id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Reach verification failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Location verification rejected by server.');
    } finally {
      setVerifyingArrival(false);
    }
  };

  const handleRecenter = () => {
    setRecenterCounter((prev) => prev + 1);
  };

  if (loadingDetails && !complaint) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center bg-slate-900 text-white p-6 space-y-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-outfit font-bold text-sm tracking-wide text-slate-300">Initializing Live Navigation Engine...</p>
      </div>
    );
  }

  const initialCenter = destinationCoords 
    ? [destinationCoords.latitude, destinationCoords.longitude] 
    : [18.5204, 73.8567];

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-slate-900 flex flex-col">
      
      {/* Top Floating Navigation Bar */}
      <div className="absolute top-3 left-3 right-3 z-400 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link
            to={`/worker/complaints/${id}`}
            className="h-10 w-10 bg-white/95 backdrop-blur-md rounded-full shadow-premium flex items-center justify-center text-slate-700 hover:text-primary transition hover:scale-105 active:scale-95"
            aria-label="Back to task"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-premium border border-white/40 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit leading-none">
                Live In-App Navigation
              </p>
              <h2 className="text-xs font-black text-slate-900 font-outfit truncate max-w-[160px] sm:max-w-[240px] mt-0.5">
                {complaint?.title || 'Incident Location'}
              </h2>
            </div>
          </div>
        </div>

        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="pointer-events-auto h-10 px-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-premium border border-white/40 flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-primary transition active:scale-95 cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Recenter</span>
        </button>
      </div>

      {/* GPS Warning Banner if any */}
      {gpsError && (
        <div className="absolute top-16 left-3 right-3 z-400 pointer-events-auto">
          <div className="bg-amber-500/90 backdrop-blur-md text-slate-950 p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate flex-1">{gpsError}</span>
          </div>
        </div>
      )}

      {/* Main Full-Viewport Leaflet Map */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer
          center={initialCenter}
          zoom={16}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            workerPosition={workerLocation}
            destinationPosition={destinationCoords}
            recenterTrigger={recenterCounter}
          />

          {/* Target Complaint Incident Pin */}
          {destinationCoords && (
            <Marker position={[destinationCoords.latitude, destinationCoords.longitude]} icon={incidentIcon}>
              <Popup className="font-outfit">
                <div className="p-1 space-y-1">
                  <p className="font-extrabold text-xs text-danger uppercase tracking-wide">Incident Destination</p>
                  <p className="font-bold text-xs text-slate-900">{complaint?.title}</p>
                  <p className="text-[10px] text-slate-500">{complaint?.location?.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Live Moving Worker Marker */}
          {workerLocation && (
            <>
              <Marker position={[workerLocation.latitude, workerLocation.longitude]} icon={workerIcon}>
                <Popup className="font-outfit">
                  <div className="p-1 space-y-0.5">
                    <p className="font-bold text-xs text-primary">Your Live Location</p>
                    <p className="text-[10px] text-slate-500">Accuracy: &plusmn;{Math.round(accuracy)}m</p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[workerLocation.latitude, workerLocation.longitude]}
                radius={Math.max(15, accuracy)}
                pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1.5 }}
              />
            </>
          )}

          {/* Active Navigation Route Line */}
          {routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: routingFailed ? '#f59e0b' : '#2563eb',
                weight: 5,
                opacity: 0.85,
                dashArray: routingFailed ? '8, 8' : undefined,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Bottom Floating Navigation Console / Information Sheet (Zomato/Rapido Style) */}
      <div className="absolute bottom-0 left-0 right-0 z-400 p-3 sm:p-4 max-w-xl mx-auto w-full">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-2xl p-4 sm:p-5 space-y-4">
          
          {/* Metrics Row: Distance, ETA, Status */}
          <div className="flex items-center justify-between divide-x divide-slate-100">
            
            {/* ETA */}
            <div className="pr-4 min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                Est. Time
              </p>
              <h3 className="font-outfit text-xl sm:text-2xl font-black text-slate-900 mt-0.5 leading-none">
                {formattedEta}
              </h3>
            </div>

            {/* Distance */}
            <div className="px-4 min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit flex items-center gap-1">
                <Navigation className="w-3 h-3 text-primary" />
                Distance
              </p>
              <h3 className="font-outfit text-xl sm:text-2xl font-black text-slate-900 mt-0.5 leading-none">
                {formattedDistance}
              </h3>
            </div>

            {/* Proximity / Status */}
            <div className="pl-4 min-w-0 flex flex-col justify-center">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 font-outfit">
                Proximity Status
              </p>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold mt-0.5 ${
                isNearby ? 'text-emerald-600' : 'text-slate-600'
              }`}>
                {isNearby ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>In Range (&lt;100m)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                    <span>En Route</span>
                  </>
                )}
              </span>
            </div>

          </div>

          {/* Address Information */}
          <div className="flex items-start gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-150 text-xs">
            <MapPin className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-800 text-[11px] truncate">
                {complaint?.location?.landmark || complaint?.location?.address || 'Incident Address'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {complaint?.location?.city ? `${complaint.location.city}, ${complaint.location.state || ''}` : 'Location Coordinates Active'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Verify Arrival / Check In / Start Resolution */}
          <div className="pt-1 space-y-2">
            {hasReached ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black font-outfit uppercase tracking-wide">Arrival Verified at Site</p>
                      <p className="text-[10px] text-emerald-700 font-medium">Site check-in confirmed. You can now execute field operations.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/worker/complaints/${id}/progress`}
                    className="h-11 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-outfit font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
                  >
                    <Camera className="w-4 h-4 text-primary" />
                    <span>Upload Progress</span>
                  </Link>

                  <Link
                    to={`/worker/complaints/${id}/resolve`}
                    className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-outfit font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-98 animate-pulse"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Resolution</span>
                  </Link>
                </div>

                <Link
                  to={`/worker/complaints/${id}`}
                  className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-outfit font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Task Overview</span>
                </Link>
              </div>
            ) : (
              <button
                onClick={handleVerifyArrival}
                disabled={verifyingArrival}
                className={`w-full h-12 rounded-2xl font-outfit font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer disabled:opacity-50 ${
                  isNearby
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 animate-pulse'
                    : 'bg-primary hover:bg-primary-hover text-white shadow-primary/30'
                }`}
              >
                {verifyingArrival ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Site Location...</span>
                  </>
                ) : isNearby ? (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Arrived at Site — Confirm Check-in</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Arrival Check-In</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
