import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="logo-text">
                <span className="sparkle-text">Iskrzący</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/o-mnie" className="nav-link">
                O mnie
              </Link>
              <Link to="/aktualnosci" className="nav-link">
                Aktualności
              </Link>
              <Link to="/istnienie" className="nav-link">
                Istnienie
              </Link>
              <Link to="/rytual-przykladania" className="nav-link">
                Rytuał przykładania
              </Link>
              <Link to="/droga-rozwoju" className="nav-link">
                Droga rozwoju
              </Link>
              <Link to="/youtube" className="nav-link">
                <span className="flex items-center">
                  YouTube
                  <svg className="ml-1 w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </span>
              </Link>
              <Link to="/cennik" className="nav-link">
                Cennik
              </Link>
              <Link to="/kontakt" className="nav-link">
                Kontakt
              </Link>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div className="mr-4">
                  <NotificationBell />
                </div>
                
                <div className={`relative user-menu-container ${isUserMenuOpen ? 'dropdown-active' : ''}`} ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center text-gray-700 hover:text-primary focus:outline-none"
                  >
                    <span className="user-name">{user?.name} {user?.surname}</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50 user-dropdown">
                      {user?.isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Panel administratora
                        </Link>
                      )}
                      {user?.approved && (
                        <Link
                          to="/student"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Panel ucznia
                        </Link>
                      )}
                      <Link
                        to="/profil"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Mój profil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Wyloguj się
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="nav-button-login">
                  Zaloguj się
                </Link>
                <Link to="/register" className="nav-button-register">
                  Zarejestruj się
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            {isAuthenticated && (
              <div className="mr-2">
                <NotificationBell />
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link to="/o-mnie" className="mobile-nav-link">
              O mnie
            </Link>
            <Link to="/aktualnosci" className="mobile-nav-link">
              Aktualności
            </Link>
            <Link to="/istnienie" className="mobile-nav-link">
              Istnienie
            </Link>
            <Link to="/rytual-przykladania" className="mobile-nav-link">
              Rytuał przykładania
            </Link>
            <Link to="/droga-rozwoju" className="mobile-nav-link">
              Droga rozwoju
            </Link>
            <Link to="/youtube" className="mobile-nav-link">
              YouTube
            </Link>
            <Link to="/cennik" className="mobile-nav-link">
              Cennik
            </Link>
            <Link to="/kontakt" className="mobile-nav-link">
              Kontakt
            </Link>
            {isAuthenticated ? (
              <>
                {user?.isAdmin && (
                  <Link to="/admin" className="mobile-nav-link">
                    Panel administratora
                  </Link>
                )}
                {user?.approved && (
                  <Link to="/student" className="mobile-nav-link">
                    Panel ucznia
                  </Link>
                )}
                <Link to="/profil" className="mobile-nav-link">
                  Mój profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left mobile-nav-link"
                >
                  Wyloguj się
                </button>
              </>
            ) : (
              <div className="flex flex-row space-x-2 mt-2 px-1">
                <Link to="/login" className="mobile-nav-link-auth flex-1 text-center">
                  Zaloguj się
                </Link>
                <Link to="/register" className="mobile-nav-link-auth flex-1 text-center">
                  Zarejestruj się
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 