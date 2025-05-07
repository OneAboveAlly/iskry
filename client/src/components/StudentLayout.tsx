import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import '../styles/StudentLayout.css';
import Announcements from '../pages/student/Announcements';
import Materials from '../pages/student/Materials';
import Bookings from '../pages/student/Bookings';
import StudentNotifications from '../pages/student/StudentNotifications';
import { useUnreadNotificationsCount } from './NotificationsCenter';

const StudentLayout: React.FC = () => {
  const unreadCount = useUnreadNotificationsCount();
  
  return (
    <div className="student-layout">
      <div className="student-sidebar">
        <h2 className="student-panel-title">Panel Ucznia</h2>
        <nav className="student-nav">
          <NavLink 
            to="/student" 
            className={({ isActive }) => isActive ? "student-nav-item active" : "student-nav-item"}
            end
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
            Ogłoszenia
          </NavLink>
          <NavLink 
            to="/student/materialy" 
            className={({ isActive }) => isActive ? "student-nav-item active" : "student-nav-item"}
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
            to="/student/rezerwacje" 
            className={({ isActive }) => isActive ? "student-nav-item active" : "student-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Rezerwacje
          </NavLink>
          <NavLink 
            to="/student/powiadomienia" 
            className={({ isActive }) => isActive ? "student-nav-item active notifications-nav-item" : "student-nav-item notifications-nav-item"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            Powiadomienia
            {unreadCount > 0 && (
              <span className="student-notification-badge">{unreadCount}</span>
            )}
          </NavLink>
        </nav>
      </div>
      <div className="student-content">
        <Routes>
          <Route path="/" element={<Announcements />} />
          <Route path="materialy" element={<Materials />} />
          <Route path="rezerwacje" element={<Bookings />} />
          <Route path="powiadomienia" element={<StudentNotifications />} />
        </Routes>
      </div>
    </div>
  );
};

export default StudentLayout; 