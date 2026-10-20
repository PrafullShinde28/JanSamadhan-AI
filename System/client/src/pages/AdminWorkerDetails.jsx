import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import { 
  ArrowLeft, 
  User, 
  Wrench, 
  Building, 
  Clock, 
  Activity, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle,
  Mail,
  Phone,
  Bookmark,
  Star,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import SkeletonCard from '../components/ui/skeleton/SkeletonCard';

export default function AdminWorkerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Editable fields state
  const [form, setForm] = useState({
    employeeId: '',
    department: '',
    designation: '',
    skills: '',
    status: 'Active'
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [workerRes, deptsRes] = await Promise.all([
        adminApi.getWorkerDetails(id),
        adminApi.getDepartments()
      ]);

      if (workerRes.data.success) {
        const w = workerRes.data.data;
        setWorker(w);
        setForm({
          employeeId: w.employeeId || '',
          department: w.department?._id || w.department || '',
          designation: w.designation || '',
          skills: w.skills?.join(', ') || '',
          status: w.status || 'Active'
        });
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load worker details:', err);
      setError(err.response?.data?.message || 'Failed to sync worker details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await adminApi.updateWorker(id, payload);
      if (res.data.success) {
        toast.success('Worker credentials updated successfully!');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply credentials updates.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !worker) {
    return (
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <SkeletonCard className="h-44" />
        <SkeletonCard className="h-60" />
      </div>
    );
  }

  if (error && !worker) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 min-h-[50vh] w-full">
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-soft max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="text-sm font-bold text-slate-805">Failed to Sync Profile</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <div className="flex gap-2">
            <Link 
              to="/admin/staff" 
              className="flex-1 bg-slate-50 hover:bg-slate-100 border text-slate-700 h-10 rounded-button text-xs font-bold flex items-center justify-center"
            >
              Back to Desk
            </Link>
            <button 
              onClick={loadData}
              className="flex-1 bg-primary text-white h-10 rounded-button text-xs font-bold hover:bg-primary-dark transition flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full max-w-2xl mx-auto overflow-x-hidden min-w-0 flex flex-col">
      {/* Back button link */}
      <Link to="/admin/staff" className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 hover:text-primary transition uppercase font-outfit">
        <ArrowLeft className="h-3.5 w-3.5" />
        Staff Management
      </Link>

      {/* Profile Overview Card */}
      <section className="bg-white border border-slate-200 rounded-card p-5 shadow-soft flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 w-full min-w-0">
        <div className="h-16 w-16 rounded-full bg-primary/10 text-primary border-4 border-primary-light flex items-center justify-center text-xl font-extrabold uppercase font-outfit select-none shrink-0">
          {worker?.fullName?.slice(0, 2)}
        </div>
        
        <div className="min-w-0 flex-grow w-full space-y-2">
          <div>
            <h2 className="font-outfit text-base sm:text-lg font-black text-slate-805 leading-snug truncate">
              {worker?.fullName}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold truncate">{worker?.email}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 select-none pt-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
              worker?.isOnline ? 'bg-emerald-50 text-success border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-250'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${worker?.isOnline ? 'bg-success animate-ping' : 'bg-slate-400'}`} />
              {worker?.isOnline ? 'Online' : 'Offline'}
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              worker?.status === 'Active' ? 'bg-emerald-50 text-success border border-emerald-100' :
              worker?.status === 'Suspended' ? 'bg-red-50 text-danger border border-red-100' : 'bg-slate-100 text-slate-500'
            }`}>{worker?.status}</span>
          </div>
        </div>
      </section>

      {/* Worker Stats Metrics Grid */}
      <section className="grid grid-cols-3 gap-2 w-full min-w-0">
        <div className="bg-white border rounded-xl p-3 text-center shadow-soft">
          <Activity className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="text-[8px] font-bold text-slate-400 font-outfit uppercase">Workload</p>
          <p className="font-outfit text-xs font-extrabold text-slate-805 mt-0.5">{worker?.workload || 0} active</p>
        </div>
        <div className="bg-white border rounded-xl p-3 text-center shadow-soft">
          <Star className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
          <p className="text-[8px] font-bold text-slate-400 font-outfit uppercase">Rating</p>
          <p className="font-outfit text-xs font-extrabold text-slate-805 mt-0.5">{worker?.performance?.rating ? worker.performance.rating.toFixed(1) : '5.0'} ★</p>
        </div>
        <div className="bg-white border rounded-xl p-3 text-center shadow-soft">
          <CheckCircle className="w-4 h-4 mx-auto text-success mb-1" />
          <p className="text-[8px] font-bold text-slate-400 font-outfit uppercase">Resolved</p>
          <p className="font-outfit text-xs font-extrabold text-slate-805 mt-0.5">{worker?.performance?.totalResolved || 0} total</p>
        </div>
      </section>

      {/* Edit Worker settings form */}
      <section className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft w-full min-w-0">
        <h3 className="font-outfit text-xs font-bold text-slate-805 border-b pb-2 border-slate-50 uppercase tracking-wide">
          Update Field Worker Credentials
        </h3>

        <form onSubmit={handleUpdate} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Employee ID Code</label>
              <input
                type="text"
                required
                value={form.employeeId}
                onChange={(e) => setForm(p => ({ ...p, employeeId: e.target.value }))}
                placeholder="e.g. ROAD-102"
                className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Department Assignment</label>
              <select
                required
                value={form.department}
                onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-bold focus:bg-white"
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Designation / Role Title</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm(p => ({ ...p, designation: e.target.value }))}
                placeholder="Field Inspector"
                className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Operational Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-bold focus:bg-white"
              >
                <option value="Active">Active (Operations Enabled)</option>
                <option value="Inactive">Inactive (Temporary Duty Suspension)</option>
                <option value="Suspended">Suspended (Access Forbidden)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Operational Skills (comma separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm(p => ({ ...p, skills: e.target.value }))}
              placeholder="Asphalt Repair, Drain Unclogging"
              className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updating}
              className="h-10 px-5 bg-primary text-white hover:bg-primary-dark rounded-button text-xs font-bold shadow-soft flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer w-full sm:w-auto"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Worker Settings'}
            </button>
          </div>
        </form>
      </section>

      {/* Info logs */}
      <section className="bg-slate-50 border rounded-card p-4 text-[10px] text-slate-450 leading-relaxed font-semibold">
        <p>• Online presence is updated dynamically based on real-time WebSocket keepalives.</p>
        <p className="mt-1">• Changing active worker departments will update their routing recommendations during auto-assignment runs.</p>
        {worker?.lastSeenAt && (
          <p className="mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Last operational sync: {new Date(worker.lastSeenAt).toLocaleString()}</span>
          </p>
        )}
      </section>
    </div>
  );
}
