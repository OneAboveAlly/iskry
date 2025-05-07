import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/Admin.css';
import MaterialUpload from '../components/MaterialUpload';
import MaterialsManagement from '../components/MaterialsManagement';
import NotificationsCenter from '../components/NotificationsCenter';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  approved: boolean;
  createdAt: string;
  isAdmin: boolean;
}

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

interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    password: ''
  });
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    link: ''
  });
  const [newPage, setNewPage] = useState({
    slug: '',
    title: '',
    content: '',
    imageUrl: null
  });
  const [searchUser, setSearchUser] = useState('');
  const [searchAnnouncement, setSearchAnnouncement] = useState('');
  const [searchPage, setSearchPage] = useState('');
  const [showUsersList, setShowUsersList] = useState(true);
  const [showAnnouncementsList, setShowAnnouncementsList] = useState(true);
  const [showPagesList, setShowPagesList] = useState(true);
  const [showMaterialsSection, setShowMaterialsSection] = useState(true);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    message: ''
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

  useEffect(() => {
    fetchUsers();
    fetchAnnouncements();
    fetchPages();
    // Initialize static pages if they don't exist
    initializeStaticPages();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 403) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania użytkowników');
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError('Błąd podczas pobierania użytkowników');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania ogłoszeń');
      }

      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      setError('Błąd podczas pobierania ogłoszeń');
    }
  };

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/pages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas pobierania stron');
      }

      const data = await response.json();
      setPages(data);
    } catch (error) {
      setError('Błąd podczas pobierania stron');
    }
  };

  const initializeStaticPages = async (): Promise<void> => {
    const staticPages = [
      {
        slug: 'o-mnie',
        title: 'O mnie',
        content: '<h1>O mnie</h1><p>Strona o mnie</p>',
        imageUrl: null
      },
      {
        slug: 'istnienie',
        title: 'Istnienie',
        content: '<h1>Istnienie</h1><p>Strona o istnieniu</p>',
        imageUrl: null
      },
      {
        slug: 'rytual-przykladania',
        title: 'Rytuał przykładania',
        content: '<h1>Rytuał przykładania</h1><p>Informacje o rytuale</p>',
        imageUrl: null
      },
      {
        slug: 'droga-rozwoju',
        title: 'Droga rozwoju',
        content: '<h1>Droga rozwoju</h1><p>Informacje o drodze rozwoju</p>',
        imageUrl: null
      },
      {
        slug: 'cennik',
        title: 'Cennik',
        content: '<h1>Cennik</h1><p>Informacje o cenach</p>',
        imageUrl: null
      }
    ];

    try {
      const token = localStorage.getItem('token');
      for (const page of staticPages) {
        console.log(`Creating page: ${page.title}`);
        const response = await fetch('http://localhost:3001/api/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(page)
        });

        if (response.status === 409) {
          console.log(`Page ${page.title} already exists`);
        } else if (!response.ok) {
          console.error(`Failed to create page ${page.title}: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to create page ${page.title}: ${response.statusText}`);
        } else {
          console.log(`Successfully created page: ${page.title}`);
        }
      }
      console.log('Finished initializing static pages');
      fetchPages(); // Refresh the pages list
    } catch (error) {
      console.error('Error initializing static pages:', error);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas zatwierdzania użytkownika');
      }

      fetchUsers();
    } catch (error) {
      setError('Błąd podczas zatwierdzania użytkownika');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas usuwania użytkownika');
      }

      fetchUsers();
      closeModal();
    } catch (error) {
      setError('Błąd podczas usuwania użytkownika');
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas usuwania ogłoszenia');
      }

      fetchAnnouncements();
      closeModal();
    } catch (error) {
      setError('Błąd podczas usuwania ogłoszenia');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        throw new Error('Błąd podczas tworzenia użytkownika');
      }

      setNewUser({
        name: '',
        surname: '',
        email: '',
        password: ''
      });
      fetchUsers();
    } catch (error) {
      setError('Błąd podczas tworzenia użytkownika');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAnnouncement)
      });

      if (!response.ok) {
        throw new Error('Błąd podczas tworzenia ogłoszenia');
      }

      setNewAnnouncement({
        title: '',
        content: '',
        link: ''
      });
      fetchAnnouncements();
    } catch (error) {
      setError('Błąd podczas tworzenia ogłoszenia');
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPage)
      });

      if (!response.ok) {
        throw new Error('Błąd podczas tworzenia strony');
      }

      setNewPage({
        slug: '',
        title: '',
        content: '',
        imageUrl: null
      });
      fetchPages();
    } catch (error) {
      setError('Błąd podczas tworzenia strony');
    }
  };

  const handleDeletePage = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Błąd podczas usuwania strony');
      }

      fetchPages();
    } catch (error) {
      setError('Błąd podczas usuwania strony');
    }
  };

  const handleUpdatePage = async (id: number, updatedPage: Partial<Page>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/pages/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPage)
      });

      if (!response.ok) {
        throw new Error('Błąd podczas aktualizacji strony');
      }

      fetchPages();
    } catch (error) {
      setError('Błąd podczas aktualizacji strony');
    }
  };

  const handleBackupPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const openModal = (type: 'userDetails' | 'deleteUser' | 'deleteAnnouncement', data: any) => {
        setModal({
          isOpen: true,
          type,
          message: ''
        });
      };

      const closeModal = () => {
        setModal(prev => ({ ...prev, isOpen: false }));
      };

      const filteredUsers = users.filter(user => {
        const fullName = `${user.name} ${user.surname}`.toLowerCase();
        const email = user.email.toLowerCase();
        const search = searchUser.toLowerCase();
        return fullName.includes(search) || email.includes(search);
      });

      const filteredAnnouncements = announcements.filter(announcement => {
        const title = announcement.title.toLowerCase();
        const content = announcement.content.toLowerCase();
        const search = searchAnnouncement.toLowerCase();
        return title.includes(search) || content.includes(search);
      });

      if (loading) {
        return <div className="flex justify-center items-center h-screen">Ładowanie...</div>;
      }

      return (
        <div className="admin-panel">
          <NotificationsCenter />
          <div className="container mx-auto px-4 py-8 admin-container">
            <h1 className="text-3xl font-bold mb-8">Panel Administracyjny</h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sekcja użytkowników */}
              <div className="card-container">
                <div className="card-header" onClick={() => setShowUsersList(!showUsersList)}>
                  <h2 className="text-2xl font-semibold">Użytkownicy</h2>
                  <div className="card-toggle">
                    {showUsersList ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
                
                {showUsersList && (
                  <>
                    <div className="search-container mb-4">
                      <input
                        type="text"
                        placeholder="Szukaj użytkowników..."
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        className="search-input"
                      />
                      <span className="search-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </span>
                    </div>
                    
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      {filteredUsers.length === 0 ? (
                        <div className="empty-results p-6 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                          <p className="text-gray-500">Brak użytkowników spełniających kryteria wyszukiwania</p>
                        </div>
                      ) : (
                        <div className="users-grid">
                          {filteredUsers.map((user) => (
                            <div key={user.id} className="user-card" onClick={() => openModal('userDetails', user)}>
                              <div className="user-avatar">
                                <span>{user.name.charAt(0)}{user.surname.charAt(0)}</span>
                              </div>
                              <div className="user-info">
                                <h3>{user.name} {user.surname}</h3>
                                <p>{user.email}</p>
                                <div className="user-status">
                                  {user.approved ? (
                                    <span className="status-badge status-approved">Zatwierdzony</span>
                                  ) : (
                                    <span className="status-badge status-pending">Oczekujący</span>
                                  )}
                                </div>
                              </div>
                              <div className="user-actions">
                                {!user.approved && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(user.id);
                                    }}
                                    className="action-button approve-button"
                                    title="Zatwierdź"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openModal('deleteUser', user);
                                  }}
                                  className="action-button delete-button"
                                  title="Usuń"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Formularz dodawania użytkownika */}
              <div className="card-container">
                <div className="card-header">
                  <h2 className="text-2xl font-semibold">Dodaj ucznia</h2>
                </div>
                <form onSubmit={handleCreateUser} className="form-container">
                  <div className="form-group">
                    <label htmlFor="name">Imię</label>
                    <input
                      type="text"
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="surname">Nazwisko</label>
                    <input
                      type="text"
                      id="surname"
                      value={newUser.surname}
                      onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Hasło</label>
                    <input
                      type="password"
                      id="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-button">
                    Dodaj ucznia
                  </button>
                </form>
              </div>
            </div>

            {/* Sekcja ogłoszeń */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              {/* Formularz dodawania ogłoszenia */}
              <div className="card-container">
                <div className="card-header">
                  <h2 className="text-2xl font-semibold">Dodaj nowe ogłoszenie</h2>
                </div>
                <form onSubmit={handleCreateAnnouncement} className="form-container">
                  <div className="form-group">
                    <label htmlFor="announcement-title">Tytuł</label>
                    <input
                      type="text"
                      id="announcement-title"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="announcement-content">Treść</label>
                    <div className="quill-editor">
                      <ReactQuill 
                        theme="snow"
                        modules={modules}
                        formats={formats}
                        value={newAnnouncement.content}
                        onChange={(content) => setNewAnnouncement({ ...newAnnouncement, content })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="announcement-link">Link (opcjonalny)</label>
                    <input
                      type="url"
                      id="announcement-link"
                      value={newAnnouncement.link}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, link: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="submit-button">
                    Dodaj ogłoszenie
                  </button>
                </form>
              </div>

              {/* Lista ogłoszeń */}
              <div className="card-container">
                <div className="card-header" onClick={() => setShowAnnouncementsList(!showAnnouncementsList)}>
                  <h2 className="text-2xl font-semibold">Lista ogłoszeń</h2>
                  <div className="card-toggle">
                    {showAnnouncementsList ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    )}
                  </div>
                </div>
                
                {showAnnouncementsList && (
                  <>
                    <div className="search-container mb-4">
                      <input
                        type="text"
                        placeholder="Szukaj ogłoszeń..."
                        value={searchAnnouncement}
                        onChange={(e) => setSearchAnnouncement(e.target.value)}
                        className="search-input"
                      />
                      <span className="search-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                      </span>
                    </div>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      {filteredAnnouncements.length === 0 ? (
                        <div className="empty-results p-6 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            <line x1="12" y1="11" x2="12" y2="17"></line>
                            <line x1="9" y1="14" x2="15" y2="14"></line>
                          </svg>
                          <p className="text-gray-500">Brak ogłoszeń spełniających kryteria wyszukiwania</p>
                        </div>
                      ) : (
                        <div className="announcements-list">
                          {filteredAnnouncements.map((announcement) => (
                            <div key={announcement.id} className="announcement-item">
                              <div className="announcement-title">{announcement.title}</div>
                              <div className="announcement-meta">
                                <span>
                                  {new Date(announcement.createdAt).toLocaleDateString('pl-PL')}
                                </span>
                                <span>
                                  {announcement.author.name} {announcement.author.surname}
                                </span>
                              </div>
                              <button
                                onClick={() => openModal('deleteAnnouncement', announcement)}
                                className="delete-announcement"
                                title="Usuń ogłoszenie"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Content Pages Section */}
            <div className="card-container">
              <div className="card-header" onClick={() => setShowPagesList(!showPagesList)}>
                <h2 className="text-2xl font-semibold">Zarządzanie stronami</h2>
                <div className="card-toggle">
                  {showPagesList ? '−' : '+'}
                </div>
              </div>
              
              {showPagesList && (
                <>
                  <div className="search-container mb-4">
                    <input
                      type="text"
                      placeholder="Szukaj stron..."
                      value={searchPage}
                      onChange={(e) => setSearchPage(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="pages-grid">
                      {pages
                        .filter(page => 
                          page.title.toLowerCase().includes(searchPage.toLowerCase()) ||
                          page.slug.toLowerCase().includes(searchPage.toLowerCase())
                        )
                        .map((page) => (
                          <div key={page.id} className="page-card">
                            <div className="page-info">
                              <h3>{page.title}</h3>
                              <p>Slug: {page.slug}</p>
                              <p>Ostatnia aktualizacja: {new Date(page.updatedAt).toLocaleDateString('pl-PL')}</p>
                            </div>
                            <div className="page-actions">
                              <button
                                onClick={() => handleUpdatePage(page.id, { content: newPage.content })}
                                className="edit-button"
                              >
                                Edytuj
                              </button>
                              <button
                                onClick={() => handleDeletePage(page.id)}
                                className="delete-button"
                              >
                                Usuń
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <form onSubmit={handleCreatePage} className="form-container mt-4">
                    <div className="form-group">
                      <label htmlFor="page-slug">Slug</label>
                      <input
                        type="text"
                        id="page-slug"
                        value={newPage.slug}
                        onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="page-title">Tytuł</label>
                      <input
                        type="text"
                        id="page-title"
                        value={newPage.title}
                        onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="page-content">Treść</label>
                      <ReactQuill
                        theme="snow"
                        value={newPage.content}
                        onChange={(content) => setNewPage({ ...newPage, content })}
                        modules={modules}
                        formats={formats}
                      />
                    </div>
                    <button type="submit" className="submit-button">
                      Dodaj stronę
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Modal */}
            {modal.isOpen && (
              <div className={`modal ${modal.type}`}>
                <div className="modal-content">
                  <p>{modal.message}</p>
                  <button onClick={closeModal}>Zamknij</button>
                </div>
              </div>
            )}

            {/* Section for Materials */}
            <section className="admin-section materials-section">
              <div className="section-header" onClick={() => setShowMaterialsSection(!showMaterialsSection)}>
                <h2>PDF Materials Management</h2>
                <button className="collapse-btn">
                  {showMaterialsSection ? '−' : '+'}
                </button>
              </div>

              {showMaterialsSection && (
                <div className="section-content">
                  <MaterialUpload />
                  <MaterialsManagement />
                </div>
              )}
            </section>
          </div>
        </div>
      );
    }

    export default Admin; 