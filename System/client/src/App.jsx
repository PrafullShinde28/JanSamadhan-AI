import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { AppProvider, useApp } from './context/AppContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './layouts/Navbar';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import ComplaintHistory from './pages/ComplaintHistory';
import ComplaintDetails from './pages/ComplaintDetails';
import CitizenNotifications from './pages/CitizenNotifications';
import CitizenAppShell from './layouts/CitizenAppShell';
import CitizenMap from './pages/CitizenMap';
import CitizenProfile from './pages/CitizenProfile';
import CitizenSettings from './pages/CitizenSettings';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminComplaintDetails from './pages/AdminComplaintDetails';
import AdminMap from './pages/AdminMap';
import AdminWorkers from './pages/AdminWorkers';
import AdminDepartments from './pages/AdminDepartments';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminNotifications from './pages/AdminNotifications';
import AdminSettings from './pages/AdminSettings';
import AdminAppShell from './layouts/AdminAppShell';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerComplaints from './pages/WorkerComplaints';
import WorkerComplaintDetails from './pages/WorkerComplaintDetails';
import WorkerLocationVerification from './pages/WorkerLocationVerification';
import WorkerLiveNavigation from './pages/WorkerLiveNavigation';
import WorkerProgressForm from './pages/WorkerProgressForm';
import WorkerResolutionForm from './pages/WorkerResolutionForm';
import WorkerNotifications from './pages/WorkerNotifications';
import WorkerAppShell from './layouts/WorkerAppShell';
import WorkerMap from './pages/WorkerMap';
import WorkerProfile from './pages/WorkerProfile';
import WorkerSettings from './pages/WorkerSettings';
import AdminStaffManagement from './pages/AdminStaffManagement';
import AdminWorkerDetails from './pages/AdminWorkerDetails';
import InvitationAcceptance from './pages/InvitationAcceptance';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2, ShieldAlert } from 'lucide-react';
import AppLoadingScreen from './components/AppLoadingScreen';
import PWAInstallPrompt from './components/PWAInstallPrompt';


const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_d2lubmluZy1wYW5kYS0yOC5jbGVyay5hY2NvdW50cy5kZXYk';

// Role-based Protected Route Guard
function ProtectedRoute({ children, allowedRoles }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { dbUser, loading } = useApp();

  if (!isLoaded || loading || (isSignedIn && !dbUser)) {
    return <AppLoadingScreen />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  if (allowedRoles && dbUser && !allowedRoles.includes(dbUser.role)) {
    // Redirect based on current role if trying to access restricted pages
    if (dbUser.role === 'Admin') return <Navigate to="/admin" replace />;
    if (dbUser.role === 'Worker') return <Navigate to="/worker" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function DashboardRedirect() {
  const { dbUser, loading } = useApp();
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded || loading) {
    return <AppLoadingScreen />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  if (dbUser?.role === 'Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (dbUser?.role === 'Worker') {
    return <Navigate to="/worker/dashboard" replace />;
  }
  return <Navigate to="/citizen/dashboard" replace />;
}

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="bg-white p-8 rounded-card shadow-premium border border-red-100 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-danger mx-auto animate-bounce" />
          <h2 className="text-xl font-extrabold text-slate-800 font-outfit">Clerk Publishable Key Missing</h2>
          <p className="text-xs text-slate-500">Please provide your VITE_CLERK_PUBLISHABLE_KEY variable in client/.env config file to run this application.</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AppProvider>
        <SocketProvider>
          <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-slate-50">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/login/*" element={<Navigate to="/sign-in" replace />} />
                <Route path="/register/*" element={<Navigate to="/sign-up" replace />} />
                <Route path="/invitation/accept" element={<InvitationAcceptance />} />

                {/* Legacy Redirects */}
                <Route path="/dashboard" element={<DashboardRedirect />} />
                <Route path="/report-issue" element={<Navigate to="/citizen/report" replace />} />
                <Route path="/my-complaints" element={<Navigate to="/citizen/complaints" replace />} />
                <Route path="/complaints/:id" element={<Navigate to="/citizen/complaints/:id" replace />} />

                {/* Citizen Routes */}
                <Route 
                  path="/citizen" 
                  element={
                    <ProtectedRoute allowedRoles={['Citizen']}>
                      <CitizenAppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/citizen/dashboard" replace />} />
                  <Route path="dashboard" element={<CitizenDashboard />} />
                  <Route path="report" element={<SubmitComplaint />} />
                  <Route path="complaints" element={<ComplaintHistory />} />
                  <Route path="complaints/:id" element={<ComplaintDetails />} />
                  <Route path="notifications" element={<CitizenNotifications />} />
                  <Route path="map" element={<CitizenMap />} />
                  <Route path="profile" element={<CitizenProfile />} />
                  <Route path="settings" element={<CitizenSettings />} />
                </Route>

                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <AdminAppShell />
                    </ProtectedRoute>
                  } 
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                  <Route path="complaints/:id" element={<AdminComplaintDetails />} />
                  <Route path="map" element={<AdminMap />} />
                  <Route path="workers" element={<AdminWorkers />} />
                  <Route path="workers/:id" element={<AdminWorkerDetails />} />
                  <Route path="staff" element={<AdminStaffManagement />} />
                  <Route path="departments" element={<AdminDepartments />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="notifications" element={<AdminNotifications />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Worker Routes */}
                <Route 
                  path="/worker" 
                  element={
                    <ProtectedRoute allowedRoles={['Worker']}>
                      <WorkerAppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/worker/dashboard" replace />} />
                  <Route path="dashboard" element={<WorkerDashboard />} />
                  <Route path="complaints" element={<WorkerComplaints />} />
                  <Route path="complaints/:id" element={<WorkerComplaintDetails />} />
                  <Route path="complaints/:id/navigation" element={<WorkerLiveNavigation />} />
                  <Route path="complaints/:id/location" element={<WorkerLiveNavigation />} />
                  <Route path="complaints/:id/progress" element={<WorkerProgressForm />} />
                  <Route path="complaints/:id/resolve" element={<WorkerResolutionForm />} />
                  <Route path="notifications" element={<WorkerNotifications />} />
                  <Route path="map" element={<WorkerMap />} />
                  <Route path="profile" element={<WorkerProfile />} />
                  <Route path="settings" element={<WorkerSettings />} />
                </Route>

                {/* Fallback Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          <PWAInstallPrompt />
          <ToastContainer 
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </BrowserRouter>
        </SocketProvider>
      </AppProvider>
    </ClerkProvider>
  );
}
