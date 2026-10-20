import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { workerApi } from '../api/worker.api';
import { 
  ArrowLeft, 
  Upload, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Wrench,
  Camera,
  X,
  VideoOff
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function WorkerProgressForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [coords, setCoords] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Camera Live-stream references
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Fetch complaint details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await workerApi.details(id);
        if (res.data.success) {
          setComplaint(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching complaint details:', err);
      }
    };
    fetchDetails();
  }, [id]);

  // Fetch GPS on mount with progressive fallback
  const fetchGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (error) => {
        console.warn('High accuracy GPS failed, trying standard accuracy:', error.message);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
            setGpsLoading(false);
          },
          (err2) => {
            console.error('Standard GPS failed:', err2.message);
            const isHttp = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
            if (isHttp) {
              setGpsError('Mobile browser restricts GPS auto-detect on plain HTTP LAN.');
            } else {
              setGpsError('Unable to lock coordinates. Ensure Location access is enabled.');
            }
            setGpsLoading(false);
          },
          { enableHighAccuracy: false, timeout: 8000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchGpsLocation();
  }, []);

  // Handle native camera capture fallback
  const handleNativeCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setLoadingCamera(true);
    setCameraError('');
    setCameraPermission('prompt');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported or context is insecure HTTP LAN. Using native camera capture.');
      setCameraPermission('fallback');
      setCameraError('In-browser stream requires HTTPS on LAN. Please use the device camera button below.');
      setLoadingCamera(false);
      return;
    }

    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('getUserMedia camera access rejected:', err);
      setCameraPermission('denied');
      
      const isHttp = typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied in browser. Please use the Live Camera capture button below.');
      } else if (isHttp) {
        setCameraError('In-browser streaming is restricted on plain HTTP LAN. Use the Live Camera capture button below.');
      } else {
        setCameraError('Camera stream could not be started. Tap below to capture directly with your device camera.');
      }
    } finally {
      setLoadingCamera(false);
    }
  };

  // Capture frame to canvas
  const capturePhoto = () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `progress-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImageFile(file);
          setImagePreview(URL.createObjectURL(blob));
          
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      },
      'image/jpeg',
      0.85
    );
  };

  const handleRetake = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Launch camera when mounting or clearing image
  useEffect(() => {
    if (!imagePreview) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };
  }, [imagePreview]);

  // General clean up
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.warning('A progress report image is required.');
      return;
    }

    if (!coords) {
      toast.error('Cannot submit without GPS coordinates. Please enable location.');
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('remarks', remarks);
      formData.append('latitude', coords.latitude);
      formData.append('longitude', coords.longitude);
      formData.append('address', 'Site progress report coordinate');

      const res = await workerApi.progress(id, formData);

      if (res.data.success) {
        toast.success('Complaint progress updated successfully.');
        setTimeout(() => {
          navigate(`/worker/complaints/${id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Progress update submission failed:', err);
      const serverMessage = err.response?.data?.message || err.message || 'Server rejected progress update.';
      setSubmitError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Back Link */}
      <Link to={`/worker/complaints/${id}`} className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
        <ArrowLeft className="h-3 w-3" />
        Cancel and Return
      </Link>

      {/* Form Header */}
      <header className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
        <p className="text-[9px] font-bold tracking-wide text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block font-outfit uppercase">
          Work Report
        </p>
        <h1 className="mt-2 font-outfit text-sm sm:text-base md:text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary shrink-0" />
          Upload Progress Evidence
        </h1>
        <p className="text-[10px] text-slate-450 mt-1 leading-normal">municipal guidelines require live camera capture on-site to verify progress reports.</p>
      </header>

      {/* Main form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-card p-4 shadow-soft space-y-4 w-full min-w-0">
        {gpsLoading ? (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-2 text-xs text-slate-500 font-semibold w-full min-w-0">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <span>Locking secure GPS coordinates...</span>
          </div>
        ) : gpsError ? (
          <div className="bg-red-50 text-danger p-3 rounded-lg border border-red-100 space-y-2 text-xs font-semibold w-full min-w-0">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={fetchGpsLocation}
                className="px-3 py-1.5 rounded-button bg-white text-slate-700 border border-slate-200 text-[10.5px] font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Retry GPS Lock
              </button>
              {complaint?.location?.coordinates?.length === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setCoords({
                      latitude: complaint.location.coordinates[1],
                      longitude: complaint.location.coordinates[0]
                    });
                    setGpsError('');
                    toast.info('Synchronized with complaint target site coordinates.');
                  }}
                  className="px-3 py-1.5 rounded-button bg-amber-100 text-amber-900 border border-amber-300 text-[10.5px] font-bold hover:bg-amber-200 transition cursor-pointer"
                >
                  📍 Use Site Coordinates (Dev Mode)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 text-success p-3 rounded-lg border border-emerald-100 flex items-center gap-1.5 text-xs font-semibold w-full min-w-0">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">GPS Location Locked: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</span>
          </div>
        )}

        {/* Hidden canvas used for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden native camera capture input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleNativeCapture}
        />

        {/* Image Uploader Camera constraint */}
        <div className="space-y-2 w-full min-w-0">
          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Progress Image (Required)</label>
          
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-150 bg-slate-900 w-full aspect-[4/3] flex items-center justify-center">
              <img src={imagePreview} alt="Selected preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={handleRetake}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur shadow-md hover:bg-black/75 transition select-none cursor-pointer"
                title="Retake photo"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-slate-150 bg-slate-900 w-full aspect-[4/3] flex flex-col items-center justify-center">
              {cameraPermission === 'granted' && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover z-10"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="h-12 w-12 rounded-full bg-white border-4 border-slate-350 shadow-lg flex items-center justify-center cursor-pointer select-none active:scale-95 transition"
                      aria-label="Capture photo"
                    >
                      <span className="h-7 w-7 rounded-full bg-primary" />
                    </button>
                  </div>
                </>
              )}

              {loadingCamera && (
                <div className="text-center text-white space-y-2 z-10">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-[10px] font-bold tracking-wide uppercase text-slate-300">Activating camera feed...</p>
                </div>
              )}

              {(cameraPermission === 'denied' || cameraPermission === 'fallback') && (
                <div className="text-center text-slate-405 p-5 space-y-3 z-10 max-w-sm mx-auto">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-primary">
                    <Camera className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Live Camera Capture</p>
                    <p className="text-[9px] mt-1 text-slate-400 leading-normal">{cameraError}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2.5 rounded-button text-xs uppercase tracking-wider transition cursor-pointer shadow-premium flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      Take Live Photo
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-button text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry Stream
                    </button>
                  </div>
                </div>
              )}

              {cameraError && cameraPermission !== 'denied' && cameraPermission !== 'fallback' && (
                <div className="text-center text-slate-405 p-5 space-y-3 z-10 max-w-sm mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="text-[9px] text-slate-400 leading-normal">{cameraError}</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-button text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-button text-[10px] uppercase tracking-wider transition cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remarks */}
        <div className="space-y-1 w-full min-w-0">
          <label htmlFor="remarks" className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Progress Remarks (Required)</label>
          <textarea
            id="remarks"
            rows="3"
            placeholder="Provide a short description of repair tasks performed..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full bg-slate-55 bg-slate-50 border border-slate-200 rounded-button p-3 text-xs focus:ring-2 focus:ring-primary focus:bg-white transition text-slate-700 font-semibold"
            required
          />
        </div>

        {submitError && (
          <div className="bg-red-50 text-danger p-3 rounded-lg border border-red-100 flex items-start gap-1.5 text-xs font-semibold w-full min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-1 flex gap-3 w-full min-w-0">
          <Link
            to={`/worker/complaints/${id}`}
            className="flex-1 inline-flex items-center justify-center rounded-button border border-slate-205 bg-white text-xs font-bold text-slate-705 hover:bg-slate-50 transition h-12 select-none"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || gpsLoading || !imageFile || !remarks.trim()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-button bg-primary text-white shadow hover:bg-primary-dark transition h-12 text-xs font-bold disabled:opacity-50 select-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Progress
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
}
