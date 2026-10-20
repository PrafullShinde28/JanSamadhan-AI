import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Bell, Check, Trash2, ExternalLink, Inbox } from 'lucide-react';
import { toast } from 'react-toastify';
import WorkerNotificationsSkeleton from '../components/skeletons/WorkerNotificationsSkeleton';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function WorkerNotifications() {
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
    <div className="p-4 md:p-6 space-y-5">
      {/* Header Panel */}
      <header className="flex flex-col gap-4 rounded-card border border-slate-100 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold text-primary font-outfit uppercase tracking-wider">Worker Portal</p>
          <h1 className="mt-1 font-outfit text-base md:text-lg font-extrabold tracking-tight text-slate-805 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            Alerts Log
            {unreadNotificationsCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-danger border border-red-200">
                {unreadNotificationsCount} unread
              </span>
            )}
          </h1>
          <p className="mt-1 text-[10px] text-slate-400">Track task assignments, status revisions, and administrative details.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2 sm:pt-0">
          {unreadNotificationsCount > 0 && (
            <button 
              onClick={handleMarkAllRead} 
              className="inline-flex items-center justify-center gap-1.5 rounded-button border border-slate-200 bg-white px-3 h-10 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer select-none"
            >
              <Check className="h-4 w-4" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={handleDeleteAll} 
              className="inline-flex items-center justify-center gap-1.5 rounded-button bg-red-50 px-3.5 h-10 text-xs font-bold text-danger border border-red-100 hover:bg-red-100/50 transition cursor-pointer select-none"
            >
              <Trash2 className="h-4 w-4" />
              Delete all
            </button>
          )}
        </div>
      </header>

      {/* Filters Toolbar */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-0.5 w-full">
        {['all', 'unread', 'read'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition relative border-b-2 -mb-[2px] ${
              filter === tab 
                ? 'border-primary text-primary font-extrabold' 
                : 'border-transparent text-slate-400 hover:text-slate-655'
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

      {/* Content list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-card p-4 animate-pulse motion-reduce:animate-none flex gap-3">
              <div className="rounded-full bg-slate-200 h-9 w-9 shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-card border border-slate-100 bg-white p-12 text-center shadow-soft">
          <Inbox className="mx-auto h-10 w-10 text-slate-300 animate-bounce" />
          <h3 className="mt-3 font-outfit text-xs font-bold text-slate-700">No Alerts Found</h3>
          <p className="mt-0.5 text-[10px] text-slate-400">No notifications found matching filter requirements.</p>
        </div>
      ) : (
        <div className="space-y-3 w-full min-w-0 max-h-[calc(100vh-14rem)] sm:max-h-[680px] overflow-y-auto pr-1 sm:pr-2">
          {filteredNotifications.map((notif) => {
            const id = notif._id || notif.id;
            return (
              <div 
                key={id}
                className={`rounded-card border border-slate-100 bg-white p-4 shadow-soft transition hover:shadow-premium flex gap-3 ${
                  !notif.isRead ? 'bg-primary/5 border-primary/10' : ''
                } ${getPriorityStyle(notif.priority)}`}
              >
                {/* Icon badge */}
                <div className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-base ${
                  !notif.isRead ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                }`}>
                  {notif.icon || '🔔'}
                </div>

                {/* Message Details */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className={`text-xs md:text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate ${
                        !notif.isRead ? 'font-extrabold text-slate-900' : ''
                      }`}>
                        {notif.title}
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Action buttons with 44px+ touch heights */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkRead(id)}
                          className="w-8 h-8 rounded-full text-slate-400 hover:text-primary hover:bg-slate-50 transition flex items-center justify-center cursor-pointer select-none"
                          title="Mark as read"
                        >
                          <Check className="h-4.5 w-4.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(id)}
                        className="w-8 h-8 rounded-full text-slate-400 hover:text-danger hover:bg-red-50/50 transition flex items-center justify-center cursor-pointer select-none"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pr-2 font-medium break-words">
                    {notif.message}
                  </p>

                  {/* Nav Link */}
                  {notif.complaint && (
                    <div className="mt-2.5 pt-2 border-t border-slate-50">
                      <Link 
                        to={`/worker/complaints/${notif.complaint}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline transition uppercase font-outfit"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Task details
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
