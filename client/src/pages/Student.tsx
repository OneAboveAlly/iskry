import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MaterialList from '../components/MaterialList';
import '../styles/Student.css';

interface Announcement {
  id: number;
  title: string;
  content: string;
  link?: string;
  createdAt: string;
  author: {
    name: string;
    surname: string;
  };
}

const Student: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user.approved) {
      navigate('/');
      return;
    }

    fetchAnnouncements();
  }, [user, navigate]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAnnouncements(announcements);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = announcements.filter(announcement => 
        announcement.title.toLowerCase().includes(term) || 
        announcement.content.toLowerCase().includes(term)
      );
      setFilteredAnnouncements(filtered);
    }
  }, [searchTerm, announcements]);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/announcements');
      if (!response.ok) {
        throw new Error('Nie udało się pobrać ogłoszeń');
      }
      const data = await response.json();
      setAnnouncements(data);
      setFilteredAnnouncements(data);
    } catch (err) {
      setError('Wystąpił błąd podczas pobierania ogłoszeń');
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loader">
          <div className="spinner"></div>
          <p>Ładowanie ogłoszeń...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          <div className="error-icon">!</div>
          <h2>Wystąpił błąd</h2>
          <p>{error}</p>
          <button onClick={fetchAnnouncements} className="retry-button">
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="announcement-header">
        <h1>Tablica ogłoszeń</h1>
        <p>Ważne informacje i aktualności dla studentów</p>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Szukaj ogłoszeń..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-button" 
              onClick={clearSearch}
              aria-label="Wyczyść wyszukiwanie"
            >
              ×
            </button>
          )}
          <button className="search-button" aria-label="Szukaj">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        
        <div className="announcement-count">
          {filteredAnnouncements.length === 0 
            ? <span>Brak pasujących ogłoszeń</span>
            : <span>Znaleziono {filteredAnnouncements.length} {
                filteredAnnouncements.length === 1 
                  ? 'ogłoszenie' 
                  : filteredAnnouncements.length < 5 
                    ? 'ogłoszenia' 
                    : 'ogłoszeń'
              }</span>
          }
        </div>
      </div>

      <div className="announcements-container">
        {filteredAnnouncements.length === 0 ? (
          <div className="no-announcements">
            <div className="no-data-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1" fill="none">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <h2>Brak ogłoszeń</h2>
            <p>{searchTerm ? 'Spróbuj zmienić kryteria wyszukiwania' : 'Nie znaleziono żadnych ogłoszeń'}</p>
            {searchTerm && (
              <button className="clear-search-button" onClick={clearSearch}>
                Wyczyść wyszukiwanie
              </button>
            )}
          </div>
        ) : (
          <div className="announcements-list">
            {filteredAnnouncements.map((announcement) => (
              <div key={announcement.id} className="announcement-card">
                <div className="card-header">
                  <div className="card-title">
                    <h2>{announcement.title}</h2>
                    <span className="date-badge">{formatDate(announcement.createdAt)}</span>
                  </div>
                </div>
                
                <div className="card-content">
                  <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                </div>
                
                {announcement.link && (
                  <div className="card-actions">
                    <a 
                      href={announcement.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="link-button"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                      Przejdź do linku
                    </a>
                  </div>
                )}
                
                <div className="card-footer">
                  <div className="author-info">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>{announcement.author.name} {announcement.author.surname}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Materials Section */}
      <div className="materials-section">
        <MaterialList />
      </div>
    </div>
  );
};

export default Student; 