import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authFetch, isAdmin } from '../../utils/auth';
import '../../styles/AdminDashboard.css';
import { useUnreadNotificationsCount } from '../../components/NotificationsCenter';

interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  totalAnnouncements: number;
  totalMaterials: number;
  totalPosts: number;
  totalBookings: number;
  urgentRequests: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const unreadNotificationsCount = useUnreadNotificationsCount();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingUsers: 0,
    totalAnnouncements: 0,
    totalMaterials: 0,
    totalPosts: 0,
    totalBookings: 0,
    urgentRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is admin, if not redirect
    if (!isAdmin()) {
      navigate('/login');
      return;
    }

    // Fetch basic stats for the dashboard
    const fetchStats = async () => {
      try {
        // Users stats
        const usersResponse = await authFetch('http://localhost:3001/api/admin/users');
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const pendingUsers = usersData.filter((user: any) => !user.approved).length;
          
          // Announcements stats
          const announcementsResponse = await authFetch('http://localhost:3001/api/announcements');
          
          let announcementsCount = 0;
          if (announcementsResponse.ok) {
            const announcementsData = await announcementsResponse.json();
            announcementsCount = announcementsData.length;
          }
          
          // Materials stats
          const materialsResponse = await authFetch('http://localhost:3001/api/materials');
          
          let materialsCount = 0;
          if (materialsResponse.ok) {
            const materialsData = await materialsResponse.json();
            materialsCount = materialsData.length;
          }
          
          // Posts stats
          const postsResponse = await authFetch('http://localhost:3001/api/posts');
          
          let postsCount = 0;
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();
            // Handle both array and object response formats
            const postsArray = Array.isArray(postsData) ? postsData : postsData.posts || [];
            // Count only published posts (posts with publishedAt date in the past or present)
            postsCount = postsArray.filter((post: any) => {
              const publishDate = new Date(post.publishedAt);
              const now = new Date();
              return publishDate <= now;
            }).length;
          }
          
          // Bookings stats
          const bookingsResponse = await authFetch('http://localhost:3001/api/bookings');
          
          let bookingsCount = 0;
          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            // Count only active bookings
            bookingsCount = bookingsData.filter((booking: any) => booking.status === 'booked').length;
          }
          
          // Urgent requests stats
          const urgentRequestsResponse = await authFetch('http://localhost:3001/api/urgent-request');
          
          let urgentRequestsCount = 0;
          if (urgentRequestsResponse.ok) {
            const urgentRequestsData = await urgentRequestsResponse.json();
            // Count only pending urgent requests
            urgentRequestsCount = urgentRequestsData.filter((request: any) => request.status === 'pending').length;
          }
          
          setStats({
            totalUsers: usersData.length,
            pendingUsers,
            totalAnnouncements: announcementsCount,
            totalMaterials: materialsCount,
            totalPosts: postsCount,
            totalBookings: bookingsCount,
            urgentRequests: urgentRequestsCount
          });
        } else if (usersResponse.status === 401) {
          // If unauthorized, redirect to login
          navigate('/login');
        } else {
          setError('Błąd podczas pobierania statystyk');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Błąd podczas pobierania statystyk');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Ładowanie statystyk...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Panel administracyjny</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.totalUsers}</h2>
            <p className="stat-label">Użytkowników</p>
          </div>
          <Link to="/admin/users" className="stat-link">Zarządzaj &rarr;</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.pendingUsers}</h2>
            <p className="stat-label">Oczekujących użytkowników</p>
          </div>
          <Link to="/admin/users" className="stat-link">Zatwierdź &rarr;</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon announcements-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.totalAnnouncements}</h2>
            <p className="stat-label">Ogłoszeń</p>
          </div>
          <Link to="/admin/announcements" className="stat-link">Zarządzaj &rarr;</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon materials-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.totalMaterials}</h2>
            <p className="stat-label">Materiałów PDF</p>
          </div>
          <Link to="/admin/materials" className="stat-link">Zarządzaj &rarr;</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon posts-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
              <path d="M18 14h-8"></path>
              <path d="M15 18h-5"></path>
              <path d="M10 6h8v4h-8V6Z"></path>
            </svg>
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.totalPosts}</h2>
            <p className="stat-label">Postów w aktualnościach</p>
          </div>
          <Link to="/admin/posts" className="stat-link">Zarządzaj &rarr;</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon bookings-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{stats.totalBookings}</h2>
            <p className="stat-label">Rezerwacji</p>
            {stats.urgentRequests > 0 && (
              <p className="stat-sublabel urgent-requests">
                w tym <span className="urgent-count">{stats.urgentRequests}</span> pilnych próśb
              </p>
            )}
          </div>
          <Link to="/admin/bookings" className="stat-link">Zarządzaj &rarr;</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon notifications-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div className="stat-content">
            <h2 className="stat-value">{unreadNotificationsCount}</h2>
            <p className="stat-label">Nieprzeczytanych powiadomień</p>
          </div>
          <Link to="/admin/notifications" className="stat-link">Zarządzaj &rarr;</Link>
        </div>
      </div>
      
      <h2 className="dashboard-section-title">Szybkie akcje</h2>
      
      <div className="quick-actions-grid">
        <Link to="/admin/users/new" className="quick-action-card">
          <div className="quick-action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <div className="quick-action-title">Dodaj ucznia</div>
        </Link>
        
        <Link to="/admin/announcements/new" className="quick-action-card">
          <div className="quick-action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div className="quick-action-title">Dodaj ogłoszenie</div>
        </Link>
        
        <Link to="/admin/materials/upload" className="quick-action-card">
          <div className="quick-action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="quick-action-title">Dodaj materiał PDF</div>
        </Link>
        
        <Link to="/admin/posts/new" className="quick-action-card">
          <div className="quick-action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
          <div className="quick-action-title">Dodaj post</div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard; 