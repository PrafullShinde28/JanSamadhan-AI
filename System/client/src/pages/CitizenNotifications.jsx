import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Bell, Check, Trash2, ExternalLink, Inbox, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import WorkerNotificationsSkeleton from '../components/skeletons/WorkerNotificationsSkeleton';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function CitizenNotifications() {
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

  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null); // null for deleteAll, string for single
  const [isDeleting, setIsDeleting] = useState(false);

  // Refetch notifications on mount
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
        toast.success('Notification deleted');
      } else {
        await deleteAllNotifications();
        toast.success('All notifications deleted');
      }
      setDeleteModalOpen(false);
      setTargetDeleteId(null);
    } catch (err) {
      toast.error(targetDeleteId ? 'Failed to delete notification' : 'Failed to delete all notifications');
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
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 flex flex-col">
      
      {/* Header Banner */}
      <header className="flex flex-col gap-4 rounded-card border border-slate-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-primary font-outfit uppercase tracking-wider">Citizen Portal</p>
          <h1 className="mt-1 font-outfit text-sm sm:text-base md:text-lg font-extrabold tracking-tight text-slate-805 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary shrink-0" />
            Notifications
            {unreadNotificationsCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-danger border border-red-200 uppercase font-outfit">
                {unreadNotificationsCount} Unread
              </span>
            )}
          </h1>
          <p className="mt-1 text-[10px] text-slate-450 leading-normal">Stay updated on your reported issues and AI analysis results.</p>
        </div>
        
        {/* Bulk notification operations */}
        <div className="flex flex-col xs:flex-row gap-2 shrink-0 select-none w-full sm:w-auto">
          {unreadNotificationsCount > 0 && (
            <button 
              onClick={handleMarkAllRead} 
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-button border border-slate-200 bg-white h-10 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer select-none"
            >
              <Check className="h-4 w-4 shrink-0 text-slate-450" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={handleDeleteAll} 
              className="flex-grow inline-flex items-center justify-center gap-1.5 rounded-button bg-red-50 border border-red-100 h-10 px-4.5 text-xs font-bold text-danger hover:bg-red-100/50 transition cursor-pointer select-none"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete all
            </button>
          )}
        </div>
      </header>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 select-none overflow-x-auto min-w-0">
        {['all', 'unread', 'read'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition relative border-b-2 -mb-[3px] shrink-0 cursor-pointer ${
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

      {/* Notification Lists viewport */}
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
        <div className="rounded-card border border-slate-150 bg-white p-10 text-center shadow-soft w-full min-w-0">
          <Inbox className="mx-auto h-9 w-9 text-slate-300 animate-pulse" />
          <h3 className="mt-3 font-outfit text-sm font-bold text-slate-805">You're all caught up!</h3>
          <p className="mt-0.5 text-xs text-slate-455">No notifications found under the "{filter}" filter.</p>
        </div>
      ) : (
        <div className="space-y-3 w-full min-w-0 max-h-[calc(100vh-14rem)] sm:max-h-[680px] overflow-y-auto pr-1 sm:pr-2">
          {filteredNotifications.map((notif) => {
            const id = notif._id || notif.id;
            return (
              <div 
                key={id}
                className={`rounded-card border border-slate-155 bg-white p-4 shadow-soft transition hover:shadow-premium flex gap-3 w-full min-w-0 ${
                  !notif.isRead ? 'bg-primary-light/5 border-primary/20' : ''
                } ${getPriorityStyle(notif.priority)}`}
              >
                {/* Icon badge */}
                <div className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-base ${
                  !notif.isRead ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                }`}>
                  {notif.icon || '🔔'}
                </div>

                {/* Message detail fields */}
                <div className="flex-grow min-w-0 w-full">
                  <div className="flex items-start justify-between gap-3 w-full min-w-0">
                    <div className="min-w-0 flex-grow w-full">
                      <h4 className={`text-xs font-bold text-slate-808 flex items-center gap-1.5 break-words ${
                        !notif.isRead ? 'font-extrabold' : ''
                      }`}>
                        {notif.title}
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" title="Unread notification marker" />
                        )}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">
                        {new Date(notif.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    
                    {/* Inline actions buttons */}
                    <div className="flex items-center gap-1 shrink-0 select-none">
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkRead(id)}
                          className="p-1 rounded-full text-slate-400 hover:text-primary hover:bg-slate-50 transition cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(id)}
                        className="p-1 rounded-full text-slate-400 hover:text-danger hover:bg-red-50 transition cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-655 leading-relaxed break-words font-medium pr-3">
                    {notif.message}
                  </p>

                  {/* Complaint links */}
                  {notif.complaint && (
                    <div className="mt-3 flex items-center gap-2 select-none">
                      <Link 
                        to={`/citizen/complaints/${notif.complaint}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        View Complaint details &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title={targetDeleteId ? 'Delete Notification' : 'Delete All Notifications'}
        message={
          targetDeleteId
            ? 'Are you sure you want to delete this notification?'
            : 'Are you sure you want to delete all notifications? This action cannot be undone.'
        }
        confirmText={targetDeleteId ? 'Delete' : 'Delete All'}
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
