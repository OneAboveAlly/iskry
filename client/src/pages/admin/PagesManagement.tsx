import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageEditor from '../../components/PageEditor';
import PagesList from '../../components/PagesList';
import '../../styles/PagesManagement.css';
import '../../styles/PageEditorFixes.css';

interface Page {
  id: number;
  slug: string;
  title: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const PagesManagement: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState<boolean>(true);
  const [debug, setDebug] = useState<string | null>(null);

  // Memoizowana funkcja do pobierania stron
  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching pages with token:', token ? 'Token exists' : 'No token');
      
      // Najpierw próba pobrania z autoryzacją
      let response = await fetch('http://localhost:3001/api/pages', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });
      
      // Jeśli nie mamy uprawnień lub token nie działa, spróbuj bez autoryzacji
      if (response.status === 401 || response.status === 403) {
        console.log('Authorization failed, trying without token');
        response = await fetch('http://localhost:3001/api/pages');
      }
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać listy stron');
      }
      
      const data = await response.json();
      console.log('Pages data received:', data);
      
      if (Array.isArray(data) && data.length === 0) {
        console.warn('Received empty pages array from server');
      }
      
      setPages(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Błąd pobierania stron:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Wywołanie pobierania stron po załadowaniu komponentu i zmianie tokena
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Check editor visibility after component mount
  useEffect(() => {
    setTimeout(() => {
      const editorContainer = document.getElementById('page-editor-container');
      if (editorContainer) {
        const style = window.getComputedStyle(editorContainer);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden';
        setDebug(`Editor container exists: yes, visibility: ${isVisible ? 'visible' : 'hidden'}, display: ${style.display}`);
      } else {
        setDebug('Editor container does not exist in DOM');
      }
    }, 500);
  }, []);

  // Funkcja odświeżająca listę stron
  const refreshPages = () => {
    fetchPages();
  };

  const handlePageCreated = (newPage: Page) => {
    setPages([...pages, newPage]);
    refreshPages(); // Odśwież listę po utworzeniu
  };

  const handlePageUpdated = (updatedPage: any) => {
    setPages(pages.map(page => 
      page.slug === updatedPage.slug ? updatedPage : page
    ));
    refreshPages(); // Odśwież listę po aktualizacji
  };

  const handlePageDeleted = (slug: string) => {
    setPages(pages.filter(page => page.slug !== slug));
    if (selectedPage === slug) {
      setSelectedPage(null);
    }
    refreshPages(); // Odśwież listę po usunięciu
  };

  // Toggle editor visibility for debugging
  const toggleEditorVisibility = () => {
    setEditorVisible(prev => !prev);
    console.log("Editor visibility toggled:", !editorVisible);
    
    // Force re-check visibility
    setTimeout(() => {
      const editorContainer = document.getElementById('page-editor-container');
      if (editorContainer) {
        const style = window.getComputedStyle(editorContainer);
        setDebug(`After toggle - visibility: ${style.visibility}, display: ${style.display}`);
      }
    }, 100);
  };

  // Dodaj funkcję do tworzenia domyślnych stron
  const createDefaultPages = async () => {
    if (!token) {
      setError('Musisz być zalogowany jako administrator, aby utworzyć domyślne strony');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:3001/api/pages/create-defaults', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nie udało się utworzyć domyślnych stron');
      }
      
      const data = await response.json();
      console.log('Default pages created:', data);
      setPages(data);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Błąd tworzenia domyślnych stron:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pages-management">
      <h1 className="page-title">Zarządzanie treściami stron</h1>
      
      {/* Debug information */}
      {debug && (
        <div style={{ 
          padding: '10px', 
          background: '#f5f5f5', 
          border: '1px solid #ddd',
          margin: '10px 0',
          fontSize: '12px'
        }}>
          Debug: {debug}
          <div style={{marginTop: '5px'}}>
            <button 
              onClick={() => {
                // Force reload editor components
                const editorElements = document.querySelectorAll('.ql-toolbar, .ql-container, .ql-editor, .quill, .react-quill, .enhanced-quill-editor');
                editorElements.forEach(element => {
                  const el = element as HTMLElement;
                  el.style.display = 'block';
                  el.style.visibility = 'visible';
                  el.style.opacity = '1';
                });
                setDebug('Editor visibility forced at ' + new Date().toLocaleTimeString());
              }} 
              style={{padding: '3px 8px', fontSize: '12px', marginRight: '5px'}}
            >
              Force Editor Visibility
            </button>
            <button 
              onClick={() => {
                window.location.reload();
              }} 
              style={{padding: '3px 8px', fontSize: '12px'}}
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      
      {/* Debug button for development */}
      <div style={{
        display: 'flex',
        position: 'absolute',
        top: '10px',
        right: '10px',
        gap: '5px'
      }}>
        <button 
          onClick={toggleEditorVisibility} 
          className="debug-button"
          style={{ 
            padding: '5px 10px',
            backgroundColor: editorVisible ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {editorVisible ? 'Hide Editor' : 'Show Editor'}
        </button>
        <button 
          onClick={() => setDebug(debug ? null : 'Debug mode enabled at ' + new Date().toLocaleTimeString())} 
          style={{ 
            padding: '5px 10px',
            backgroundColor: debug ? '#2196F3' : '#9E9E9E',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {debug ? 'Hide Debug' : 'Show Debug'}
        </button>
      </div>
      
      <div className="pages-grid">
        <div className="pages-list-container">
          <div className="card-header">
            <h2>Lista stron</h2>
            <div className="card-actions">
              <button 
                className="refresh-btn"
                onClick={refreshPages}
                disabled={loading}
              >
                {loading ? 'Odświeżanie...' : 'Odśwież'}
              </button>
              <button 
                className="new-page-btn"
                onClick={() => setSelectedPage(null)}
              >
                + Nowa strona
              </button>
            </div>
          </div>
          
          <div className="card-content">
            {loading ? (
              <div className="loading-spinner">Ładowanie stron...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                {pages.length === 0 && (
                  <div className="empty-pages-container">
                    <p>Brak stron w bazie danych.</p>
                    <button 
                      className="create-defaults-btn"
                      onClick={createDefaultPages}
                      disabled={loading}
                    >
                      Utwórz domyślne strony
                    </button>
                  </div>
                )}
                <PagesList 
                  pages={pages} 
                  selectedSlug={selectedPage}
                  onSelectPage={(slug) => setSelectedPage(slug)}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Always render the editor container but use CSS to control visibility */}
        <div 
          className="page-editor-container" 
          id="page-editor-container"
          style={{ 
            display: editorVisible ? 'block' : 'none',
            visibility: editorVisible ? 'visible' : 'hidden'
          }}
        >
          <div className="card-header">
            <h2>{selectedPage ? 'Edytuj stronę' : 'Utwórz nową stronę'}</h2>
          </div>
          
          <div className="card-content">
            <PageEditor 
              pageSlug={selectedPage}
              onPageCreated={handlePageCreated}
              onPageUpdated={handlePageUpdated}
              onPageDeleted={handlePageDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagesManagement; 