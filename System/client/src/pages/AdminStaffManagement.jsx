import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../api/admin.api';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Copy, 
  X,
  FileText,
  Building,
  TrendingUp,
  Inbox,
  UserPlus
} from 'lucide-react';
import { toast } from 'react-toastify';
import SkeletonCard from '../components/ui/skeleton/SkeletonCard';
import SkeletonTable from '../components/ui/skeleton/SkeletonTable';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function AdminStaffManagement() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'workers' | 'admins' | 'invitations'
  const [stats, setStats] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [targetRevokeId, setTargetRevokeId] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [deptModalOpen, setDeptModalOpen] = useState(false);

  // New Staff Registration form states
  const [workerForm, setWorkerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    designation: 'Field Worker',
    skills: ''
  });

  const [adminForm, setAdminForm] = useState({
    fullName: '',
    email: ''
  });

  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    email: '',
    phone: ''
  });

  // Enroll citizen states
  const [citizenQuery, setCitizenQuery] = useState('');
  const [citizenResults, setCitizenResults] = useState([]);
  const [searchingCitizen, setSearchingCitizen] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);
  const [enrollForm, setEnrollForm] = useState({
    employeeId: '',
    department: '',
    designation: 'Field Worker',
    skills: ''
  });

  // Filter states
  const [workerSearch, setWorkerSearch] = useState('');
  const [invitationFilter, setInvitationFilter] = useState('All');

  // Load all initial page datasets
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [statsRes, workersRes, adminsRes, invsRes, deptsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getWorkers(),
        adminApi.getAdmins(),
        adminApi.getInvitations(),
        adminApi.getDepartments()
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (workersRes.data.success) setWorkers(workersRes.data.data);
      if (adminsRes.data.success) setAdmins(adminsRes.data.data);
      if (invsRes.data.success) setInvitations(invsRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
    } catch (err) {
      console.error('Failed to sync staff management data:', err);
      setError(err.message || 'Verification pipeline sync failure.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Handle Worker Registration Submit
  const handleRegisterWorker = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...workerForm,
        skills: workerForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await adminApi.inviteWorker(payload);
      if (res.data.success) {
        const joinLink = `${window.location.origin}/invitation/accept?token=${res.data.token}`;
        navigator.clipboard.writeText(joinLink);
        toast.success('Worker invitation generated! Link copied to clipboard.');
        setWorkerModalOpen(false);
        setWorkerForm({
          fullName: '',
          email: '',
          phone: '',
          employeeId: '',
          department: '',
          designation: 'Field Worker',
          skills: ''
        });
        loadData(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invitation.');
    }
  };

  // Handle Admin Registration Submit
  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.inviteAdmin(adminForm);
      if (res.data.success) {
        const joinLink = `${window.location.origin}/invitation/accept?token=${res.data.token}`;
        navigator.clipboard.writeText(joinLink);
        toast.success('Admin invitation generated! Link copied to clipboard.');
        setAdminModalOpen(false);
        setAdminForm({ fullName: '', email: '' });
        loadData(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invitation.');
    }
  };

  // Handle Citizen Search query
  useEffect(() => {
    const search = async () => {
      if (citizenQuery.trim().length < 2) {
        setCitizenResults([]);
        return;
      }
      setSearchingCitizen(true);
      try {
        const res = await adminApi.searchCitizens(citizenQuery);
        if (res.data.success) {
          setCitizenResults(res.data.data);
        }
      } catch (err) {
        console.error('Citizen search failed:', err);
      } finally {
        setSearchingCitizen(false);
      }
    };
    const debounce = setTimeout(search, 400);
    return () => clearTimeout(debounce);
  }, [citizenQuery]);

  // Handle Citizen Upgrade/Enrollment Submit
  const handleEnrollCitizen = async (e) => {
    e.preventDefault();
    if (!selectedCitizen) return;
    try {
      const payload = {
        userId: selectedCitizen._id,
        ...enrollForm,
        skills: enrollForm.skills.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await adminApi.enrollCitizen(payload);
      if (res.data.success) {
        toast.success(`${selectedCitizen.fullName} successfully upgraded to Field Worker!`);
        setEnrollModalOpen(false);
        setSelectedCitizen(null);
        setCitizenQuery('');
        setEnrollForm({
          employeeId: '',
          department: '',
          designation: 'Field Worker',
          skills: ''
        });
        loadData(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade enrollment failed.');
    }
  };

  // Handle resend invitation link
  const handleResendInv = async (id) => {
    try {
      const res = await adminApi.resendInvitation(id);
      if (res.data.success) {
        const joinLink = `${window.location.origin}/invitation/accept?token=${res.data.token}`;
        navigator.clipboard.writeText(joinLink);
        toast.success('Invitation token regenerated and copied to clipboard!');
        loadData(false);
      }
    } catch (err) {
      toast.error('Failed to regenerate invitation link.');
    }
  };

  // Handle revoke invitation
  const handleRevokeInv = (id) => {
    setTargetRevokeId(id);
    setRevokeModalOpen(true);
  };

  const confirmRevokeInvitation = async () => {
    if (!targetRevokeId) return;
    setIsRevoking(true);
    try {
      const res = await adminApi.revokeInvitation(targetRevokeId);
      if (res.data.success) {
        toast.success('Invitation revoked successfully.');
        setRevokeModalOpen(false);
        setTargetRevokeId(null);
        loadData(false);
      }
    } catch (err) {
      toast.error('Failed to revoke invitation.');
    } finally {
      setIsRevoking(false);
    }
  };

  // Handle Add Department Submit
  const handleAddDept = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.addDepartment(deptForm);
      if (res.data.success) {
        toast.success('New Department created successfully!');
        setDeptModalOpen(false);
        setDeptForm({ name: '', code: '', description: '', email: '', phone: '' });
        loadData(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department.');
    }
  };

  // Filter lists
  const filteredWorkers = workers.filter(w => 
    w.fullName?.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.employeeId?.toLowerCase().includes(workerSearch.toLowerCase()) ||
    w.department?.name?.toLowerCase().includes(workerSearch.toLowerCase())
  );

  const filteredInvs = invitations.filter(inv => {
    if (invitationFilter === 'All') return true;
    return inv.status === invitationFilter;
  });

  if (loading && !stats) {
    return (
      <div className="p-4 space-y-6 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-20" />
          ))}
        </div>
        <SkeletonTable rows={5} cols={6} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex-grow flex items-center justify-center p-4 min-h-[50vh] w-full">
        <div className="bg-white p-6 rounded-card border border-slate-200 shadow-soft max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="text-sm font-bold text-slate-805">Syncing Command Center Interrupted</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <button 
            onClick={() => loadData(true)}
            className="w-full bg-primary text-white h-11 rounded-button text-xs font-bold hover:bg-primary-dark transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            Retry Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      {/* Page Header */}
      <header className="bg-white border border-slate-200 rounded-card p-4 sm:p-5 shadow-soft flex flex-col justify-between items-start gap-2.5 w-full min-w-0">
        <div>
          <h1 className="font-outfit text-base sm:text-lg font-extrabold text-slate-909 flex items-center gap-2">
            <UserCheck className="h-5.5 w-5.5 text-primary shrink-0" />
            Staff & Access Management
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-normal">
            Invite, configure, monitor, or revoke field workers, administrators, and departments.
          </p>
        </div>
      </header>

      {/* Metrics overview */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full min-w-0">
        <MetricCard label="Total Workers" value={stats?.totalWorkers} icon={Users} color="text-primary bg-blue-50" />
        <MetricCard label="Active Workers" value={stats?.activeWorkers} icon={CheckCircle} color="text-success bg-emerald-50" />
        <MetricCard label="Online" value={stats?.onlineWorkers} icon={CheckCircle} color="text-emerald-600 bg-emerald-100/50" isOnline />
        <MetricCard label="Offline" value={stats?.offlineWorkers} icon={Clock} color="text-slate-400 bg-slate-100" />
        <MetricCard label="Total Admins" value={stats?.totalAdmins} icon={ShieldCheck} color="text-purple-650 bg-purple-50" />
        <MetricCard label="Pending Invs" value={stats?.pendingInvitations} icon={Mail} color="text-amber-600 bg-amber-50" />
      </section>

      {/* Tab Selectors */}
      <section className="border-b border-slate-200 w-full min-w-0 flex overflow-x-auto select-none no-scrollbar">
        {['overview', 'workers', 'admins', 'invitations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 capitalize whitespace-nowrap cursor-pointer transition ${
              activeTab === tab 
                ? 'border-primary text-primary font-extrabold' 
                : 'border-transparent text-slate-450 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </section>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-w-0">
          {/* Recent Pending Invitations */}
          <div className="bg-white border border-slate-200 rounded-card p-4 shadow-soft space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase font-outfit">Active Pending Invitations</h3>
              <button 
                onClick={() => setActiveTab('invitations')} 
                className="text-[10px] font-extrabold text-primary hover:underline uppercase"
              >
                View All
              </button>
            </div>
            {invitations.filter(i => i.status === 'Pending').slice(0, 4).length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No pending invitations.</div>
            ) : (
              <div className="space-y-3.5">
                {invitations.filter(i => i.status === 'Pending').slice(0, 4).map((inv) => (
                  <div key={inv._id} className="flex justify-between items-center border-b pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">{inv.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{inv.email} • <span className="text-primary font-bold">{inv.role}</span></p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleResendInv(inv._id)}
                        className="h-8 px-2.5 bg-slate-50 border hover:bg-slate-100 rounded-button text-[10px] font-bold text-slate-655 flex items-center gap-1 cursor-pointer"
                        title="Copy accept link"
                      >
                        <Copy className="w-3 h-3" /> Copy Link
                      </button>
                      <button 
                        onClick={() => handleRevokeInv(inv._id)}
                        className="h-8 w-8 hover:bg-red-50 hover:text-danger rounded-button text-slate-400 flex items-center justify-center cursor-pointer"
                        title="Revoke invitation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Departments actions */}
          <div className="bg-white border border-slate-200 rounded-card p-4 shadow-soft space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase font-outfit">Active Departments</h3>
              <button 
                onClick={() => setDeptModalOpen(true)} 
                className="h-7 px-2 bg-primary text-white rounded-button text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {departments.map((dept) => (
                <div key={dept._id} className="flex justify-between items-center p-2 hover:bg-slate-50 border rounded-lg">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 truncate">{dept.name}</h4>
                    <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-1 py-0.25 rounded">{dept.code}</span>
                  </div>
                  <span className="text-[10px] text-slate-450 font-bold shrink-0">{dept.activeWorkers?.length || 0} agents</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workers Tab */}
      {activeTab === 'workers' && (
        <div className="space-y-4 w-full min-w-0">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs min-w-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search workers ID, department..."
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-button py-2 pl-9 pr-4 text-xs font-semibold text-slate-700"
              />
            </div>
            {/* Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                onClick={() => setEnrollModalOpen(true)}
                className="flex-1 sm:flex-initial h-9 px-3 bg-white border hover:bg-slate-50 text-slate-700 rounded-button text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-soft"
              >
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Enroll Citizen</span>
              </button>
              <button
                onClick={() => setWorkerModalOpen(true)}
                className="flex-1 sm:flex-initial h-9 px-3 bg-primary text-white rounded-button text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-soft hover:bg-primary-dark"
              >
                <Plus className="w-4 h-4" />
                <span>Register Worker</span>
              </button>
            </div>
          </div>

          {filteredWorkers.length === 0 ? (
            <div className="bg-white border p-12 text-center rounded-card shadow-soft">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">No workers registered in database.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table view */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-card shadow-soft overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Worker Name</th>
                      <th className="px-3 py-3">Employee ID</th>
                      <th className="px-3 py-3">Department</th>
                      <th className="px-3 py-3">Availability</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-semibold">
                    {filteredWorkers.map((w) => (
                      <tr key={w._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase font-outfit select-none">
                            {w.fullName?.slice(0,2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-snug">{w.fullName}</p>
                            <span className="text-[10px] text-slate-400 font-semibold">{w.email}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-500">{w.employeeId || 'N/A'}</td>
                        <td className="px-3 py-3">{w.department?.name || 'Unassigned'}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            w.isOnline ? 'bg-emerald-50 text-success border-emerald-200' : 'bg-slate-150 text-slate-500 border-slate-200'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${w.isOnline ? 'bg-success' : 'bg-slate-400'}`} />
                            {w.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            w.status === 'Active' ? 'bg-emerald-50 text-success' :
                            w.status === 'Suspended' ? 'bg-red-50 text-danger' : 'bg-slate-100 text-slate-500'
                          }`}>{w.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a 
                            href={`/admin/workers/${w._id}`}
                            className="text-xs font-bold text-primary hover:underline uppercase"
                          >
                            Manage
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card list view */}
              <div className="md:hidden space-y-3">
                {filteredWorkers.map((w) => (
                  <div key={w._id} className="bg-white border rounded-card p-4 shadow-soft space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase font-outfit select-none">
                          {w.fullName?.slice(0,2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{w.fullName}</h4>
                          <span className="text-[10px] text-slate-450">{w.email}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        w.status === 'Active' ? 'bg-emerald-50 text-success' :
                        w.status === 'Suspended' ? 'bg-red-50 text-danger' : 'bg-slate-100 text-slate-500'
                      }`}>{w.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b py-2 text-slate-655 font-semibold">
                      <p>Employee ID: <span className="font-mono text-slate-500">{w.employeeId || 'N/A'}</span></p>
                      <p>Dept: <span className="text-slate-700">{w.department?.code || 'N/A'}</span></p>
                      <p>Duty: <span className="text-slate-700">{w.availability}</span></p>
                      <p>Online: <span className={w.isOnline ? 'text-success' : 'text-slate-400'}>{w.isOnline ? 'Yes' : 'No'}</span></p>
                    </div>
                    <div className="flex justify-end pt-1">
                      <a 
                        href={`/admin/workers/${w._id}`}
                        className="h-8 px-4 bg-primary text-white rounded-button text-[10px] font-bold flex items-center justify-center uppercase cursor-pointer"
                      >
                        Manage Agent
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-4 w-full min-w-0">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-xs font-bold text-slate-855 uppercase font-outfit">Active System Administrators</h3>
            <button
              onClick={() => setAdminModalOpen(true)}
              className="h-9 px-3 bg-primary text-white rounded-button text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-soft hover:bg-primary-dark"
            >
              <Plus className="w-4 h-4" />
              <span>Register Admin</span>
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {admins.map((adm) => (
              <div key={adm._id} className="bg-white border border-slate-200 rounded-card p-4 shadow-soft flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-650 border border-purple-200 flex items-center justify-center font-bold uppercase font-outfit select-none shrink-0">
                  {adm.fullName?.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{adm.fullName}</h4>
                  <p className="text-[10px] text-slate-450 truncate font-semibold">{adm.email}</p>
                  <span className="mt-1 inline-flex px-1.5 py-0.25 rounded text-[8px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-650 border border-purple-100">
                    Administrator
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-4 w-full min-w-0">
          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar">
            {['All', 'Pending', 'Accepted', 'Expired', 'Revoked'].map((status) => (
              <button
                key={status}
                onClick={() => setInvitationFilter(status)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                  invitationFilter === status 
                    ? 'bg-primary text-white border-primary font-extrabold' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredInvs.length === 0 ? (
            <div className="bg-white border p-12 text-center rounded-card shadow-soft">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 mt-2">No invitations match filter criteria.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInvs.map((inv) => (
                <div key={inv._id} className="bg-white border border-slate-200 rounded-card p-4 shadow-soft space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{inv.fullName}</h4>
                      <p className="text-[10px] text-slate-450 truncate font-semibold">{inv.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      inv.status === 'Pending' ? 'bg-amber-50 text-warning border-amber-200' :
                      inv.status === 'Accepted' ? 'bg-emerald-50 text-success border-emerald-200' :
                      inv.status === 'Revoked' ? 'bg-red-50 text-danger border-red-200' : 'bg-slate-100 text-slate-500'
                    }`}>{inv.status}</span>
                  </div>

                  <div className="text-[10px] text-slate-555 space-y-1 font-semibold">
                    <p>Expected Role: <span className="text-slate-800 font-bold">{inv.role}</span></p>
                    {inv.department && <p>Department: <span className="text-slate-800">{inv.department?.name}</span></p>}
                    {inv.employeeId && <p>Employee ID: <span className="font-mono text-slate-800">{inv.employeeId}</span></p>}
                    <p>Expires: <span className="text-slate-500">{new Date(inv.expiresAt).toLocaleDateString()}</span></p>
                  </div>

                  {inv.status === 'Pending' && (
                    <div className="flex justify-end gap-1.5 pt-2 border-t">
                      <button
                        onClick={() => handleResendInv(inv._id)}
                        className="h-8 px-2.5 bg-slate-50 hover:bg-slate-100 border text-slate-655 text-[10px] font-bold rounded-button flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Re-copy Link
                      </button>
                      <button
                        onClick={() => handleRevokeInv(inv._id)}
                        className="h-8 px-2.5 hover:bg-red-50 text-danger border border-red-100 text-[10px] font-bold rounded-button flex items-center gap-1 cursor-pointer"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
         REGISTER WORKER MODAL
         ============================================================ */}
      {workerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-card shadow-premium border border-slate-100 w-full max-w-md p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setWorkerModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-outfit text-sm sm:text-base font-extrabold text-slate-900 border-b pb-2 uppercase tracking-wide flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Register Field Worker
            </h3>
            
            <form onSubmit={handleRegisterWorker} className="space-y-4 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Full Name</label>
                <input
                  type="text"
                  required
                  value={workerForm.fullName}
                  onChange={(e) => setWorkerForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="e.g. Prafull Shinde"
                  className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Official Email</label>
                  <input
                    type="email"
                    required
                    value={workerForm.email}
                    onChange={(e) => setWorkerForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="worker@department.gov"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Contact Phone</label>
                  <input
                    type="text"
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Employee ID Code</label>
                  <input
                    type="text"
                    required
                    value={workerForm.employeeId}
                    onChange={(e) => setWorkerForm(p => ({ ...p, employeeId: e.target.value }))}
                    placeholder="e.g. ROAD-102"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Assigned Department</label>
                  <select
                    required
                    value={workerForm.department}
                    onChange={(e) => setWorkerForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-bold focus:bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Designation / Role Title</label>
                <input
                  type="text"
                  value={workerForm.designation}
                  onChange={(e) => setWorkerForm(p => ({ ...p, designation: e.target.value }))}
                  placeholder="e.g. Lead Pavement Specialist"
                  className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Operational Skills (comma separated)</label>
                <input
                  type="text"
                  value={workerForm.skills}
                  onChange={(e) => setWorkerForm(p => ({ ...p, skills: e.target.value }))}
                  placeholder="Pothole Repair, Road Inspection, Asphalt Laying"
                  className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setWorkerModalOpen(false)}
                  className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-button text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-primary text-white hover:bg-primary-dark rounded-button text-xs font-bold shadow-soft cursor-pointer"
                >
                  Send Worker Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
         REGISTER ADMIN MODAL
         ============================================================ */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-card shadow-premium border border-slate-100 w-full max-w-md p-6 relative">
            <button 
              onClick={() => setAdminModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-outfit text-sm sm:text-base font-extrabold text-slate-900 border-b pb-2 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Register Command Admin
            </h3>
            
            <form onSubmit={handleRegisterAdmin} className="space-y-4 pt-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="e.g. Admin Commander"
                  className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Official Email</label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@department.gov"
                  className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-button text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-primary text-white hover:bg-primary-dark rounded-button text-xs font-bold shadow-soft cursor-pointer"
                >
                  Send Admin Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
         ENROLL CITIZEN MODAL
         ============================================================ */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-card shadow-premium border border-slate-100 w-full max-w-md p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                setEnrollModalOpen(false);
                setSelectedCitizen(null);
                setCitizenQuery('');
              }}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-outfit text-sm sm:text-base font-extrabold text-slate-900 border-b pb-2 uppercase tracking-wide flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" /> Enroll Existing Citizen
            </h3>
            
            {/* Citizen search segment */}
            {!selectedCitizen ? (
              <div className="space-y-4 pt-4">
                <p className="text-xs text-slate-500 leading-normal">
                  Search registered citizen users to enroll them directly as Field Workers.
                </p>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or contact..."
                    value={citizenQuery}
                    onChange={(e) => setCitizenQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-button py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-700 focus:bg-white"
                  />
                </div>

                {searchingCitizen && (
                  <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                )}

                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {citizenResults.map((c) => (
                    <div 
                      key={c._id} 
                      onClick={() => setSelectedCitizen(c)}
                      className="flex justify-between items-center p-3 hover:bg-primary-light/5 border border-slate-150 rounded-lg cursor-pointer transition"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-808 truncate">{c.fullName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{c.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-350 shrink-0" />
                    </div>
                  ))}
                  {citizenQuery && citizenResults.length === 0 && !searchingCitizen && (
                    <p className="text-center py-4 text-xs text-slate-400">No citizen records match this search query.</p>
                  )}
                </div>
              </div>
            ) : (
              // Selection setup
              <form onSubmit={handleEnrollCitizen} className="space-y-4 pt-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-primary uppercase font-outfit">Selected user</span>
                    <h4 className="text-xs font-extrabold text-slate-808 font-outfit">{selectedCitizen.fullName}</h4>
                    <p className="text-[10px] font-mono text-slate-450">{selectedCitizen.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCitizen(null)}
                    className="text-[10px] font-extrabold text-danger hover:underline uppercase"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Employee ID Code</label>
                    <input
                      type="text"
                      required
                      value={enrollForm.employeeId}
                      onChange={(e) => setEnrollForm(p => ({ ...p, employeeId: e.target.value }))}
                      placeholder="e.g. SAN-210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Assigned Department</label>
                    <select
                      required
                      value={enrollForm.department}
                      onChange={(e) => setEnrollForm(p => ({ ...p, department: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-bold focus:bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Designation / Role Title</label>
                  <input
                    type="text"
                    value={enrollForm.designation}
                    onChange={(e) => setEnrollForm(p => ({ ...p, designation: e.target.value }))}
                    placeholder="e.g. Senior Sanitation Engineer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Operational Skills (comma separated)</label>
                  <input
                    type="text"
                    value={enrollForm.skills}
                    onChange={(e) => setEnrollForm(p => ({ ...p, skills: e.target.value }))}
                    placeholder="Garbage sorting, Hazardous cleanup, Route dispatch"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrollModalOpen(false);
                      setSelectedCitizen(null);
                      setCitizenQuery('');
                    }}
                    className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-button text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 bg-primary text-white hover:bg-primary-dark rounded-button text-xs font-bold shadow-soft cursor-pointer"
                  >
                    Enroll as Worker
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
         ADD DEPARTMENT MODAL
         ============================================================ */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="bg-white rounded-card shadow-premium border border-slate-100 w-full max-w-md p-6 relative">
            <button 
              onClick={() => setDeptModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-outfit text-sm sm:text-base font-extrabold text-slate-900 border-b pb-2 uppercase tracking-wide flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" /> Create Department
            </h3>
            
            <form onSubmit={handleAddDept} className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Department Name</label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Sanitation Department"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Code</label>
                  <input
                    type="text"
                    required
                    value={deptForm.code}
                    onChange={(e) => setDeptForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="e.g. SAN"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Description</label>
                <textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Responsibilities, scope, details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white h-20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Contact Email</label>
                  <input
                    type="email"
                    value={deptForm.email}
                    onChange={(e) => setDeptForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="dept@municipal.gov"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 font-outfit">Hotline Phone</label>
                  <input
                    type="text"
                    value={deptForm.phone}
                    onChange={(e) => setDeptForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-button p-2.5 text-xs text-slate-750 font-semibold focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-button text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-primary text-white hover:bg-primary-dark rounded-button text-xs font-bold shadow-soft cursor-pointer"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Invitation Confirmation Modal */}
      <ConfirmDialog
        isOpen={revokeModalOpen}
        title="Revoke Staff Invitation"
        message="Are you sure you want to revoke this staff invitation? The invitation link and access token will immediately be invalidated."
        confirmText="Revoke Invitation"
        confirmVariant="danger"
        iconType="danger"
        isLoading={isRevoking}
        onConfirm={confirmRevokeInvitation}
        onCancel={() => {
          if (!isRevoking) {
            setRevokeModalOpen(false);
            setTargetRevokeId(null);
          }
        }}
      />

    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, isOnline }) {
  return (
    <div className="bg-white border border-slate-200 rounded-card p-4 shadow-soft flex items-center justify-between w-full min-w-0">
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-outfit truncate">{label}</p>
        <h4 className="mt-1 font-outfit text-base sm:text-lg font-black text-slate-805 truncate flex items-center gap-1.5">
          {isOnline && <span className="h-2 w-2 rounded-full bg-success animate-ping inline-block shrink-0" />}
          <span>{value !== undefined ? value : 0}</span>
        </h4>
      </div>
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
    </div>
  );
}
