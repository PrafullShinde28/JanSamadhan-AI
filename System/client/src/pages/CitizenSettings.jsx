import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { 
  Camera, 
  MapPin, 
  Trash2, 
  Info, 
  ChevronRight, 
  ShieldCheck, 
  HelpCircle,
  RefreshCw,
  LogOut,
  Navigation,
  CheckCircle2,
  Search,
  Loader2,
  Building,
  Save,
  Crosshair,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function CitizenSettings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { dbUser } = useApp();

  const [geoStatus, setGeoStatus] = useState('Checking...');
  const [cameraStatus, setCameraStatus] = useState('Checking...');
  const [notifStatus, setNotifStatus] = useState('Checking...');
  const [refreshing, setRefreshing] = useState(false);

  // Live Location Calibration State
  const [calibratedLocation, setCalibratedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('citizen_live_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      latitude: 16.6818,
      longitude: 74.4688,
      city: 'Ichalkaranji',
      address: 'Kagwade Mala, Ichalkaranji, Kolhapur, Maharashtra',
      accuracy: 'Calibrated'
    };
  });

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualLat, setManualLat] = useState(calibratedLocation.latitude);
  const [manualLng, setManualLng] = useState(calibratedLocation.longitude);
  const [manualCity, setManualCity] = useState(calibratedLocation.city);
  const [manualAddress, setManualAddress] = useState(calibratedLocation.address);
  const searchTimeoutRef = useRef(null);

  // Modal dialog states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null }); // type: 'cache' | 'logout'
  const [isModalLoading, setIsModalLoading] = useState(false);

  const runDiagnostics = async () => {
    setRefreshing(true);
    // Geolocation
    if (!navigator.geolocation) {
      setGeoStatus('Unsupported');
    } else {
      navigator.permissions?.query({ name: 'geolocation' })
        .then((res) => setGeoStatus(res.state === 'granted' ? 'Allowed' : res.state === 'prompt' ? 'Pending Prompt' : 'Blocked'))
        .catch(() => setGeoStatus('Active'));
    }

    // Camera
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('Unsupported');
    } else {
      navigator.permissions?.query({ name: 'camera' })
        .then((res) => setCameraStatus(res.state === 'granted' ? 'Allowed' : res.state === 'prompt' ? 'Pending Prompt' : 'Blocked'))
        .catch(() => setCameraStatus('Available'));
    }

    // Notifications
    if (!('Notification' in window)) {
      setNotifStatus('Unsupported');
    } else {
      setNotifStatus(Notification.permission === 'granted' ? 'Enabled' : Notification.permission === 'denied' ? 'Blocked' : 'Default');
    }

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  // Reverse geocode lat/lng to street address and city
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || 'Local Area';
        const address = data.display_name;
        return { city, address };
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
    return { city: 'Local Area', address: `Coordinates: ${lat}, ${lon}` };
  };

  // Auto-Detect Live GPS Coordinates
  const handleDetectLiveGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const { city, address } = await reverseGeocode(lat, lng);

        const newLocation = {
          latitude: lat,
          longitude: lng,
          city,
          address,
          accuracy: 'Hardware GPS Verified'
        };

        setCalibratedLocation(newLocation);
        setManualLat(lat);
        setManualLng(lng);
        setManualCity(city);
        setManualAddress(address);
        localStorage.setItem('citizen_live_location', JSON.stringify(newLocation));
        setIsDetectingGps(false);
        toast.success(`Live GPS detected: ${city} (${lat}, ${lng})`);
      },
      (err) => {
        console.warn('High accuracy failed, trying standard accuracy:', err);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            const { city, address } = await reverseGeocode(lat, lng);

            const newLocation = {
              latitude: lat,
              longitude: lng,
              city,
              address,
              accuracy: 'Network Location'
            };

            setCalibratedLocation(newLocation);
            setManualLat(lat);
            setManualLng(lng);
            setManualCity(city);
            setManualAddress(address);
            localStorage.setItem('citizen_live_location', JSON.stringify(newLocation));
            setIsDetectingGps(false);
            toast.success(`Live Location calibrated: ${city}`);
          },
          (err2) => {
            setIsDetectingGps(false);
            toast.error('Could not get GPS. Please use the search bar or enter your city manually.');
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search Address / City with Nominatim
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSearchResults(data || []);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectSearchResult = (item) => {
    const lat = Number(parseFloat(item.lat).toFixed(6));
    const lng = Number(parseFloat(item.lon).toFixed(6));
    const city = item.address?.city || item.address?.town || item.address?.village || item.address?.suburb || item.address?.county || item.name;
    const address = item.display_name;

    const newLocation = {
      latitude: lat,
      longitude: lng,
      city,
      address,
      accuracy: 'Search Calibrated'
    };

    setCalibratedLocation(newLocation);
    setManualLat(lat);
    setManualLng(lng);
    setManualCity(city);
    setManualAddress(address);
    setSearchQuery('');
    setSearchResults([]);
    localStorage.setItem('citizen_live_location', JSON.stringify(newLocation));
    toast.success(`Calibrated location set to ${city}`);
  };

  // Save manual calibration
  const handleSaveLocation = () => {
    const lat = Number(parseFloat(manualLat).toFixed(6));
    const lng = Number(parseFloat(manualLng).toFixed(6));
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Please enter valid latitude and longitude coordinates.');
      return;
    }

    const newLocation = {
      latitude: lat,
      longitude: lng,
      city: manualCity.trim() || 'Calibrated Ward',
      address: manualAddress.trim() || `${manualCity}, Lat: ${lat}, Lng: ${lng}`,
      accuracy: 'Manual Calibrated'
    };

    setCalibratedLocation(newLocation);
    localStorage.setItem('citizen_live_location', JSON.stringify(newLocation));
    toast.success(`Location preference updated to ${newLocation.city}. All future reports will use this calibration.`);
  };

  // Quick Region Presets
  const applyPreset = (presetName, lat, lng, city, address) => {
    const newLocation = {
      latitude: lat,
      longitude: lng,
      city,
      address,
      accuracy: 'Preset Calibrated'
    };
    setCalibratedLocation(newLocation);
    setManualLat(lat);
    setManualLng(lng);
    setManualCity(city);
    setManualAddress(address);
    localStorage.setItem('citizen_live_location', JSON.stringify(newLocation));
    toast.info(`Location preset applied: ${presetName}`);
  };

  const handleClearCache = () => {
    setConfirmModal({ isOpen: true, type: 'cache' });
  };

  const handleLogout = () => {
    setConfirmModal({ isOpen: true, type: 'logout' });
  };

  const handleModalConfirm = async () => {
    setIsModalLoading(true);
    try {
      if (confirmModal.type === 'cache') {
        const authKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('clerk')) {
            authKeys.push({ key, value: localStorage.getItem(key) });
          }
        }
        localStorage.clear();
        authKeys.forEach(({ key, value }) => localStorage.setItem(key, value));
        toast.success('App cache cleared successfully.');
        setConfirmModal({ isOpen: false, type: null });
      } else if (confirmModal.type === 'logout') {
        await signOut();
        setConfirmModal({ isOpen: false, type: null });
        navigate('/');
      }
    } catch (err) {
      toast.error('Action could not be completed.');
    } finally {
      setIsModalLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-2xl mx-auto overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Settings Title Header */}
      <header className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
        <p className="text-[10px] font-bold text-primary font-outfit uppercase tracking-wider">Citizen Preferences</p>
        <h1 className="mt-1 font-outfit text-sm sm:text-base md:text-lg font-extrabold text-slate-805 leading-snug">System & Location Settings</h1>
        <p className="text-[10px] text-slate-450 mt-1">Calibrate your live location coordinates, verify sensor permissions, and manage application data.</p>
      </header>

      {/* Live Location Calibration Module */}
      <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0 space-y-4">
        <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-outfit text-xs font-bold text-slate-800 uppercase tracking-wide">
              Live Location Calibration
            </h3>
          </div>
          <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 uppercase">
            Active
          </span>
        </div>

        {/* Current Active Location Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Calibrated Location</p>
              <p className="font-extrabold text-slate-800 text-sm mt-0.5 truncate">{calibratedLocation.city}</p>
              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{calibratedLocation.address}</p>
            </div>
            <div className="text-right shrink-0 font-mono text-[10px] text-primary font-bold bg-white px-2 py-1 rounded border border-slate-200">
              {calibratedLocation.latitude}, {calibratedLocation.longitude}
            </div>
          </div>
        </div>

        {/* Quick GPS Auto-Detect Button */}
        <button
          type="button"
          onClick={handleDetectLiveGps}
          disabled={isDetectingGps}
          className="w-full min-h-[46px] bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-extrabold shadow-sm transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isDetectingGps ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Detecting Exact Live GPS Coordinates...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-4 h-4" />
              <span>Auto-Detect Live GPS Location</span>
            </>
          )}
        </button>

        {/* Search Bar for City / Ward */}
        <div className="space-y-1.5 relative">
          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Search & Pin City or Locality
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g. Ichalkaranji, Kolhapur, Pune..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full min-h-[42px] bg-white border border-slate-200 rounded-xl pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-primary animate-spin absolute right-3 top-3" />
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left p-2.5 hover:bg-slate-50 text-xs transition flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="line-clamp-2 text-slate-700 font-medium text-[11px]">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Region Presets */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Quick Region Presets
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('Ichalkaranji', 16.6818, 74.4688, 'Ichalkaranji', 'Kagwade Mala, Ichalkaranji, Kolhapur, Maharashtra')}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition active:scale-95 text-center"
            >
              📍 Ichalkaranji
            </button>
            <button
              type="button"
              onClick={() => applyPreset('Pune City', 18.5204, 73.8567, 'Pune', 'Shivaji Road, Kasba Peth, Pune, Maharashtra')}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition active:scale-95 text-center"
            >
              📍 Pune
            </button>
            <button
              type="button"
              onClick={() => applyPreset('Kolhapur', 16.7050, 74.2433, 'Kolhapur', 'Mahadwar Road, Kolhapur, Maharashtra')}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition active:scale-95 text-center"
            >
              📍 Kolhapur
            </button>
            <button
              type="button"
              onClick={() => applyPreset('Mumbai', 19.0760, 72.8777, 'Mumbai', 'Fort, Mumbai, Maharashtra')}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition active:scale-95 text-center"
            >
              📍 Mumbai
            </button>
          </div>
        </div>

        {/* Manual Coordinates Input & Save */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase">Latitude</label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase">Longitude</label>
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase">City / Municipality</label>
              <input
                type="text"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase">Locality / Address</label>
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="w-full h-9 bg-white border border-slate-200 rounded-lg px-2.5 text-xs font-semibold truncate"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveLocation}
            className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Location Preference</span>
          </button>
        </div>

      </section>

      {/* Sensor Diagnostics */}
      <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0 space-y-3.5">
        <div className="flex justify-between items-center border-b pb-2 border-slate-50 gap-2">
          <h3 className="font-outfit text-xs font-bold text-slate-805 uppercase tracking-wide">
            PWA Sensor Diagnostics
          </h3>
          <button 
            onClick={runDiagnostics} 
            disabled={refreshing}
            className="text-primary p-1 hover:bg-slate-50 rounded-full transition select-none cursor-pointer"
            title="Reload diagnostics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-3.5 min-w-0">
          <DiagnosticRow 
            icon={Camera} 
            label="Camera Access" 
            desc="Required to capture live civic issue photos." 
            status={cameraStatus} 
            isOk={cameraStatus === 'Allowed' || cameraStatus === 'Available'} 
          />
          <DiagnosticRow 
            icon={MapPin} 
            label="Location GPS" 
            desc="Required to track coordinates of the reported incident." 
            status={geoStatus} 
            isOk={geoStatus === 'Allowed' || geoStatus === 'Active'} 
          />
        </div>
      </section>

      {/* Storage Management */}
      <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0 space-y-3.5">
        <h3 className="font-outfit text-xs font-bold text-slate-805 border-b pb-2 border-slate-50 uppercase tracking-wide">
          Cache Management
        </h3>
        
        <div className="flex items-center justify-between gap-4 py-1.5 select-none">
          <div className="min-w-0 flex-grow">
            <h4 className="text-xs font-bold text-slate-705">Clear Application Cache</h4>
            <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Purge map tile data and connection cache files to clean storage.</p>
          </div>
          <button 
            onClick={handleClearCache}
            className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-danger border border-red-100 h-9 px-3 rounded-button text-xs font-bold transition select-none cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Reset Cache</span>
          </button>
        </div>
      </section>

      {/* Software Info */}
      <section className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0 space-y-3">
        <h3 className="font-outfit text-xs font-bold text-slate-805 border-b pb-2 border-slate-50 uppercase tracking-wide flex items-center gap-1 shrink-0">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          About JanSamadhan AI
        </h3>
        
        <div className="space-y-2.5 text-[11px] text-slate-600 font-semibold leading-relaxed">
          <div className="flex justify-between border-b border-slate-50 pb-1.5">
            <span className="text-slate-400">Software Build</span>
            <span className="font-bold text-slate-700">v1.3.0-Citizen-PWA</span>
          </div>
          <div className="flex justify-between border-b border-slate-50 pb-1.5">
            <span className="text-slate-400">Target Framework</span>
            <span className="font-bold text-slate-700">React + Vite + Workbox</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Backend Server</span>
            <span className="font-bold text-slate-700">Express + Mongoose + YOLO</span>
          </div>
        </div>
      </section>

      {/* Logout button */}
      <button 
        type="button" 
        onClick={handleLogout}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-button bg-red-50 hover:bg-red-100/50 border border-red-100 text-danger font-bold text-xs select-none transition cursor-pointer"
      >
        <LogOut className="w-4.5 h-4.5 shrink-0" />
        <span>Sign Out Account</span>
      </button>

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'cache' ? 'Clear Local App Cache' : 'Sign Out Account'}
        message={
          confirmModal.type === 'cache'
            ? 'Are you sure you want to clear local application cache? This resets map offline caching but preserves your account data.'
            : 'Are you sure you want to sign out of your citizen account?'
        }
        confirmText={confirmModal.type === 'cache' ? 'Clear Cache' : 'Sign Out'}
        confirmVariant="danger"
        iconType="danger"
        isLoading={isModalLoading}
        onConfirm={handleModalConfirm}
        onCancel={() => {
          if (!isModalLoading) {
            setConfirmModal({ isOpen: false, type: null });
          }
        }}
      />

    </div>
  );
}

function DiagnosticRow({ icon: Icon, label, desc, status, isOk }) {
  return (
    <div className="flex items-start justify-between gap-4 min-w-0 w-full">
      <div className="flex gap-2.5 min-w-0 flex-grow">
        <div className="h-9 w-9 rounded-lg bg-slate-50 border flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5 text-primary shrink-0" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-750">{label}</h4>
          <p className="text-[10px] text-slate-450 mt-0.5 leading-tight">{desc}</p>
        </div>
      </div>
      
      <span className={`h-7 px-2.5 rounded-full text-[10px] font-bold inline-flex items-center justify-center shrink-0 border select-none font-outfit uppercase ${
        isOk 
          ? 'bg-emerald-50 text-success border-emerald-200' 
          : 'bg-amber-50 text-amber-600 border-amber-200'
      }`}>
        {status}
      </span>
    </div>
  );
}
