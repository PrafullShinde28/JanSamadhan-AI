import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Camera, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  MapPin, 
  ShieldCheck, 
  X, 
  RefreshCw, 
  HelpCircle,
  VideoOff
} from 'lucide-react';
import MapSelector from '../components/MapSelector';
import { complaintApi } from '../api/complaint.api';

const steps = ['Evidence Capture', 'Confirm Location', 'Review Report'];

export default function SubmitComplaint() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(0);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Camera Live-stream states
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'fallback'
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Security Capture Session
  const [captureSessionId, setCaptureSessionId] = useState('');

  // Handle native camera capture fallback (works across all browsers and HTTP LAN)
  const handleNativeCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      const sessionRes = await complaintApi.startCaptureSession();
      if (sessionRes.data?.success) {
        setCaptureSessionId(sessionRes.data.data.captureSessionId);
      }
    } catch (err) {
      console.error('Failed to obtain capture token for native photo:', err);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setLoadingCamera(true);
    setCameraError('');
    setCameraPermission('prompt');

    // 1. Initialize Capture Session on Backend
    try {
      const sessionRes = await complaintApi.startCaptureSession();
      if (sessionRes.data?.success) {
        setCaptureSessionId(sessionRes.data.data.captureSessionId);
      }
    } catch (err) {
      console.error('Failed to establish capture session:', err);
      setCameraError('Failed to establish secure capture token. Please reload.');
      setLoadingCamera(false);
      return;
    }

    // 2. Check if browser supports WebRTC getUserMedia in current context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not supported or context is insecure HTTP LAN. Using native camera capture.');
      setCameraPermission('fallback');
      setCameraError('In-browser stream requires HTTPS on LAN. Please use the device camera button below.');
      setLoadingCamera(false);
      return;
    }

    // 3. Fetch Browser User Media constraints (ideal rear environment camera)
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    try {
      // Release any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraPermission('granted');
      
      // Bind to video element
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

  // Capture current frame from live stream to canvas
  const capturePhoto = () => {
    if (!videoRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video stream dimensions
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    // Convert Canvas snapshot to Blob File (0.85 jpeg quality balances YOLO clarity and speed)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `complaint-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImage(file);
          setPreview(URL.createObjectURL(blob));
          
          // Stop camera stream tracks to conserve device battery
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      },
      'image/jpeg',
      0.85
    );
  };

  // Retake photo - restart video stream
  const handleRetake = () => {
    setImage(null);
    setPreview('');
    setCaptureSessionId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Launch camera when entering step 0
  useEffect(() => {
    if (step === 0 && !preview) {
      startCamera();
    }
    // Stop camera if moving away from step 0
    return () => {
      if (step !== 0 && stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    };
  }, [step, preview]);

  // General clean up on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const next = () => {
    if (step === 0 && !image) {
      toast.info('Evidence image is required. Please capture a live photo.');
      return;
    }
    if (step === 1 && !location) {
      toast.info('GPS Location confirmation is required to route this report.');
      return;
    }
    setStep((curr) => Math.min(curr + 1, 2));
  };

  const submit = async () => {
    if (!image || !location || !captureSessionId) {
      toast.warning('Validation failed. Ensure coordinates and photo are secured.');
      return;
    }

    const formData = new FormData();
    formData.append('image', image);
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
    formData.append('captureSessionId', captureSessionId);

    try {
      setSubmitting(true);
      const response = await complaintApi.create(formData, (event) => {
        if (event.total) {
          setUploadProgress(Math.round((event.loaded * 100) / event.total));
        }
      });
      
      toast.success('Civic report submitted! AI vision classification has initialized.');
      // Direct redirect to complaint details
      navigate(`/citizen/complaints/${response.data.data._id}`);
    } catch (error) {
      console.error('Complaint create error:', error);
      toast.error(error.response?.data?.message || error.message || 'Submission failed.');
      // Auto-refresh capture session token so user can retry immediately without session conflict
      complaintApi.startCaptureSession().then((res) => {
        if (res.data?.success) {
          setCaptureSessionId(res.data.data.captureSessionId);
        }
      }).catch((e) => console.warn('Could not auto-refresh session:', e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Navigation Title banner */}
      <header className="rounded-card border border-slate-100 bg-white p-4 shadow-soft w-full min-w-0">
        <p className="text-[9px] font-bold tracking-wide text-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block font-outfit uppercase">
          Street Dispatch
        </p>
        <h1 className="mt-2 font-outfit text-sm sm:text-base md:text-lg font-extrabold text-slate-805 leading-snug">Report a Civic Issue</h1>
        <p className="text-[10px] text-slate-450 mt-1 leading-normal">File evidence and coordinates. JanSamadhan's AI categorizes and dispatches repairs.</p>
      </header>

      {/* Progress Step Indicators */}
      <ol className="grid grid-cols-3 gap-2 w-full select-none" aria-label="Reporting progress steps">
        {steps.map((label, idx) => (
          <li key={label} className="flex items-center gap-1.5 min-w-0">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${
              idx <= step ? 'bg-primary text-white' : 'bg-slate-205 text-slate-450 border border-slate-300'
            }`}>
              {idx + 1}
            </span>
            <span className={`text-[9.5px] font-bold truncate ${
              idx <= step ? 'text-slate-800' : 'text-slate-400'
            }`}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Structured Step Container */}
      <section className="bg-white border border-slate-100 rounded-card p-4 shadow-soft w-full min-w-0 flex flex-col justify-between">
        
        {/* Step 0: Evidence Camera Feed */}
        {step === 0 && (
          <div className="space-y-4 w-full min-w-0">
            <div className="border-b pb-2 border-slate-50 min-w-0">
              <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1">
                <Camera className="w-4 h-4 text-primary shrink-0" />
                Capture Live Photo Evidence
              </h2>
              <p className="text-[10px] text-slate-450 mt-0.5">Municipal guidelines require live camera capture on-site to verify reports.</p>
            </div>

            {/* Hidden canvas used for capture compilation */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden native camera capture input (guaranteed on all mobile devices over HTTP LAN) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleNativeCapture}
            />

            {/* Video preview / Photo preview stack */}
            {preview ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-150 bg-slate-900 w-full aspect-[4/3] flex items-center justify-center">
                <img src={preview} alt="Captured evidence" className="h-full w-full object-cover" />
                
                {/* Close/Retake floating tag */}
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
                    
                    {/* Capture button overlay */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="h-14 w-14 rounded-full bg-white border-4 border-slate-300 shadow-lg flex items-center justify-center cursor-pointer select-none active:scale-95 transition"
                        aria-label="Capture photo"
                      >
                        <span className="h-9 w-9 rounded-full bg-primary" />
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
                  <div className="text-center text-slate-400 p-5 space-y-3 z-10 max-w-sm mx-auto">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-primary">
                      <Camera className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Live Camera Capture</p>
                      <p className="text-[9.5px] mt-1 text-slate-400 leading-normal">{cameraError}</p>
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
                  <div className="text-center text-slate-400 p-5 space-y-3 z-10 max-w-sm mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto animate-pulse" />
                    <p className="text-[9.5px] text-slate-400 leading-normal">{cameraError}</p>
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
        )}

        {/* Step 1: Geolocation Coordinates Map Selection */}
        {step === 1 && (
          <div className="space-y-4 w-full min-w-0">
            <div className="border-b pb-2 border-slate-50 min-w-0 flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
                <MapPin className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-grow">
                <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-805">Confirm Issue Location</h2>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">Automatic GPS geocoding pins your exact repair coordinates.</p>
              </div>
            </div>
            
            <div className="w-full relative rounded-xl overflow-hidden border border-slate-205 z-10">
              <MapSelector value={location} onChange={setLocation} />
            </div>
          </div>
        )}

        {/* Step 2: Verification and Submission review */}
        {step === 2 && (
          <div className="space-y-4 w-full min-w-0">
            <div className="border-b pb-2 border-slate-50 min-w-0">
              <h2 className="font-outfit text-xs sm:text-sm font-bold text-slate-805">Review Your Report</h2>
              <p className="text-[10px] text-slate-450 mt-0.5">Please check evidence details and coordinates before final upload.</p>
            </div>

            {/* Before / details layout - stacks vertically on mobile */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 w-full min-w-0">
              <div className="rounded-xl overflow-hidden border border-slate-205">
                <img src={preview} alt="Evidence snapshot" className="h-44 sm:h-48 w-full object-cover" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4 w-full min-w-0 flex flex-col justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Submission Details</p>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <MapPin className="h-4 w-4 text-primary shrink-0" /> 
                    <span className="truncate">GPS Location Confirmed</span>
                  </p>
                  {location && (
                    <p className="text-[10px] text-slate-405 font-mono truncate">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
                
                <div className="bg-white border border-slate-200/80 p-2.5 rounded-lg flex gap-2 text-[10px] text-slate-500 leading-relaxed font-semibold">
                  <ShieldCheck className="h-4.5 w-4.5 text-success shrink-0 mt-0.5" />
                  <span>AI models will analyze the frame and dispatch the request instantly.</span>
                </div>
              </div>
            </div>

            {/* Submitting progress loader */}
            {submitting && (
              <div className="mt-4 pt-1 w-full">
                <div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-slate-450">
                  <span>Uploading secure telemetry...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
                  <div className="h-full bg-primary transition-all duration-100" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form controls bar */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 w-full min-w-0">
          <button
            type="button"
            onClick={() => setStep((curr) => Math.max(curr - 1, 0))}
            disabled={step === 0 || submitting}
            className="inline-flex items-center gap-1 h-10 px-3 rounded-button text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-55 select-none transition disabled:invisible cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> 
            Back
          </button>
          
          {step < 2 ? (
            <button
              type="button"
              onClick={next}
              disabled={step === 0 && !image}
              className="inline-flex items-center justify-center gap-1 bg-primary text-white h-11 px-5 rounded-button font-bold text-xs shadow-premium hover:bg-primary-dark transition select-none disabled:opacity-50 cursor-pointer"
            >
              Continue 
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 bg-primary text-white h-11 px-5 rounded-button font-bold text-xs shadow-premium hover:bg-primary-dark transition select-none disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Report
                </>
              )}
            </button>
          )}
        </div>

      </section>

      {/* Guide widget card */}
      <div className="bg-slate-50 border border-slate-100 rounded-card p-4 text-[10px] text-slate-500 space-y-2 w-full min-w-0">
        <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[9px] flex items-center gap-1 shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          Reporting guidelines
        </h4>
        <ul className="list-disc pl-4 space-y-1.5 leading-relaxed font-medium">
          <li>Stand directly in front of the incident to capture exact coordinates.</li>
          <li>Ensure the camera lens is clean and the problem (e.g. pothole) is fully visible.</li>
          <li>Submit only fresh evidence photos captured at this moment.</li>
        </ul>
      </div>

    </div>
  );
}
