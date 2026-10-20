import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Navigation, Loader2, Check, X, Compass } from 'lucide-react';

// Fix for default Leaflet icon assets in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// A component to smoothly fly/pan the map to a target coordinate
function MapViewUpdater({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Draggable and clickable map marker handler
function InteractiveMarker({ position, setPosition, onDragEnd }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onDragEnd) onDragEnd(newPos);
    },
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const latlng = marker.getLatLng();
        const newPos = [latlng.lat, latlng.lng];
        setPosition(newPos);
        if (onDragEnd) onDragEnd(newPos);
      }
    },
  };

  if (!position) return null;

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

export default function MapSelector({ value, onChange }) {
  // Default coordinates (Pune/Maharashtra region center)
  const [position, setPosition] = useState(
    value?.latitude && value?.longitude 
      ? [value.latitude, value.longitude] 
      : [18.5204, 73.8567]
  );
  const [accuracyRadius, setAccuracyRadius] = useState(null);
  const [address, setAddress] = useState(value?.address || '');
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState(''); // 'gps' | 'search' | 'manual' | 'error'
  const [statusMessage, setStatusMessage] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Reverse geocode coordinate to human-readable street address
  const fetchAddress = useCallback(async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(', ');
        const shortAddr = parts.slice(0, 3).join(', ');
        setAddress(shortAddr || data.display_name);
        return shortAddr || data.display_name;
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    }
    return '';
  }, []);

  // Update parent form whenever position or address changes
  useEffect(() => {
    if (position && Array.isArray(position)) {
      onChange({
        latitude: position[0],
        longitude: position[1],
        address: address || 'Pinned Incident Location'
      });
    }
  }, [position, address]);

  // Initial load
  useEffect(() => {
    if (value && value.latitude && value.longitude) {
      setPosition([value.latitude, value.longitude]);
      if (!value.address) fetchAddress(value.latitude, value.longitude);
    } else {
      const saved = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('citizen_live_location') || 'null') : null;
      if (saved && saved.latitude && saved.longitude) {
        setPosition([saved.latitude, saved.longitude]);
        setAddress(saved.address || '');
        setGeoStatus('gps');
        setStatusMessage(`Calibrated location active: ${saved.city || saved.address || 'Saved Region'}`);
      } else {
        detectGpsLocation();
      }
    }
  }, []);

  // Hardware GPS detection
  const detectGpsLocation = () => {
    setIsLocating(true);
    setStatusMessage('');

    if (!navigator.geolocation) {
      setGeoStatus('error');
      setStatusMessage('Device does not support GPS. Search your area or tap on the map.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        setAccuracyRadius(pos.coords.accuracy || 15);
        setGeoStatus('gps');
        setStatusMessage(`Exact GPS locked (Accuracy: ±${Math.round(pos.coords.accuracy || 10)}m).`);
        setIsLocating(false);
        const resolvedAddr = await fetchAddress(newPos[0], newPos[1]);
        if (resolvedAddr) setSearchQuery(resolvedAddr);
      },
      (err) => {
        console.warn('High accuracy GPS error, trying standard resolution:', err.message);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const newPos = [pos.coords.latitude, pos.coords.longitude];
            setPosition(newPos);
            setAccuracyRadius(pos.coords.accuracy || 30);
            setGeoStatus('gps');
            setStatusMessage(`Location locked via device telemetry (Accuracy: ±${Math.round(pos.coords.accuracy || 25)}m).`);
            setIsLocating(false);
            const resolvedAddr = await fetchAddress(newPos[0], newPos[1]);
            if (resolvedAddr) setSearchQuery(resolvedAddr);
          },
          (err2) => {
            console.warn('Standard GPS failed:', err2.message);
            setGeoStatus('error');
            const isHttp = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
            if (isHttp) {
              setStatusMessage('Browser requires HTTPS for automatic GPS on phone. Use the search bar below or tap the map to pin your location.');
            } else {
              setStatusMessage('Location permission denied. Search your locality or tap on the map.');
            }
            setIsLocating(false);
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search area / address using OpenStreetMap Nominatim
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSearchResults(data || []);
        setShowSearchResults(true);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const newPos = [lat, lon];
    setPosition(newPos);
    setAccuracyRadius(null);
    setSearchQuery(result.display_name);
    setAddress(result.display_name.split(', ').slice(0, 3).join(', '));
    setShowSearchResults(false);
    setGeoStatus('search');
    setStatusMessage(`Location set to: ${result.display_name.split(', ')[0]}`);
  };

  return (
    <div className="space-y-3 w-full min-w-0">
      
      {/* Search & GPS Action Bar */}
      <div className="space-y-2 relative">
        <div className="flex gap-2 items-center">
          {/* Search Box */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Search className="w-4 h-4" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true); }}
              placeholder="Search area, street, colony, or city..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* GPS Detect Button */}
          <button
            type="button"
            onClick={detectGpsLocation}
            disabled={isLocating}
            className="shrink-0 bg-primary hover:bg-primary-dark text-white px-3.5 py-2.5 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
            title="Auto-detect my GPS location"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Detect GPS</span>
          </button>
        </div>

        {/* Autocomplete Search Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/80 border-b border-slate-100 last:border-0 transition flex items-start gap-2 text-xs text-slate-700"
              >
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-snug">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Geolocation Status Message Banner */}
      {statusMessage && (
        <div className={`p-2.5 rounded-lg text-[11px] font-semibold flex items-start gap-2 ${
          geoStatus === 'gps' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
          geoStatus === 'search' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
          geoStatus === 'manual' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
          'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          <span className="text-sm shrink-0">{geoStatus === 'gps' ? '🎯' : geoStatus === 'search' ? '📍' : '💡'}</span>
          <span className="leading-tight mt-0.5">{statusMessage}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="h-64 sm:h-72 w-full border border-slate-200 rounded-card overflow-hidden shadow-soft relative z-10">
        <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewUpdater center={position} />
          
          {/* Accuracy circle when locked via GPS */}
          {accuracyRadius && (
            <Circle
              center={position}
              radius={accuracyRadius}
              pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.15 }}
            />
          )}

          {/* Interactive Marker that can be dragged or placed by clicking */}
          <InteractiveMarker
            position={position}
            setPosition={setPosition}
            onDragEnd={async (newPos) => {
              setAccuracyRadius(null);
              setGeoStatus('manual');
              setStatusMessage('Pin adjusted. Reverse geocoding address...');
              const addr = await fetchAddress(newPos[0], newPos[1]);
              setStatusMessage(addr ? `Pinned at: ${addr}` : 'Custom pin location locked.');
            }}
          />
        </MapContainer>

        {/* Floating instruction pill */}
        <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none flex justify-center">
          <div className="bg-slate-900/80 text-white text-[10px] font-medium px-3 py-1.5 rounded-full backdrop-blur shadow-md flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-primary-light animate-spin" />
            <span>Tap map or drag pin to position exactly on incident</span>
          </div>
        </div>
      </div>

      {/* Coordinates & Selected Address Summary */}
      <div className="bg-slate-50 border border-slate-150 rounded-lg p-2.5 space-y-1 text-xs">
        <div className="flex justify-between items-center text-[10.5px]">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Coordinates</span>
          <span className="font-mono font-semibold text-slate-700">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </span>
        </div>
        {address && (
          <div className="flex items-start gap-1.5 text-slate-600 text-[11px] font-medium pt-1 border-t border-slate-200/60">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-tight">{address}</span>
          </div>
        )}
      </div>

    </div>
  );
}
