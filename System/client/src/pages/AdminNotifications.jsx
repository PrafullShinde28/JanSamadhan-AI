import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Bell, Check, Trash2, ExternalLink, Inbox } from 'lucide-react';
import { toast } from 'react-toastify';
import WorkerNotificationsSkeleton from '../components/skeletons/WorkerNotificationsSkeleton';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function AdminNotifications() {
  const { 
    notifications, 
    unreadNotificationsCount, 
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification, 
    deleteAllNotifications,
    fetchNotifications,
    loading 
  } = useApp();

  const [filter, setFilter] = useState('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (targetDeleteId) {
        await deleteNotification(targetDeleteId);
        toast.success('Notification cleared');
      } else {
        await deleteAllNotifications();
        toast.success('All notifications cleared');
      }
      setDeleteModalOpen(false);
      setTargetDeleteId(null);
    } catch (err) {
      toast.error(targetDeleteId ? 'Failed to clear notification' : 'Failed to clear all notifications');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (id) => {
    setTargetDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteAll = () => {
    setTargetDeleteId(null);
    setDeleteModalOpen(true);
  };

  const getPriorityStyle = (priority) => {
    if (priority === 'High' || priority === 'Critical') return 'border-l-4 border-red-500 bg-red-50/10';
    if (priority === 'Medium') return 'border-l-4 border-amber-500 bg-amber-50/10';
    return 'border-l-4 border-blue-500 bg-blue-50/10';
  };

  if (loading && notifications.length === 0) {
    return <WorkerNotificationsSkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-5 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6 w-full min-w-0">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-4 sm:p-5 shadow-soft w-full min-w-0">
          <div>
            <span className="text-[9px] font-bold text-primary bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider font-outfit">Governance desk</span>
            <h1 className="mt-2 font-outfit text-base sm:text-lg font-extrabold tracking-tight text-slate-905 flex items-center gap-1.5 leading-snug">
              <Bell className="h-5 w-5 text-primary animate-pulse shrink-0" />
              Incident Alert Logs
              {unreadNotificationsCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-danger border border-red-200">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </h1>
            <p className="mt-1 text-[10px] text-slate-500">Track AI duplicate warnings, worker reassignments, and administrative override events.</p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {unreadNotificationsCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                className="inline-flex items-center gap-1.5 rounded-button border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                onClick={handleDeleteAll} 
                className="inline-flex items-center gap-1.5 rounded-button bg-red-50 px-3.5 py-2 text-xs font-bold text-danger border border-red-100 hover:bg-red-100/50 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Logs
              </button>
            )}
          </div>
        </header>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
          {['all', 'unread', 'read'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition relative border-b-2 -mb-[3px] ${
                filter === tab 
                  ? 'border-primary text-primary font-extrabold' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab} ({
                tab === 'all' ? notifications.length :
                tab === 'unread' ? unreadNotificationsCount :
                notifications.length - unreadNotificationsCount
              })
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3 w-full min-w-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-card p-4 animate-pulse motion-reduce:animate-none flex gap-4 w-full">
                <div className="rounded-full bg-slate-200 h-9 w-9 shrink-0" />
                <div className="flex-grow space-y-2 min-w-0">
                  <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-card border border-slate-200 bg-white p-16 text-center shadow-soft">
            <Inbox className="mx-auto h-12 w-12 text-slate-300 animate-bounce" />
            <h3 className="mt-4 font-outfit text-base font-bold text-slate-800">Alert Registry Empty</h3>
            <p className="mt-1 text-xs text-slate-500">No administrative logs matching filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-3 w-full min-w-0 max-h-[calc(100vh-14rem)] sm:max-h-[680px] overflow-y-auto pr-1 sm:pr-2">
            {filteredNotifications.map((notif) => {
              const id = notif._id || notif.id;
              return (
                <div 
                  key={id}
                  className={`rounded-card border border-slate-200 bg-white p-4 sm:p-5 shadow-soft transition hover:shadow-premium flex gap-4 ${
                    !notif.isRead ? 'bg-primary-light/5 border-primary/20' : ''
                  } ${getPriorityStyle(notif.priority)}`}
                >
                  <div className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-lg ${
                    !notif.isRead ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {notif.icon || '🔔'}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`text-sm font-bold text-slate-800 flex items-center gap-1.5 ${
                          !notif.isRead ? 'font-extrabold' : ''
                        }`}>
                          {notif.title}
                          {!notif.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </h4>
                        <p className="text-xs text-slate-455 mt-0.5">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!notif.isRead && (
                          <button 
                            onClick={() => handleMarkRead(id)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-primary hover:bg-slate-50 transition"
                            title="Mark read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(id)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-danger hover:bg-red-50 transition"
                          title="Delete alert"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed pr-6">
                      {notif.message}
                    </p>

                    {/* Admin Routing Detail Link */}
                    {notif.complaint && (
                      <div className="mt-3 flex items-center gap-2">
                        <Link 
                          to={`/admin/complaints/${notif.complaint}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline hover:text-primary-dark transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Control Desk
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reusable Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title={targetDeleteId ? 'Clear Alert' : 'Clear All Admin Alerts'}
        message={
          targetDeleteId
            ? 'Are you sure you want to clear this notification from admin desk?'
            : 'Are you sure you want to clear all admin alerts? This action cannot be undone.'
        }
        confirmText={targetDeleteId ? 'Clear' : 'Clear All'}
        confirmVariant="danger"
        iconType="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setTargetDeleteId(null);
          }
        }}
      />

    </div>
  );
}
