import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import '../styles/NotificationBell.css';
import { useNavigate } from 'react-router-dom';
import { NOTIFICATION_UPDATE_EVENT } from './NotificationsCenter';

interface Notification {
  id: number;
  content: string;
  isRead: boolean;
  postId: number | null;
  createdAt: string;
  archived?: boolean;
  user: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
  post?: {
    id: number;
    title: string;
    content: string;
    imageUrl: string | null;
    publishedAt: string;
    author: {
      id: number;
      name: string;
      surname: string;
      email: string;
    };
  };
}

const NotificationBell: React.FC = () => {
  const { isAuthenticated, token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hiddenNotifications, setHiddenNotifications] = useState<number[]>(() => {
    // Odczytaj ukryte powiadomienia z localStorage
    const savedHidden = localStorage.getItem('hiddenNotifications');
    return savedHidden ? JSON.parse(savedHidden) : [];
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  // Zapisuj ukryte powiadomienia do localStorage
  useEffect(() => {
    localStorage.setItem('hiddenNotifications', JSON.stringify(hiddenNotifications));
  }, [hiddenNotifications]);

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Connect to socket server with correct URL based on current domain
      const socketUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:3001';
      
      console.log('Connecting to socket server at:', socketUrl);
      socketRef.current = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
      // Handle connection events
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        // Authenticate with socket after connection
        socketRef.current?.emit('authenticate', user.id);
      });
      
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
      
      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
      
      // Listen for new notifications
      socketRef.current.on('new_notification', (notification: Notification) => {
        console.log('Received new notification:', notification);
        
        // Add the new notification to the list
        setNotifications(prev => [notification, ...prev]);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Optional: Show browser notification
        if (Notification.permission === 'granted') {
          new Notification('Nowe powiadomienie', {
            body: notification.content
          });
        }
      });
      
      return () => {
        // Clean up socket connection on unmount
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [isAuthenticated, user?.id]);

  // Ask for notification permission when component mounts
  useEffect(() => {
    if (isAuthenticated && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) {
      console.log('Cannot fetch notifications: not authenticated or no token');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching notifications from API...');
      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch notifications:', response.status, response.statusText);
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      console.log('Received notifications:', data.map((n: any) => ({
        id: n.id,
        content: n.content,
        isRead: n.isRead,
        postId: n.postId,
        archived: n.archived,
        createdAt: n.createdAt,
        user: n.user,
        post: n.post
      })));
      
      // Filter out archived notifications AND locally hidden notifications
      const filteredNotifications = data.filter((n: Notification) => 
        !n.archived && !hiddenNotifications.includes(n.id)
      );
      
      setNotifications(filteredNotifications);
      
      // Count unread notifications that are neither archived nor hidden
      const unread = filteredNotifications.filter((notif: Notification) => !notif.isRead).length;
      console.log('Unread notifications count:', unread);
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on component mount and when auth state changes
  useEffect(() => {
    console.log('Auth state changed, isAuthenticated:', isAuthenticated, 'user:', user);
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, token]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle notification dropdown
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // Listen for notification update events from NotificationsCenter
  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log('Notification update event received, refreshing notifications');
      fetchNotifications();
    };
    
    window.addEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
    
    return () => {
      window.removeEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
    };
  }, []);

  // Mark notification as read - updated function
  const markAsRead = async (id: number) => {
    if (!token) {
      console.log('Cannot mark notification as read: no token');
      return;
    }

    try {
      console.log(`Marking notification ${id} as read...`);
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to mark notification as read:', response.status, response.statusText);
        throw new Error('Failed to mark notification as read');
      }
      
      console.log(`Successfully marked notification ${id} as read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => {
          if (notif.id === id) {
            console.log(`Updating notification ${id} in local state to read`);
            return { ...notif, isRead: true };
          }
          return notif;
        })
      );
      
      // Update unread count
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        console.log(`Updated unread count from ${prev} to ${newCount}`);
        return newCount;
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Ukryj powiadomienie tylko w dzwoneczku (bez archiwizowania w bazie danych)
  const hideNotificationLocally = (id: number) => {
    try {
      // Dodaj ID powiadomienia do listy ukrytych
      setHiddenNotifications(prev => [...prev, id]);
      
      // Usuń powiadomienie z lokalnego stanu (tylko w dzwoneczku)
      const notifToHide = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Aktualizuj licznik nieprzeczytanych, jeśli powiadomienie było nieprzeczytane
      if (notifToHide && !notifToHide.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      console.log(`Notification ${id} hidden locally from bell dropdown`);
    } catch (err) {
      console.error('Error hiding notification locally:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    
    if (diffMin < 1) return 'Przed chwilą';
    if (diffMin < 60) return `${diffMin} minut temu`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} godzin temu`;
    
    return date.toLocaleDateString('pl-PL');
  };

  // Updated - Navigate to post when clicking on a notification
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // First mark as read
      await markAsRead(notification.id);
      
      // Navigate based on notification type (logic similar to NotificationsCenter)
      if (notification.postId) {
        navigate(`/posts/${notification.postId}`);
      } else if (notification.content.includes('rezerwacja') || notification.content.includes('spotkanie')) {
        navigate(user?.isAdmin ? '/admin/bookings' : '/student/rezerwacje');
      } else if (notification.content.includes('materiał')) {
        navigate(user?.isAdmin ? '/admin/materials' : '/student/materialy');
      } else if (notification.content.includes('PILNA PROŚBA')) {
        navigate(user?.isAdmin ? '/admin/urgent-requests' : '/student/rezerwacje');
      }
      
      // Close the dropdown after clicking
      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="notification-bell-container" ref={notificationRef}>
      <button 
        className="notification-bell-button" 
        onClick={toggleNotifications}
        aria-label="Notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Powiadomienia</h3>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read-button"
                onClick={markAllAsRead}
              >
                Oznacz wszystkie jako przeczytane
              </button>
            )}
          </div>
          
          <div className="notification-list-scrollable">
            {loading ? (
              <div className="notification-loading">Ładowanie powiadomień...</div>
            ) : error ? (
              <div className="notification-error">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">Brak powiadomień</div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-message">{notification.content}</div>
                    <div className="notification-date">{formatDate(notification.createdAt)}</div>
                  </div>
                  <button 
                    className="hide-notification-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      hideNotificationLocally(notification.id);
                    }}
                    aria-label="Ukryj powiadomienie"
                    title="Ukryj z dzwoneczka"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="notification-footer">
            <button 
              className="view-all-notifications-button"
              onClick={() => {
                navigate(user?.isAdmin ? '/admin/notifications' : '/student/powiadomienia');
                setIsOpen(false);
              }}
            >
              Zobacz wszystkie powiadomienia
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 