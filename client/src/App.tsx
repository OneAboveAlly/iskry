import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Setup from './pages/Setup';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import StudentLayout from './components/StudentLayout';
import Dashboard from './pages/admin/Dashboard';
import UsersManagement from './pages/admin/UsersManagement';
import AnnouncementsManagement from './pages/admin/AnnouncementsManagement';
import MaterialsManagementPage from './pages/admin/MaterialsManagement';
import PagesManagement from './pages/admin/PagesManagement';
import PostsManagement from './pages/admin/PostsManagement';
import CommentsManagement from './pages/admin/CommentsManagement';
import SettingsManagement from './pages/admin/SettingsManagement';
import TestPage from './pages/admin/TestPage';
import Announcements from './pages/student/Announcements';
import Materials from './pages/student/Materials';
import Bookings from './pages/student/Bookings';
import ContentPage from './pages/ContentPage';
import YouTube from './pages/YouTube';
import ContactPage from './pages/ContactPage';
import AdminAvailabilityPage from './pages/admin/AdminAvailabilityPage';
import BookingsManagement from './pages/admin/BookingsManagement';
import NotificationsPage from './pages/admin/NotificationsPage';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const PrivateRoute = ({ children, requireAdmin = false }: PrivateRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user?.isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/check-installation');
        const data = await response.json();
        setIsInstalled(data.isInstalled);
      } catch (error) {
        console.error('Error checking installation:', error);
        setIsInstalled(false);
      }
    };

    checkInstallation();
  }, []);

  // Editor visibility check on app load
  useEffect(() => {
    const checkEditorVisibility = () => {
      console.log("Checking editor visibility");
      try {
        // Check if the editor components are visible
        const editorElements = document.querySelectorAll('.ql-toolbar, .ql-container, .ql-editor, .quill, .react-quill, .enhanced-quill-editor');
        let visibilityIssues = false;
        
        editorElements.forEach((element, index) => {
          if (element instanceof HTMLElement) {
            const style = window.getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              visibilityIssues = true;
              console.warn(`Editor element ${index} is not visible: display=${style.display}, visibility=${style.visibility}, opacity=${style.opacity}`);
              
              // Force visibility
              element.style.display = element.classList.contains('ql-picker-options') ? 'none' : 'block';
              element.style.visibility = 'visible';
              element.style.opacity = '1';
            }
          }
        });
        
        if (visibilityIssues) {
          console.log("Fixed editor visibility issues");
        } else {
          console.log("No editor visibility issues detected");
        }
        
        // Force editor visibility using the global function if available
        if (window.forceQuillEditorVisibility) {
          window.forceQuillEditorVisibility();
        }
      } catch (error) {
        console.error("Error checking editor visibility:", error);
      }
    };
    
    // Check visibility after initial render and after a delay
    setTimeout(checkEditorVisibility, 1000);
    setTimeout(checkEditorVisibility, 3000);
    
    // Also check whenever the user navigates to the pages management
    const checkOnNavigation = () => {
      if (window.location.pathname.includes('/admin/pages')) {
        setTimeout(checkEditorVisibility, 500);
      }
    };
    
    window.addEventListener('popstate', checkOnNavigation);
    
    return () => {
      window.removeEventListener('popstate', checkOnNavigation);
    };
  }, []);

  if (isInstalled === null) {
    return <div>Ładowanie...</div>;
  }

  return (
    <AuthProvider>
      <Router>
        {!isInstalled ? (
          <Setup />
        ) : (
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <Routes>
              {/* Admin routes with AdminLayout rendered outside the container */}
              <Route 
                path="/admin/*"
                element={
                  <PrivateRoute requireAdmin>
                    <AdminLayout />
                  </PrivateRoute>
                }
              />
              
              {/* All other routes are wrapped in the container */}
              <Route path="*" element={
                <main className="container mx-auto px-4 py-8 flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/posts/:id" element={<ContentPage />} />
                    <Route path="/youtube" element={<YouTube />} />
                    <Route path="/kontakt" element={<ContactPage />} />
                    
                    {/* Dynamiczne strony CMS */}
                    <Route path="/:slug" element={<ContentPage />} />
                    
                    {/* Student routes with StudentLayout */}
                    <Route
                      path="/student/*"
                      element={
                        <PrivateRoute>
                          <StudentLayout />
                        </PrivateRoute>
                      }
                    />
                    
                    <Route
                      path="/profil"
                      element={
                        <PrivateRoute>
                          <Profile />
                        </PrivateRoute>
                      }
                    />
                  </Routes>
                </main>
              } />
            </Routes>
            <Footer />
          </div>
        )}
      </Router>
    </AuthProvider>
  );
};

export default App; 