import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, isAdmin } from '../../utils/auth';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/PostsManagement.css';
import '../../styles/QuillEditorFixes.css';
import '../../styles/EnhancedCKEditor.css';

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  publishedAt: string;
  author: {
    id: number;
    name: string;
    surname: string;
  };
}

const PostsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Stan dla trybu wyświetlania
  const [viewMode, setViewMode] = useState<'list' | 'edit' | 'add'>('list');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Filtry i sortowanie
  const [filter, setFilter] = useState<'all' | 'published' | 'scheduled'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  
  // Stan formularza
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    publishedAt: new Date().toISOString().split('T')[0],
    image: null as File | null
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Podstawowa konfiguracja edytora Quill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  useEffect(() => {
    // Sprawdź, czy użytkownik jest adminem
    if (!isAdmin()) {
      navigate('/login');
      return;
    }
    fetchPosts();
  }, [navigate]);
  
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch('http://localhost:3001/api/posts');
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
          return;
        }
        throw new Error('Nie udało się pobrać postów');
      }
      
      const data = await response.json();
      
      // Obsługa zarówno formatu tablicy, jak i obiektu
      const postsArray = Array.isArray(data) ? data : data.posts || [];
      setPosts(postsArray);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Błąd podczas pobierania postów');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, image: file }));
      
      // Tworzenie URL podglądu
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      publishedAt: new Date().toISOString().split('T')[0],
      image: null
    });
    setPreviewUrl(null);
    setSelectedPost(null);
    setViewMode('list');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Walidacja formularza
      if (!formData.title.trim()) {
        setError('Tytuł jest wymagany');
        return;
      }
      
      if (!formData.content.trim()) {
        setError('Treść jest wymagana');
        return;
      }
      
      // Przygotowanie danych w formacie JSON
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        publishedAt: formData.publishedAt
      };
      
      let response;
      
      if (viewMode === 'add') {
        // Dodawanie nowego posta
        response = await authFetch('http://localhost:3001/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        });
      } else if (viewMode === 'edit' && selectedPost) {
        // Aktualizacja istniejącego posta
        response = await authFetch(`http://localhost:3001/api/posts/${selectedPost.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        });
      } else {
        throw new Error('Nieprawidłowy tryb formularza');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Operacja nie powiodła się');
      }
      
      const responseData = await response.json();
      const postId = viewMode === 'add' ? responseData.id : selectedPost?.id;
      
      // Jeśli jest obrazek do przesłania, zrób to w osobnym żądaniu
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.image);
        
        const imageResponse = await authFetch(
          `http://localhost:3001/api/posts/${postId}/image`, 
          {
            method: 'POST',
            body: imageFormData
          }
        );
        
        if (!imageResponse.ok) {
          setError('Post został zapisany, ale nie udało się przesłać obrazka');
          return;
        }
      }
      
      setSuccess(`Post został pomyślnie ${viewMode === 'add' ? 'dodany' : 'zaktualizowany'}`);
      resetForm();
      fetchPosts();
      
      // Ukryj komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas zapisywania posta');
      console.error('Error submitting post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title || '',
      content: post.content || '',
      publishedAt: new Date(post.publishedAt).toISOString().split('T')[0],
      image: null
    });
    setPreviewUrl(post.imageUrl ? `http://localhost:3001${post.imageUrl}` : null);
    setViewMode('edit');
  };
  
  const handleDelete = async (id: number) => {
    try {
      setIsSubmitting(true);
      const response = await authFetch(`http://localhost:3001/api/posts/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się usunąć posta');
      }
      
      setSuccess('Post został pomyślnie usunięty');
      setShowConfirmDelete(null);
      fetchPosts();
      
      // Ukryj komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Błąd podczas usuwania posta');
      console.error('Error deleting post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Przefiltruj i posortuj posty
  const filteredAndSortedPosts = useMemo(() => {
    // Najpierw filtrowanie
    let filtered = [...posts];
    
    if (filter === 'published') {
      filtered = filtered.filter(post => {
        const publishDate = new Date(post.publishedAt);
        return publishDate <= new Date();
      });
    } else if (filter === 'scheduled') {
      filtered = filtered.filter(post => {
        const publishDate = new Date(post.publishedAt);
        return publishDate > new Date();
      });
    }
    
    // Potem sortowanie
    return filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      
      if (sortBy === 'newest') {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });
  }, [posts, filter, sortBy]);
  
  if (loading) {
    return (
      <div className="posts-management-container mt-20">
        <div className="loader">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="posts-management-container mt-20">
      <div className="page-header">
        <h1>Zarządzanie Postami</h1>
        {viewMode === 'edit' && (
          <div className="edit-mode-banner">
            Edycja posta: {selectedPost?.title}
          </div>
        )}
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">Wszystkie posty</span>
            <span className="stat-value">{posts.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Opublikowane</span>
            <span className="stat-value">
              {posts.filter(post => {
                const publishDate = new Date(post.publishedAt);
                return publishDate <= new Date();
              }).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Zaplanowane</span>
            <span className="stat-value">
              {posts.filter(post => {
                const publishDate = new Date(post.publishedAt);
                return publishDate > new Date();
              }).length}
            </span>
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="view-controls">
        {viewMode === 'list' ? (
          <>
            <div className="filter-options">
              <div className="filter-group">
                <label htmlFor="filter-status">Status:</label>
                <select 
                  id="filter-status"
                  className="filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'published' | 'scheduled')}
                >
                  <option value="all">Wszystkie posty</option>
                  <option value="published">Tylko opublikowane</option>
                  <option value="scheduled">Tylko zaplanowane</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="sort-by">Sortuj:</label>
                <select 
                  id="sort-by"
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                >
                  <option value="newest">Od najnowszych</option>
                  <option value="oldest">Od najstarszych</option>
                </select>
              </div>
            </div>
            
            <button 
              className="add-button" 
              onClick={() => setViewMode('add')}
              disabled={isSubmitting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Dodaj nowy post
            </button>
          </>
        ) : (
          <button 
            className="back-button" 
            onClick={resetForm}
            disabled={isSubmitting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Powrót do listy
          </button>
        )}
      </div>
      
      {viewMode === 'list' ? (
        <div className="posts-list">
          {filteredAndSortedPosts.length === 0 ? (
            <div className="no-posts-message">
              {filter !== 'all' 
                ? `Brak postów spełniających wybrany filtr (${filter === 'published' ? 'opublikowane' : 'zaplanowane'})` 
                : 'Brak postów do wyświetlenia'}
            </div>
          ) : (
            filteredAndSortedPosts.map(post => {
              const publishDate = new Date(post.publishedAt);
              const isPublished = publishDate <= new Date();
              const isScheduled = publishDate > new Date();
              
              return (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <h2 className="post-title">
                      {post.title}
                      {isPublished && (
                        <span className="post-status published">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Opublikowany
                        </span>
                      )}
                      {isScheduled && (
                        <span className="post-status scheduled">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          Zaplanowany
                        </span>
                      )}
                    </h2>
                    <div className="post-date">
                      Data publikacji: {formatDate(post.publishedAt)}
                      {isScheduled && (
                        <div className="scheduled-info">
                          Ten post zostanie automatycznie opublikowany w wybranym terminie.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="post-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEdit(post)}
                      disabled={isSubmitting}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edytuj
                    </button>
                    
                    {showConfirmDelete === post.id ? (
                      <div className="confirm-delete">
                        <span>Czy na pewno usunąć?</span>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          disabled={isSubmitting}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Tak
                        </button>
                        <button 
                          onClick={() => setShowConfirmDelete(null)}
                          disabled={isSubmitting}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          Nie
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="delete-button"
                        onClick={() => setShowConfirmDelete(post.id)}
                        disabled={isSubmitting}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Usuń
                      </button>
                    )}
                  </div>
                  
                  {post.imageUrl && (
                    <div className="post-image">
                      <img src={`http://localhost:3001${post.imageUrl}`} alt={post.title} />
                    </div>
                  )}
                  
                  <div 
                    className="post-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  ></div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="post-form-wrapper">
          <h2>{viewMode === 'add' ? 'Dodaj nowy post' : 'Edytuj post'}</h2>
          
          <form onSubmit={handleSubmit} className="post-form">
            <div className="form-group">
              <label htmlFor="title">Tytuł</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Treść</label>
              <div className="editor-container">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  modules={modules}
                  placeholder="Wprowadź treść posta..."
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="publishedAt">
                Data publikacji
                <span className="date-info">
                  {new Date(formData.publishedAt) > new Date() ? 
                    ' (post zostanie opublikowany w przyszłości)' : 
                    ' (post będzie widoczny od razu)'}
                </span>
              </label>
              <div className="date-picker-wrapper">
                <input
                  type="date"
                  id="publishedAt"
                  name="publishedAt"
                  value={formData.publishedAt}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <div className="date-actions">
                  <button 
                    type="button" 
                    className="date-action-btn today"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      publishedAt: new Date().toISOString().split('T')[0] 
                    }))}
                  >
                    Dziś
                  </button>
                  <button 
                    type="button" 
                    className="date-action-btn tomorrow"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFormData(prev => ({ 
                        ...prev, 
                        publishedAt: tomorrow.toISOString().split('T')[0] 
                      }));
                    }}
                  >
                    Jutro
                  </button>
                  <button 
                    type="button" 
                    className="date-action-btn next-week"
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setFormData(prev => ({ 
                        ...prev, 
                        publishedAt: nextWeek.toISOString().split('T')[0] 
                      }));
                    }}
                  >
                    Za tydzień
                  </button>
                </div>
              </div>
              <div className="date-explanation">
                <p>
                  <strong>Planowanie postów:</strong> Wybierz datę w przyszłości, aby post pojawił się automatycznie w wybranym dniu.
                  Posty zaplanowane na przyszłość nie będą widoczne dla użytkowników do czasu nadejścia daty publikacji.
                </p>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="image">
                {viewMode === 'edit' ? 'Zmień obrazek główny posta (opcjonalnie)' : 'Obrazek główny posta (opcjonalnie)'}
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
              />
              {previewUrl && (
                <div className="image-preview">
                  <img src={previewUrl} alt="Podgląd" />
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Anuluj
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    Przetwarzanie...
                  </>
                ) : viewMode === 'add' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Dodaj post
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Zapisz zmiany
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostsManagement; 