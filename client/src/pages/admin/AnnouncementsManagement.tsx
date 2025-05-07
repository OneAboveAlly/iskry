import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/AnnouncementsManagement.css';
import { authFetch, isAdmin } from '../../utils/auth';

interface Announcement {
  id: number;
  title: string;
  content: string;
  link?: string;
  isPublic: boolean;
  createdAt: string;
  author: {
    name: string;
    surname: string;
  };
}

interface Modal {
  show: boolean;
  type: 'deleteAnnouncement' | 'none';
  data: any;
}

const AnnouncementsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    link: '',
    isPublic: false
  });
  const [searchAnnouncement, setSearchAnnouncement] = useState('');
  const [showAnnouncementsList, setShowAnnouncementsList] = useState(true);
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const [modal, setModal] = useState<Modal>({ 
    show: false, 
    type: 'none',
    data: null
  });

  // Konfiguracja modułów dla Quill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'link', 'image'
  ];

  // Sprawdź uprawnienia administratora przy montowaniu komponentu
  useEffect(() => {
    if (!isAdmin()) {
      navigate('/login');
      return;
    }
    fetchAnnouncements();
  }, [navigate]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authFetch('http://localhost:3001/api/announcements');

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }
        throw new Error('Błąd podczas pobierania ogłoszeń');
      }

      const data = await response.json();
      // Upewnij się, że data jest tablicą
      const announcementsArray = Array.isArray(data) ? data : [];
      setAnnouncements(announcementsArray);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setError('Błąd podczas pobierania ogłoszeń');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      const response = await authFetch(`http://localhost:3001/api/announcements/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }
        throw new Error('Błąd podczas usuwania ogłoszenia');
      }

      await fetchAnnouncements();
      closeModal();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError('Błąd podczas usuwania ogłoszenia');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authFetch('http://localhost:3001/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAnnouncement)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }
        throw new Error('Błąd podczas tworzenia ogłoszenia');
      }

      setNewAnnouncement({
        title: '',
        content: '',
        link: '',
        isPublic: false
      });
      await fetchAnnouncements();
      setShowAnnouncementsList(true);
    } catch (error) {
      console.error('Error creating announcement:', error);
      setError('Błąd podczas tworzenia ogłoszenia');
    }
  };

  const openModal = (type: 'deleteAnnouncement', data: any) => {
    setModal({
      show: true,
      type,
      data
    });
  };

  const closeModal = () => {
    setModal({
      show: false,
      type: 'none',
      data: null
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setNewAnnouncement(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setNewAnnouncement(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const title = announcement.title.toLowerCase();
    const content = announcement.content.toLowerCase();
    const search = searchAnnouncement.toLowerCase();
    return title.includes(search) || content.includes(search);
  });

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
      <div className="announcements-management-container">
        <div className="loader">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="announcements-management-container">
      <h1>Zarządzanie Tablicą Ogłoszeń</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="announcements-controls">
        <button 
          className="toggle-view-button"
          onClick={() => setShowAnnouncementsList(!showAnnouncementsList)}
        >
          {showAnnouncementsList ? 'Dodaj nowe ogłoszenie' : 'Pokaż listę ogłoszeń'}
        </button>
        
        {showAnnouncementsList && (
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Szukaj ogłoszeń..."
              value={searchAnnouncement}
              onChange={(e) => setSearchAnnouncement(e.target.value)}
              className="search-input"
            />
            <label className="public-filter">
              <input
                type="checkbox"
                checked={showOnlyPublic}
                onChange={(e) => setShowOnlyPublic(e.target.checked)}
              />
              Pokaż tylko publiczne
            </label>
          </div>
        )}
      </div>

      {!showAnnouncementsList ? (
        <div className="announcement-form-container">
          <h2>Dodaj nowe ogłoszenie</h2>
          <form onSubmit={handleCreateAnnouncement}>
            <div className="form-group">
              <label htmlFor="title">Tytuł</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newAnnouncement.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Treść</label>
              <ReactQuill
                value={newAnnouncement.content}
                onChange={(content) => setNewAnnouncement(prev => ({ ...prev, content }))}
                modules={modules}
                formats={formats}
              />
            </div>

            <div className="form-group">
              <label htmlFor="link">Link (opcjonalnie)</label>
              <input
                type="text"
                id="link"
                name="link"
                value={newAnnouncement.link}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={newAnnouncement.isPublic}
                  onChange={handleInputChange}
                />
                Publiczne ogłoszenie
              </label>
            </div>

            <button type="submit" className="submit-button">
              Dodaj ogłoszenie
            </button>
          </form>
        </div>
      ) : (
        <div className="announcements-list">
          {filteredAnnouncements
            .filter(announcement => !showOnlyPublic || announcement.isPublic)
            .map(announcement => (
              <div key={announcement.id} className="announcement-item">
                <div className="announcement-header">
                  <h3>{announcement.title}</h3>
                  <div className="announcement-meta">
                    <span className="date">{formatDate(announcement.createdAt)}</span>
                    <span className="visibility-badge" style={{ 
                      backgroundColor: announcement.isPublic ? '#4CAF50' : '#FFA000',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8em'
                    }}>
                      {announcement.isPublic ? 'Publiczne' : 'Prywatne'}
                    </span>
                  </div>
                </div>
                
                <div className="announcement-content" dangerouslySetInnerHTML={{ __html: announcement.content }}></div>
                
                {announcement.link && (
                  <a href={announcement.link} target="_blank" rel="noopener noreferrer" className="announcement-link">
                    Więcej informacji
                  </a>
                )}
                
                <div className="announcement-actions">
                  <button
                    className="edit-button"
                    onClick={() => {
                      setNewAnnouncement({
                        title: announcement.title,
                        content: announcement.content,
                        link: announcement.link || '',
                        isPublic: announcement.isPublic
                      });
                      setShowAnnouncementsList(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edytuj
                  </button>
                  
                  <button
                    className="delete-button"
                    onClick={() => openModal('deleteAnnouncement', announcement)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Usuń
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal do potwierdzenia usunięcia */}
      {modal.show && modal.type === 'deleteAnnouncement' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Potwierdź usunięcie</h3>
            <p>Czy na pewno chcesz usunąć ogłoszenie "{modal.data.title}"?</p>
            <div className="modal-actions">
              <button onClick={() => handleDeleteAnnouncement(modal.data.id)} className="confirm-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Tak, usuń
              </button>
              <button onClick={closeModal} className="cancel-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManagement; 