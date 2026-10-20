import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useApp } from './AppContext';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { getSocketUrl } from '../utils/network';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isSignedIn } = useAuth();
  const { dbUser, setDbUser, setNotifications, setUnreadNotificationsCount } = useApp();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isSignedIn || !dbUser?.clerkId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = getSocketUrl();

    console.log('🔌 Initializing socket connection to:', socketUrl);
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      newSocket.emit('join', dbUser.clerkId);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Disconnecting socket...');
      newSocket.emit('leave', dbUser.clerkId);
      newSocket.disconnect();
    };
  }, [isSignedIn, dbUser?.clerkId]);

  // Periodic Worker GPS heartbeat to keep liveLocation fresh and prevent auto-offline status updates
  useEffect(() => {
    if (!socket || !isSignedIn || dbUser?.role !== 'Worker') return;

    console.log('🛰️ Starting periodic GPS tracking heartbeat for Worker...');

    const sendLocationHeartbeat = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const payload = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString(),
            address: 'Live Location Update'
          };
          console.log('🛰️ Emitting Worker GPS location heartbeat:', payload);
          socket.emit('worker-location', payload);
        },
        (error) => {
          console.warn('🛰️ Heartbeat geolocation failed:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Send immediately on startup
    sendLocationHeartbeat();

    // Track periodically every 60 seconds
    const heartbeatInterval = setInterval(sendLocationHeartbeat, 60000);

    return () => {
      console.log('🛰️ Stopping periodic GPS tracking heartbeat...');
      clearInterval(heartbeatInterval);
    };
  }, [socket, isSignedIn, dbUser?.role]);

  // Synchronize worker availability in real-time
  useEffect(() => {
    if (!socket) return;

    const handleAvailabilityUpdate = (data) => {
      console.log('🔄 Worker availability updated event:', data);
      if (data?.clerkId === dbUser?.clerkId || data?.workerId === dbUser?._id) {
        setDbUser((prev) => (prev ? { ...prev, availability: data.availability } : prev));
      }
    };

    socket.on('worker-availability-updated', handleAvailabilityUpdate);
    return () => {
      socket.off('worker-availability-updated', handleAvailabilityUpdate);
    };
  }, [socket, dbUser?.clerkId, dbUser?._id, setDbUser]);

  // Global notification listener
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      console.log('🔔 Received notification event:', data);
      
      const id = data.id || data._id;
      
      // Update notifications list state
      setNotifications((prev) => {
        if (prev.some((n) => n._id === id)) return prev;
        
        // Normalize payload structure
        const normalized = {
          _id: id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority || 'Medium',
          actionUrl: data.actionUrl || '',
          icon: data.icon || '🔔',
          isRead: data.isRead || false,
          createdAt: data.createdAt || new Date().toISOString(),
          complaint: data.complaint,
        };
        return [normalized, ...prev];
      });

      setUnreadNotificationsCount((prev) => prev + 1);

      // Display Toast
      toast.info(
        <div className="flex flex-col">
          <span className="font-bold text-xs">{data.title}</span>
          <span className="text-[11px] mt-0.5">{data.message}</span>
        </div>,
        {
          icon: data.icon || '🔔',
          closeOnClick: true,
          pauseOnHover: true,
        }
      );
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, setNotifications, setUnreadNotificationsCount]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
