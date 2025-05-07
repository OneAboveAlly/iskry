import React, { useState, useEffect } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import '../styles/AdminLayout.css';
import { useUnreadNotificationsCount } from './NotificationsCenter';
import Dashboard from '../pages/admin/Dashboard';
import UsersManagement from '../pages/admin/UsersManagement';
import AnnouncementsManagement from '../pages/admin/AnnouncementsManagement';
import MaterialsManagementPage from '../pages/admin/MaterialsManagement';
import PagesManagement from '../pages/admin/PagesManagement';
import PostsManagement from '../pages/admin/PostsManagement';
import CommentsManagement from '../pages/admin/CommentsManagement';
import SettingsManagement from '../pages/admin/SettingsManagement';
import TestPage from '../pages/admin/TestPage';
import AdminAvailabilityPage from '../pages/admin/AdminAvailabilityPage';
import BookingsManagement from '../pages/admin/BookingsManagement';
import NotificationsPage from '../pages/admin/NotificationsPage';

const AdminLayout: React.FC = () => {
  const unreadCount = useUnreadNotificationsCount();
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  
  useEffect(() => {
    const fetchPendingBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3001/api/bookings', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (res.ok) {
          const bookings = await res.json();
          
          // Consider both new bookings and urgent requests
          const pendingBookings = bookings.filter((booking: any) => 
            booking.status === 'booked' && new Date(booking.dateTime) > new Date()
          ).length;
          
          // Fetch urgent requests
          const urgentRes = await fetch('http://localhost:3001/api/urgent-request', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          
          if (urgentRes.ok) {
            const urgentRequests = await urgentRes.json();
            const pendingUrgentRequests = urgentRequests.filter((req: any) => 
              req.status === 'pending'
            ).length;
            
            setPendingBookingsCount(pendingBookings + pendingUrgentRequests);
          }
        }
      } catch (error) {
        console.error('Error fetching pending bookings count:', error);
      }
    };
    
    fetchPendingBookings();
    const interval = setInterval(fetchPendingBookings, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h2 className="admin-panel-title">Panel Admina</h2>
        <nav className="admin-nav">
          <NavLink 
            to="/admin" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
            end
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Pulpit
          </NavLink>
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Użytkownicy
          </NavLink>
          <NavLink 
            to="/admin/bookings" 
            className={({ isActive }) => isActive ? "admin-nav-item active bookings-nav-item" : "admin-nav-item bookings-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <circle cx="8" cy="14" r="2"></circle>
            </svg>
            Rezerwacje
            {pendingBookingsCount > 0 && (
              <span className="bookings-badge">{pendingBookingsCount}</span>
            )}
          </NavLink>
          <NavLink 
            to="/admin/announcements" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            Ogłoszenia
          </NavLink>
          <NavLink 
            to="/admin/materials" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Materiały PDF
          </NavLink>
          <NavLink 
            to="/admin/pages" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <line x1="12" y1="6" x2="16" y2="6"></line>
              <line x1="12" y1="10" x2="16" y2="10"></line>
              <line x1="12" y1="14" x2="16" y2="14"></line>
            </svg>
            Zarządzanie stronami
          </NavLink>
          <NavLink 
            to="/admin/posts" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Aktualności
          </NavLink>
          <NavLink 
            to="/admin/comments" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Komentarze
          </NavLink>
          <NavLink 
            to="/admin/settings" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Ustawienia
          </NavLink>
          <NavLink 
            to="/admin/availability" 
            className={({ isActive }) => isActive ? "admin-nav-item active" : "admin-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Zarządzaj dostępnością
          </NavLink>
          <NavLink 
            to="/admin/notifications" 
            className={({ isActive }) => isActive ? "admin-nav-item active notifications-nav-item" : "admin-nav-item notifications-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            Powiadomienia
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </NavLink>
        </nav>
      </div>
      <div className="admin-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="announcements" element={<AnnouncementsManagement />} />
          <Route path="materials" element={<MaterialsManagementPage />} />
          <Route path="pages" element={<PagesManagement />} />
          <Route path="posts" element={<PostsManagement />} />
          <Route path="comments" element={<CommentsManagement />} />
          <Route path="settings" element={<SettingsManagement />} />
          <Route path="test-editor" element={<TestPage />} />
          <Route path="availability" element={<AdminAvailabilityPage />} />
          <Route path="bookings" element={<BookingsManagement />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminLayout; 