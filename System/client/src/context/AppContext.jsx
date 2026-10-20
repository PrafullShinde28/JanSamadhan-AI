import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import api from '../api/client';
import { authApi } from '../api/auth.api';
import { notificationApi } from '../api/notification.api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { getToken, userId, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Set up request interceptor to attach Clerk JWT token automatically
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        if (isSignedIn) {
          const token = await getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          if (userId) {
            config.headers['X-Dev-Clerk-Id'] = userId;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [isSignedIn, getToken, userId]);

  // Sync user with Mongoose DB
  const syncUser = async () => {
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    if (!isSignedIn || !clerkUser || !email) return false;
    try {
      setLoading(true);
      console.log('🌐 [Auth Sync] Initiating user sync:');
      console.log('  • Frontend Origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');
      console.log('  • Clerk User ID:', clerkUser.id);
      console.log('  • Email:', email);
      
      const invitationToken = localStorage.getItem('invitationToken');
      const res = await authApi.sync({
        name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Citizen User',
        email,
        profileImage: clerkUser.imageUrl,
        ...(invitationToken && { token: invitationToken })
      });
      
      console.log('✅ [Auth Sync] Successful. Role:', res.data.data?.role);
      setDbUser(res.data.data);
      if (invitationToken) {
        localStorage.removeItem('invitationToken');
      }
      return true;
    } catch (err) {
      console.error('❌ [Auth Sync Error]:', err.message);
      toast.error(`Authentication sync error: ${err.message}`);
      setDbUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch in-app notifications
  const fetchNotifications = async () => {
    if (!isSignedIn || !dbUser) return;
    try {
      const res = await notificationApi.list();
      if (res.data.success) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter(n => !n.isRead).length;
        setUnreadNotificationsCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Mark single notification as read
  const markNotificationRead = async (id) => {
    try {
      const res = await notificationApi.markRead(id);
      if (res.data.success) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      const res = await notificationApi.markAllRead();
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadNotificationsCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  // Delete single notification
  const deleteNotification = async (id) => {
    try {
      const res = await notificationApi.remove(id);
      if (res.data.success) {
        setNotifications(prev => {
          const target = prev.find(n => n._id === id);
          if (target && !target.isRead) {
            setUnreadNotificationsCount(count => Math.max(0, count - 1));
          }
          return prev.filter(n => n._id !== id);
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const res = await notificationApi.removeAll();
      if (res.data.success) {
        setNotifications([]);
        setUnreadNotificationsCount(0);
      }
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  };

  // Trigger sync on sign-in status change
  useEffect(() => {
    if (isSignedIn && clerkUser?.primaryEmailAddress?.emailAddress) {
      syncUser();
    } else {
      setDbUser(null);
      if (!isSignedIn) {
        setNotifications([]);
        setUnreadNotificationsCount(0);
        setLoading(false);
      }
    }
  }, [isSignedIn, clerkUser?.id, clerkUser?.primaryEmailAddress?.emailAddress]);

  // Fetch notifications on user load or every 30 seconds
  useEffect(() => {
    if (isSignedIn && dbUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isSignedIn, dbUser]);

  return (
    <AppContext.Provider value={{
      dbUser,
      setDbUser,
      syncUser,
      loading,
      notifications,
      setNotifications,
      unreadNotificationsCount,
      setUnreadNotificationsCount,
      fetchNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      deleteAllNotifications
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
