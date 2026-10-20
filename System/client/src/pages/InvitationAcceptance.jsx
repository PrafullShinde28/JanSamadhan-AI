import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApp } from '../context/AppContext';
import { Loader2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

export default function InvitationAcceptance() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const { syncUser, dbUser, loading: appLoading } = useApp();
  
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Invitation token is missing from the link URL.');
      setProcessing(false);
      return;
    }

    // Cache the invitation token in localStorage
    localStorage.setItem('invitationToken', token);
    console.log('🎟️ Cached staff invitation token in localStorage.');

    if (isLoaded) {
      if (isSignedIn) {
        // If already signed in, attempt to claim it by running syncUser
        const claim = async () => {
          try {
            await syncUser();
            toast.success('Staff credentials synchronized successfully!');
            navigate('/dashboard');
          } catch (err) {
            console.error('Failed to claim invitation:', err);
            setError(err.message || 'Verification pipeline sync failure.');
          } finally {
            setProcessing(false);
          }
        };
        claim();
      } else {
        // Wait for user to authenticate
        setProcessing(false);
      }
    }
  }, [token, isSignedIn, isLoaded]);

  if (processing || appLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="relative h-12 w-12 mx-auto flex items-center justify-center">
            <span className="absolute animate-ping inline-flex h-8 w-8 rounded-full bg-primary/20 opacity-75" />
            <Loader2 className="h-8 w-8 text-primary animate-spin z-10" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-outfit">Validating Staff Token...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-card border border-red-100 shadow-soft max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-danger mx-auto animate-bounce" />
          <h2 className="text-base font-extrabold text-slate-805 font-outfit uppercase">Acceptance Failed</h2>
          <p className="text-xs text-slate-500 leading-normal font-semibold">{error}</p>
          <Link 
            to="/" 
            className="w-full inline-flex items-center justify-center bg-primary text-white h-11 rounded-button text-xs font-bold shadow-soft hover:bg-primary-dark transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-card border border-slate-100 shadow-soft max-w-md w-full text-center space-y-6">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-base sm:text-lg font-black text-slate-808 font-outfit uppercase tracking-tight">
            JanSamadhan AI Staff Invitation
          </h1>
          <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
            You have been registered as municipal command staff. Secure your credentials to log in to the system.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link 
            to="/sign-up?redirect_url=/dashboard" 
            className="w-full inline-flex items-center justify-center bg-primary text-white h-11 rounded-button text-xs font-bold shadow-soft hover:bg-primary-dark transition cursor-pointer gap-1.5"
          >
            <span>Register & Accept Invitation</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
          <Link 
            to="/sign-in?redirect_url=/dashboard" 
            className="w-full inline-flex items-center justify-center border border-slate-200 bg-white text-slate-700 h-11 rounded-button text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Sign in to Existing Account
          </Link>
        </div>
      </div>
    </div>
  );
}
