import React, { useEffect, useState, useCallback } from 'react';
import '../styles/Admin.css';
import '../styles/NotificationsCenter.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  type?: string; // Optional notification type
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
  postId?: number;
  archived?: boolean;
}

// Create a custom event for notification updates
export const NOTIFICATION_UPDATE_EVENT = 'notification-count-update';

export function useUnreadNotificationsCount() {
  const [count, setCount] = useState(0);
  const { isAuthenticated } = useAuth();
  
  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/notifications', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.filter((n: Notification) => !n.isRead && !n.archived).length);
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    fetchCount();
    
    // Set up interval for periodic updates
    const interval = setInterval(fetchCount, 30000);
    
    // Listen for notification update events
    const handleNotificationUpdate = () => {
      fetchCount();
    };
    
    window.addEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
    };
  }, [fetchCount]);
  
  return count;
}

type ViewFilter = 'all' | 'unread' | 'archived';
type TypeFilter = 'all' | 'urgent' | 'booking' | 'comment' | 'material';

const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // auto-refresh co 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/notifications', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.status === 401) {
        setError('Brak autoryzacji do pobierania powiadomień');
        setNotifications([]);
        return;
      }
      if (!res.ok) throw new Error('Błąd pobierania powiadomień');
      const data = await res.json();
      setNotifications(data);
      setError('');
    } catch (err) {
      setError('Błąd pobierania powiadomień');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to trigger notification count update
  const triggerCountUpdate = () => {
    // Dispatch custom event to update counts
    window.dispatchEvent(new Event(NOTIFICATION_UPDATE_EVENT));
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      
      // Trigger count update
      triggerCountUpdate();
    } catch (err) {
      setError('Błąd oznaczania powiadomienia');
      console.error('Error marking notification as read:', err);
    }
  };
  
  const archiveNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to archive notification');
      }
      
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, archived: true } : n));
      
      // Trigger count update
      triggerCountUpdate();
    } catch (err) {
      setError('Błąd archiwizowania powiadomienia');
      console.error('Error archiving notification:', err);
    }
  };
  
  const unarchiveNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/unarchive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to unarchive notification');
      }
      
      setNotifications((prev) => prev.map(n => n.id === id ? { ...n, archived: false } : n));
      
      // Trigger count update
      triggerCountUpdate();
    } catch (err) {
      setError('Błąd przywracania powiadomienia');
      console.error('Error unarchiving notification:', err);
    }
  };

  const getNotificationTypeClass = (notification: Notification) => {
    if (notification.content.includes('PILNA PROŚBA')) {
      return 'urgent';
    }
    if (notification.content.includes('rezerwacja') || notification.content.includes('spotkanie')) {
      return 'booking';
    }
    if (notification.content.includes('komentarz')) {
      return 'comment';
    }
    if (notification.content.includes('materiał')) {
      return 'material';
    }
    return '';
  };

  const getNotificationType = (notification: Notification) => {
    if (notification.content.includes('PILNA PROŚBA')) {
      return 'urgent';
    }
    if (notification.content.includes('rezerwacja') || notification.content.includes('spotkanie')) {
      return 'booking';
    }
    if (notification.content.includes('komentarz')) {
      return 'comment';
    }
    if (notification.content.includes('materiał')) {
      return 'material';
    }
    return 'other';
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.content.includes('PILNA PROŚBA')) {
      return '⚠️';
    }
    if (notification.content.includes('rezerwacja') || notification.content.includes('spotkanie')) {
      return '📅';
    }
    if (notification.content.includes('komentarz')) {
      return '💬';
    }
    if (notification.content.includes('materiał')) {
      return '📄';
    }
    return '🔔';
  };

  const handleNotificationAction = (notification: Notification) => {
    // Handle navigation based on notification type
    if (notification.postId) {
      navigate(`/posts/${notification.postId}`);
    } else if (notification.content.includes('rezerwacja') || notification.content.includes('spotkanie')) {
      navigate(user?.isAdmin ? '/admin/bookings' : '/student/rezerwacje');
    } else if (notification.content.includes('materiał')) {
      navigate(user?.isAdmin ? '/admin/materials' : '/student/materialy');
    } else if (notification.content.includes('PILNA PROŚBA')) {
      navigate(user?.isAdmin ? '/admin/urgent-requests' : '/student/rezerwacje');
    }
    
    // Mark as read when action is taken
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };
  
  const filteredNotifications = notifications.filter(notification => {
    // Apply view filter (all, unread, archived)
    if (viewFilter === 'unread') return !notification.isRead && !notification.archived;
    if (viewFilter === 'archived') return !!notification.archived;
    if (viewFilter === 'all') return !notification.archived;
    return true;
  }).filter(notification => {
    // Apply type filter (all, urgent, booking, comment, material)
    if (typeFilter === 'all') return true;
    return getNotificationType(notification) === typeFilter;
  }).filter(notification => {
    // Apply search filter if search term exists
    if (!searchTerm) return true;
    return notification.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      
      // Trigger count update
      triggerCountUpdate();
    } catch (err) {
      setError('Błąd oznaczania powiadomień');
      console.error('Error marking all notifications as read:', err);
    }
  };

  const archiveAllDisplayed = async () => {
    try {
      if (filteredNotifications.length === 0) return;
      
      const notificationIds = filteredNotifications.map(notification => notification.id);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/notifications/archive-multiple`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ids: notificationIds })
      });
      
      if (!response.ok) {
        throw new Error('Failed to archive notifications');
      }
      
      const result = await response.json();
      console.log(`Successfully archived ${result.count} notifications`);
      
      // Update local state to mark these notifications as archived
      setNotifications((prev) => prev.map(n => 
        notificationIds.includes(n.id) ? { ...n, archived: true } : n
      ));
      
      // Trigger count update
      triggerCountUpdate();
    } catch (err) {
      setError('Błąd archiwizowania powiadomień');
      console.error('Error archiving all notifications:', err);
    }
  };

  // Handle clear filters button
  const clearFilters = () => {
    setViewFilter('all');
    setTypeFilter('all');
    setSearchTerm('');
  };

  // Determine if any filters are active
  const hasActiveFilters = viewFilter !== 'all' || typeFilter !== 'all' || searchTerm !== '';

  return (
    <div className="notifications-center">
      <div className="notifications-header">
        <h2>Powiadomienia</h2>
        
        <div className="notifications-search">
          <input
            type="text"
            placeholder="Szukaj w powiadomieniach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      <div className="notifications-filters">
        <div className="filter-group view-filters">
          <span className="filter-label">Widok:</span>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${viewFilter === 'all' ? 'active' : ''}`} 
              onClick={() => setViewFilter('all')}
            >
              Wszystkie
            </button>
            <button 
              className={`filter-btn ${viewFilter === 'unread' ? 'active' : ''}`} 
              onClick={() => setViewFilter('unread')}
            >
              Nieprzeczytane
            </button>
            <button 
              className={`filter-btn ${viewFilter === 'archived' ? 'active' : ''}`} 
              onClick={() => setViewFilter('archived')}
            >
              Archiwum
            </button>
          </div>
        </div>
        
        <div className="filter-group type-filters">
          <span className="filter-label">Typ:</span>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`} 
              onClick={() => setTypeFilter('all')}
            >
              Wszystkie
            </button>
            <button 
              className={`filter-btn urgent-filter ${typeFilter === 'urgent' ? 'active' : ''}`} 
              onClick={() => setTypeFilter('urgent')}
            >
              Pilne
            </button>
            <button 
              className={`filter-btn booking-filter ${typeFilter === 'booking' ? 'active' : ''}`} 
              onClick={() => setTypeFilter('booking')}
            >
              Rezerwacje
            </button>
            <button 
              className={`filter-btn comment-filter ${typeFilter === 'comment' ? 'active' : ''}`} 
              onClick={() => setTypeFilter('comment')}
            >
              Komentarze
            </button>
            <button 
              className={`filter-btn material-filter ${typeFilter === 'material' ? 'active' : ''}`} 
              onClick={() => setTypeFilter('material')}
            >
              Materiały
            </button>
          </div>
        </div>
        
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Wyczyść filtry
          </button>
        )}
      </div>
      
      <div className="notifications-actions">
        {viewFilter !== 'archived' && (
          <button className="action-btn mark-all-read" onClick={markAllAsRead}>
            Oznacz wszystko jako przeczytane
          </button>
        )}
        {viewFilter !== 'archived' && filteredNotifications.length > 0 && (
          <button className="action-btn archive-all" onClick={archiveAllDisplayed}>
            Archiwizuj wyświetlone
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="notifications-loading">Ładowanie powiadomień...</div>
      ) : error ? (
        <div className="notifications-error">{error}</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="notifications-empty">
          {hasActiveFilters 
            ? 'Brak powiadomień spełniających kryteria wyszukiwania' 
            : (viewFilter === 'archived' as ViewFilter) ? 'Brak zarchiwizowanych powiadomień' : 'Brak powiadomień'}
        </div>
      ) : (
        <ul className="notifications-list">
          {filteredNotifications.map(notification => {
            const typeClass = getNotificationTypeClass(notification);
            const icon = getNotificationIcon(notification);
            
            return (
              <li 
                key={notification.id} 
                className={`notification-item ${notification.isRead ? 'read' : ''} ${typeClass} ${notification.archived ? 'archived' : ''}`}
                onClick={() => handleNotificationAction(notification)}
              >
                <div className="notification-icon">{icon}</div>
                <div className="notification-content">
                  <div className="notification-message">
                    <span className="notification-text">{notification.content}</span>
                    <span className="notification-date">
                      {new Date(notification.createdAt).toLocaleString('pl-PL')}
                    </span>
                  </div>
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button 
                        className="mark-read-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        Oznacz jako przeczytane
                      </button>
                    )}
                    {!notification.archived ? (
                      <button 
                        className="archive-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveNotification(notification.id);
                        }}
                      >
                        Archiwizuj
                      </button>
                    ) : (
                      <button 
                        className="unarchive-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          unarchiveNotification(notification.id);
                        }}
                      >
                        Przywróć
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NotificationsCenter; 