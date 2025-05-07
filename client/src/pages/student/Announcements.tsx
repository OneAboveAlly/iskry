import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/Announcements.css';
import '../../styles/QuillEditorFixes.css';
import '../../styles/Modal.css';
import Modal from 'react-modal';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Announcement {
  id: number;
  title: string;
  content: string;
  link?: string | null;
  isPublic: boolean;
  createdAt: string;
  author: {
    name: string;
    surname: string;
  };
}

// Inspirational quotes for spiritual growth
const spiritualQuotes = [
  "Spokój umysłu zaczyna się od akceptacji teraźniejszości.",
  "Największą podróżą jest ta, która prowadzi do wnętrza.",
  "Twoje myśli stają się twoją rzeczywistością. Wybieraj je mądrze.",
  "Duchowość to nie ucieczka od życia, ale głębsze w nie wejście.",
  "Prawdziwa mądrość zaczyna się od zrozumienia samego siebie.",
  "Dobry nauczyciel nie daje odpowiedzi, ale pomaga ci je odnaleźć.",
  "W ciszy odnajdujemy siebie, w spokoju poznajemy świat.",
  "Każde doświadczenie jest lekcją, każde wyzwanie szansą na rozwój."
];

const Announcements: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [randomQuote, setRandomQuote] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<{[key: number]: boolean}>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', link: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', link: '' });

  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
        [{size: []}],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, 
         {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        ['clean'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }]
      ],
    }
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'color', 'background', 'align'
  ];

  useEffect(() => {
    // Select a random spiritual quote
    const quote = spiritualQuotes[Math.floor(Math.random() * spiritualQuotes.length)];
    setRandomQuote(quote);
    
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

  // Dodajemy efekt do zarządzania dropdownami
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.ql-picker-options') && !target.closest('.ql-picker-label')) {
        // Zamknij wszystkie otwarte dropdowny
        document.querySelectorAll('.ql-picker.ql-expanded').forEach((dropdown) => {
          dropdown.classList.remove('ql-expanded');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Nie jesteś zalogowany');
      }

      const response = await fetch('http://localhost:3001/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  const formatDate = (dateString: string, withTime: boolean = false) => {
    if (!dateString) return 'Nieznana data';
    try {
      const date = new Date(dateString);
      const datePart = date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (withTime) {
        const timePart = date.toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        return `${datePart}, ${timePart}`;
      }
      return datePart;
    } catch (error) {
      return 'Nieznana data';
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Funkcja do przełączania stanu rozwinięcia ogłoszenia
  const toggleAnnouncementContent = (id: number) => {
    setExpandedAnnouncements(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Funkcja do skracania treści HTML z zachowaniem tagów
  const truncateHtml = (html: string, maxLength: number = 150) => {
    // Usuwamy tagi HTML, aby policzyć faktyczną długość tekstu
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    if (textContent.length <= maxLength) {
      return html; // Zwracamy bez zmian, jeśli tekst jest już krótszy niż limit
    }
    
    let truncated = '';
    let currentLength = 0;
    let tagStack: string[] = [];
    let inTag = false;
    let inClosingTag = false;
    let currentTag = '';
    
    // Iterujemy po każdym znaku HTML
    for (let i = 0; i < html.length; i++) {
      const char = html[i];
      
      // Obsługa tagów
      if (char === '<') {
        inTag = true;
        currentTag = '';
        if (html[i + 1] === '/') {
          inClosingTag = true;
        }
        truncated += char;
        continue;
      }
      
      if (inTag) {
        truncated += char;
        currentTag += char;
        
        if (char === '>') {
          inTag = false;
          if (!inClosingTag && !['br', 'img', 'hr'].includes(currentTag.replace(/[\s>]/g, ''))) {
            tagStack.push(currentTag.replace(/[\s>]/g, ''));
          }
          
          if (inClosingTag) {
            inClosingTag = false;
            tagStack.pop();
          }
          
          currentTag = '';
        }
        continue;
      }
      
      // Liczymy długość tekstu
      currentLength++;
      truncated += char;
      
      // Jeśli osiągnęliśmy limit, kończymy
      if (currentLength >= maxLength) {
        truncated += '...';
        break;
      }
    }
    
    // Zamykamy wszystkie otwarte tagi
    for (let i = tagStack.length - 1; i >= 0; i--) {
      truncated += `</${tagStack[i]}>`;
    }
    
    return truncated;
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Brak tokenu');
      const response = await fetch(`http://localhost:3001/api/announcements/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Błąd podczas usuwania ogłoszenia');
      setAnnouncements(prev => prev.filter(a => a.id !== deleteId));
      setFilteredAnnouncements(prev => prev.filter(a => a.id !== deleteId));
      setShowConfirmModal(false);
    } catch (err) {
      alert('Błąd podczas usuwania ogłoszenia.');
    }
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setEditForm({
      title: announcement.title,
      content: announcement.content,
      link: announcement.link || ''
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAnnouncement(null);
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Brak tokenu');

      const response = await fetch(`http://localhost:3001/api/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          link: editForm.link || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Błąd podczas edycji ogłoszenia');
      }

      const updatedAnnouncement = await response.json();
      
      // Aktualizuj stan lokalny
      const updateAnnouncement: Announcement = {
        ...editingAnnouncement,
        title: editForm.title,
        content: editForm.content,
        link: editForm.link || undefined,
        isPublic: editingAnnouncement.isPublic,
        createdAt: editingAnnouncement.createdAt,
        author: editingAnnouncement.author
      };

      setAnnouncements(prev => prev.map(a => 
        a.id === editingAnnouncement.id ? updateAnnouncement : a
      ));
      setFilteredAnnouncements(prev => prev.map(a => 
        a.id === editingAnnouncement.id ? updateAnnouncement : a
      ));

      closeEditModal();
      // Pokaż komunikat o sukcesie
      alert('Ogłoszenie zostało zaktualizowane pomyślnie');
    } catch (err) {
      console.error('Error updating announcement:', err);
      setEditError(err instanceof Error ? err.message : 'Błąd podczas edycji ogłoszenia');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Brak tokenu');

      const response = await fetch('http://localhost:3001/api/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newAnnouncement,
          isPublic: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Błąd podczas dodawania ogłoszenia');
      }

      const addedAnnouncement = await response.json();
      setAnnouncements(prev => [addedAnnouncement, ...prev]);
      setFilteredAnnouncements(prev => [addedAnnouncement, ...prev]);
      setShowAddModal(false);
      setNewAnnouncement({ title: '', content: '', link: '' });
    } catch (err) {
      alert('Błąd podczas dodawania ogłoszenia.');
    }
  };

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
        <p>Ładowanie wiadomości duchowych...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <div className="error-icon">!</div>
        <h2>Wystąpił błąd</h2>
        <p>{error}</p>
        <button onClick={fetchAnnouncements} className="retry-button">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="announcements-page">
      <div className="announcement-header">
        <div className="spiritual-symbol">☸</div>
        <h1>Tablica ogłoszeń</h1>
        <p>Ścieżka rozwoju duchowego - ważne wiadomości, refleksje i wskazówki na Twojej drodze</p>
        
        <div className="inspirational-quote">
          <blockquote>"{randomQuote}"</blockquote>
        </div>
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
        
        <div className="view-controls">
          <button 
            className={`view-button ${viewMode === 'grid' ? 'active' : ''}`} 
            onClick={() => setViewMode('grid')}
            aria-label="Widok siatki"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button 
            className={`view-button ${viewMode === 'list' ? 'active' : ''}`} 
            onClick={() => setViewMode('list')}
            aria-label="Widok listy"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="announcement-count">
          {filteredAnnouncements.length === 0 
            ? <span>Brak pasujących ogłoszeń</span>
            : <span>Znaleziono {filteredAnnouncements.length} {
                filteredAnnouncements.length === 1 
                  ? 'wiadomość' 
                  : filteredAnnouncements.length < 5 
                    ? 'wiadomości' 
                    : 'wiadomości'
              }</span>
          }
        </div>
      </div>

      <div className="announcements-container">
        {filteredAnnouncements.length === 0 ? (
          <div className="no-announcements">
            <div className="no-data-icon">
              <svg viewBox="0 0 24 24" width="60" height="60" stroke="currentColor" strokeWidth="1" fill="none">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v8M8 12h8"></path>
                <circle cx="12" cy="12" r="6"></circle>
              </svg>
            </div>
            <h2>Brak ogłoszeń</h2>
            <p>{searchTerm ? 'Spróbuj zmienić kryteria wyszukiwania, aby odnaleźć swoją ścieżkę' : 'Aktualnie nie ma żadnych ogłoszeń. Wkrótce pojawią się nowe inspiracje.'}</p>
            {searchTerm && (
              <button className="clear-search-button" onClick={clearSearch}>
                Wyczyść wyszukiwanie
              </button>
            )}
          </div>
        ) : (
          <div className={`announcements-list ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
            {filteredAnnouncements.map((announcement) => (
              <div key={announcement.id} className="announcement-card">
                <div className="card-header">
                  <div className="card-title">
                    <h2>{announcement.title}</h2>
                    <span className="date-badge">{formatDate(announcement.createdAt, true)}</span>
                  </div>
                  {user?.isAdmin && (
                    <div className="admin-actions">
                      <button className="edit-btn" title="Edytuj" onClick={() => openEditModal(announcement)}>
                        ✏️
                      </button>
                      <button className="delete-btn" title="Usuń" onClick={() => handleDelete(announcement.id)}>
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="card-content">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: expandedAnnouncements[announcement.id] 
                        ? announcement.content 
                        : truncateHtml(announcement.content, 150)
                    }} 
                  />
                  
                  {/* Przycisk "Czytaj więcej" / "Zwiń" */}
                  {announcement.content.length > 150 && (
                    <div className="continue-reading">
                      <button 
                        className="view-post-button"
                        onClick={() => toggleAnnouncementContent(announcement.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        {expandedAnnouncements[announcement.id] ? 'Zwiń' : 'Czytaj więcej'}
                      </button>
                    </div>
                  )}
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
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      Przejdź do załączonego materiału
                    </a>
                  </div>
                )}
                
                <div className="card-footer">
                  <div className="author-info">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {announcement.author.name} {announcement.author.surname}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="return-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
        contentLabel="Potwierdź usunięcie"
        className="confirm-modal"
        overlayClassName="modal-overlay"
      >
        <h2>Potwierdź usunięcie</h2>
        <p>Czy na pewno chcesz usunąć to ogłoszenie? Tej operacji nie można cofnąć.</p>
        <div className="modal-actions">
          <button 
            className="modal-btn cancel-btn" 
            onClick={() => setShowConfirmModal(false)}
          >
            Anuluj
          </button>
          <button 
            className="modal-btn delete-btn" 
            onClick={confirmDelete}
          >
            Usuń
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onRequestClose={closeEditModal}
        contentLabel="Edytuj ogłoszenie"
        className="edit-modal"
        overlayClassName="modal-overlay"
      >
        <button className="modal-close" onClick={closeEditModal}>×</button>
        <h2>Edytuj ogłoszenie</h2>
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label>Tytuł</label>
            <input 
              name="title" 
              value={editForm.title} 
              onChange={handleEditChange} 
              required 
              className="edit-input"
            />
          </div>
          <div className="form-group editor-wrapper">
            <label>Treść</label>
            <ReactQuill
              value={editForm.content}
              onChange={(content) => setEditForm(prev => ({ ...prev, content }))}
              modules={quillModules}
              formats={quillFormats}
              className="announcement-editor"
              theme="snow"
            />
          </div>
          <div className="form-group">
            <label>Link (opcjonalnie)</label>
            <input 
              name="link" 
              value={editForm.link || ''} 
              onChange={handleEditChange}
              className="edit-input"
            />
          </div>
          {editError && <div className="error-message">{editError}</div>}
          <div className="modal-actions">
            <button type="button" onClick={closeEditModal} className="modal-btn cancel-btn">
              Anuluj
            </button>
            <button 
              type="submit" 
              className={`modal-btn confirm-btn ${editLoading ? 'loading-btn' : ''}`} 
              disabled={editLoading}
            >
              {editLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
        contentLabel="Dodaj ogłoszenie"
        className="edit-modal"
        overlayClassName="modal-overlay"
      >
        <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
        <h2>Dodaj nowe ogłoszenie</h2>
        <form onSubmit={handleAddAnnouncement}>
          <div className="form-group">
            <label>Tytuł</label>
            <input 
              value={newAnnouncement.title} 
              onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))} 
              required 
              className="edit-input"
            />
          </div>
          <div className="form-group editor-wrapper">
            <label>Treść</label>
            <ReactQuill
              value={newAnnouncement.content}
              onChange={(content) => setNewAnnouncement(prev => ({ ...prev, content }))}
              modules={quillModules}
              formats={quillFormats}
              className="announcement-editor"
              theme="snow"
            />
          </div>
          <div className="form-group">
            <label>Link (opcjonalnie)</label>
            <input 
              value={newAnnouncement.link} 
              onChange={(e) => setNewAnnouncement(prev => ({ ...prev, link: e.target.value }))}
              className="edit-input"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => setShowAddModal(false)} className="modal-btn cancel-btn">
              Anuluj
            </button>
            <button type="submit" className="modal-btn confirm-btn">
              Dodaj ogłoszenie
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Announcement Button (only for admin) */}
      {user?.isAdmin && (
        <button 
          className="add-announcement-btn" 
          onClick={() => setShowAddModal(true)}
          title="Dodaj nowe ogłoszenie"
        >
          +
        </button>
      )}
    </div>
  );
};

export default Announcements; 