import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';
import { toast } from '../components/Toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlinePlumbers, setOnlinePlumbers] = useState({});
  const bookingListenersRef = useRef(new Map());

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (isAuthenticated && user?.token) {
      const socket = socketService.connect(user.token);

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      // Presence: bulk state on connect
      const handlePresenceBulk = ({ plumbers }) => {
        setOnlinePlumbers(plumbers || {});
      };

      // Presence: individual updates
      const handlePresenceUpdate = ({ plumberId, status }) => {
        setOnlinePlumbers(prev => {
          const next = { ...prev };
          if (status === 'offline') {
            delete next[plumberId];
          } else {
            next[plumberId] = status;
          }
          return next;
        });
      };

      // New booking notification (for plumbers)
      const handleNewBooking = (data) => {
        toast(`📋 New booking from ${data.customerName || 'a customer'}!`, 'success');
      };

      // Booking status update notification
      const handleStatusUpdate = (data) => {
        const statusMessages = {
          accepted: '✅ Your booking has been accepted!',
          completed: '🎉 Your service has been marked as completed!',
          cancelled: '❌ A booking has been cancelled.',
        };
        const msg = statusMessages[data.status];
        if (msg) {
          toast(msg, data.status === 'cancelled' ? 'error' : 'success');
        }

        // Notify any registered booking listeners
        bookingListenersRef.current.forEach((callback) => {
          callback(data);
        });
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('presence:bulk', handlePresenceBulk);
      socket.on('presence:update', handlePresenceUpdate);
      socket.on('booking:new', handleNewBooking);
      socket.on('booking:statusUpdate', handleStatusUpdate);

      // If already connected (fast reconnect)
      if (socket.connected) setIsConnected(true);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('presence:bulk', handlePresenceBulk);
        socket.off('presence:update', handlePresenceUpdate);
        socket.off('booking:new', handleNewBooking);
        socket.off('booking:statusUpdate', handleStatusUpdate);
      };
    } else {
      socketService.disconnect();
      setIsConnected(false);
      setOnlinePlumbers({});
    }
  }, [isAuthenticated, user?.token]);

  // Register a booking update listener (used by dashboards)
  const onBookingUpdate = useCallback((id, callback) => {
    bookingListenersRef.current.set(id, callback);
    return () => bookingListenersRef.current.delete(id);
  }, []);

  const value = useMemo(() => ({
    isConnected,
    onlinePlumbers,
    onBookingUpdate,
    socket: socketService,
  }), [isConnected, onlinePlumbers, onBookingUpdate]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
