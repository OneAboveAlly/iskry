import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import EnhancedEditor from './EnhancedEditor';
import BasicCKEditor from './BasicCKEditor';
import '../styles/PageEditor.css';
import '../styles/PageEditorFixes.css';

interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  imageUrl: string | null;
  backgroundImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageEditorProps {
  pageSlug: string | null;
  onPageCreated: (page: Page) => void;
  onPageUpdated: (page: Page) => void;
  onPageDeleted: (slug: string) => void;
}

const PageEditor: React.FC<PageEditorProps> = ({ pageSlug, onPageCreated, onPageUpdated, onPageDeleted }) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // New states for background image
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editorView, setEditorView] = useState<'edit' | 'preview'>('edit');
  const [editorError, setEditorError] = useState<boolean>(false);

  // Add a new state variable to track which editor to use
  const [useBasicEditor, setUseBasicEditor] = useState(false);

  // Sprawdź widoczność edytora
  useEffect(() => {
    console.log("PageEditor checking visibility");
    const checkEditorVisibility = () => {
      const editorContainers = document.querySelectorAll('.enhanced-quill-editor, .quill, .ql-editor');
      
      editorContainers.forEach((container, index) => {
        const style = window.getComputedStyle(container as Element);
        console.log(`Editor container ${index}: display=${style.display}, visibility=${style.visibility}`);
      });
    };
    
    // Sprawdź po załadowaniu i po krótkim opóźnieniu
    checkEditorVisibility();
    const timer1 = setTimeout(checkEditorVisibility, 500);
    const timer2 = setTimeout(() => {
      // Force visibility after a delay
      const editorElements = document.querySelectorAll('.ql-toolbar, .ql-container, .ql-editor, .quill, .react-quill, .enhanced-quill-editor');
      editorElements.forEach(element => {
        const el = element as HTMLElement;
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
      });
      console.log("Forced editor visibility");
    }, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Pobierz dane strony po wybraniu z listy
  useEffect(() => {
    if (pageSlug) {
      fetchPageData(pageSlug);
    } else {
      // Reset form for new page
      resetForm();
    }
    console.log("PageEditor initialized with pageSlug:", pageSlug);
  }, [pageSlug, token]);

  const fetchPageData = async (slug: string) => {
    try {
      setFetchLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/pages/${slug}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać danych strony');
      }
      
      const page = await response.json();
      setTitle(page.title);
      setSlug(page.slug);
      setContent(page.content);
      setImageUrl(page.imageUrl);
      setBackgroundImageUrl(page.backgroundImageUrl || null);
      
      if (page.imageUrl) {
        setImagePreview(`http://localhost:3001${page.imageUrl}`);
      } else {
        setImagePreview(null);
      }
      
      if (page.backgroundImageUrl) {
        setBackgroundImagePreview(`http://localhost:3001${page.backgroundImageUrl}`);
      } else {
        setBackgroundImagePreview(null);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Błąd pobierania danych strony:', err);
    } finally {
      setFetchLoading(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setSlug('');
    setContent('');
    setImageUrl(null);
    setImageFile(null);
    setImagePreview(null);
    setBackgroundImageUrl(null);
    setBackgroundImageFile(null);
    setBackgroundImagePreview(null);
    setError(null);
    setSuccess(null);
    setConfirmDelete(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Image change detected", e.target.files);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Sprawdź typ pliku
      if (!file.type.match('image.*')) {
        setError('Proszę wybrać plik obrazu (jpg, png, gif)');
        return;
      }
      
      // Sprawdź rozmiar pliku (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Rozmiar obrazu nie może przekraczać 5MB');
        return;
      }
      
      setImageFile(file);
      setError(null);
      
      // Podgląd obrazu
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setImagePreview(event.target.result as string);
          console.log("Image preview set", event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // New handler for background image change
  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Background image change detected", e.target.files);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Sprawdź typ pliku
      if (!file.type.match('image.*')) {
        setError('Proszę wybrać plik obrazu (jpg, png, gif)');
        return;
      }
      
      // Sprawdź rozmiar pliku (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Rozmiar obrazu tła nie może przekraczać 5MB');
        return;
      }
      
      setBackgroundImageFile(file);
      setError(null);
      
      // Podgląd obrazu tła
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setBackgroundImagePreview(event.target.result as string);
          console.log("Background image preview set", event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // New handler for removing background image
  const handleRemoveBackgroundImage = () => {
    setBackgroundImageFile(null);
    setBackgroundImagePreview(null);
    setBackgroundImageUrl(null);
    if (backgroundFileInputRef.current) {
      backgroundFileInputRef.current.value = '';
    }
  };
  
  const generateSlugFromTitle = (titleStr: string) => {
    // Konwersja tytułu na slug: małe litery, bez polskich znaków, spacje jako myślniki
    return titleStr
      .toLowerCase()
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
      .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Jeśli to nowa strona lub slug nie był edytowany ręcznie, wygeneruj go z tytułu
    if (!pageSlug) {
      setSlug(generateSlugFromTitle(newTitle));
    }
  };
  
  const uploadImage = async (file: File | null, endpoint: string = 'upload'): Promise<string | null> => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`http://localhost:3001/api/pages/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Nie udało się przesłać obrazu do ${endpoint}`);
      }
      
      const data = await response.json();
      return data.imageUrl;
    } catch (err) {
      console.error(`Błąd przesyłania obrazu do ${endpoint}:`, err);
      throw err; // Przekaż błąd dalej
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Walidacja
    if (!title.trim()) {
      setError('Proszę podać tytuł strony');
      return;
    }
    
    if (!slug.trim()) {
      setError('Proszę podać slug strony');
      return;
    }
    
    if (!content.trim()) {
      setError('Proszę dodać treść strony');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Upload obrazów jeśli są nowe
      let finalImageUrl = imageUrl;
      let finalBackgroundImageUrl = backgroundImageUrl;
      
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile, 'upload');
      }
      
      if (backgroundImageFile) {
        finalBackgroundImageUrl = await uploadImage(backgroundImageFile, 'upload-background');
      }
      
      const pageData = {
        title,
        slug,
        content,
        imageUrl: finalImageUrl,
        backgroundImageUrl: finalBackgroundImageUrl
      };
      
      let response;
      let successMessage;
      
      if (pageSlug) {
        // Aktualizacja istniejącej strony
        response = await fetch(`http://localhost:3001/api/pages/${pageSlug}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(pageData)
        });
        successMessage = 'Strona została zaktualizowana';
      } else {
        // Tworzenie nowej strony
        response = await fetch('http://localhost:3001/api/pages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(pageData)
        });
        successMessage = 'Strona została utworzona';
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Wystąpił błąd podczas zapisywania strony');
      }
      
      const savedPage = await response.json();
      
      if (pageSlug) {
        onPageUpdated(savedPage);
      } else {
        onPageCreated(savedPage);
        // Reset form po utworzeniu nowej strony
        resetForm();
      }
      
      setSuccess(successMessage);
      
      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
      console.error('Błąd zapisywania strony:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!pageSlug) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3001/api/pages/${pageSlug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nie udało się usunąć strony');
      }
      
      onPageDeleted(pageSlug);
      resetForm();
      setSuccess('Strona została usunięta');
      
      // Wyczyść komunikat sukcesu po 3 sekundach
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
      console.error('Błąd usuwania strony:', err);
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  const handleContentChange = (content: string) => {
    try {
      setContent(content);
      console.log("Content updated successfully");
    } catch (error) {
      console.error("Error updating content:", error);
      setEditorError(true); // Switch to fallback if error occurs
    }
  };

  const handleFallbackContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Nowa funkcja do przełączania między trybem edycji a podglądem
  const toggleEditorView = () => {
    setEditorView(prev => prev === 'edit' ? 'preview' : 'edit');
  };

  // Uproszczone komponenty dla Quill
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'header': [1, 2, 3, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet',
    'link', 'image'
  ];

  // W przypadku gdy EnhancedQuillEditor nie działa, użyj bezpośrednio ReactQuill
  const fallbackEditor = () => (
    <React.Fragment>
      {/* Placeholder for fallback editor */}
    </React.Fragment>
  );

  // Updated renderEditor function to try both editors
  const renderEditor = () => {
    try {
      if (useBasicEditor) {
        console.log("Using basic CKEditor as fallback");
        return (
          <BasicCKEditor
            value={content}
            onChange={handleContentChange}
          />
        );
      } else {
        console.log("Using enhanced CKEditor");
        return (
          <EnhancedEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Zacznij tworzyć zawartość strony..."
          />
        );
      }
    } catch (error) {
      console.error("Error rendering enhanced editor:", error);
      setEditorError(true);
      return fallbackEditor();
    }
  };

  if (fetchLoading) {
    return <div className="editor-loading">Ładowanie danych strony...</div>;
  }

  return (
    <div className="page-editor">
      {fetchLoading ? (
        <div className="editor-loading">Ładowanie danych strony...</div>
      ) : (
        <>
          {error && <div className="editor-error">{error}</div>}
          {success && <div className="editor-success">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Tytuł strony</label>
              <input
                type="text"
                id="title"
                className="form-control"
                value={title}
                onChange={handleTitleChange}
                placeholder="Wprowadź tytuł strony"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="slug">Identyfikator URL (slug)</label>
              <div className="slug-input">
                <span className="slug-prefix">http://localhost:5173/</span>
                <input
                  type="text"
                  id="slug"
                  className="form-control"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="identyfikator-url"
                  required
                />
              </div>
              <div className="slug-help">
                Identyfikator URL powinien zawierać tylko małe litery, cyfry i myślniki.
                Np. dla strony "O nas" możesz użyć "o-nas".
              </div>
            </div>
            
            <div className="form-group">
              <div className="editor-controls">
                <label htmlFor="content">Treść strony</label>
                <div className="editor-control-buttons">
                  {editorError && (
                    <button 
                      type="button" 
                      className="reset-editor-btn"
                      onClick={() => setEditorError(false)}
                    >
                      Przywróć edytor
                    </button>
                  )}
                  <button 
                    type="button" 
                    className={`view-toggle-btn ${editorView === 'preview' ? 'preview-active' : ''}`}
                    onClick={toggleEditorView}
                  >
                    {editorView === 'edit' ? 'Podgląd' : 'Edytuj'}
                  </button>
                </div>
              </div>
              
              {editorView === 'edit' ? (
                <div className="content-editor" style={{minHeight: "300px", display: "block", visibility: "visible"}}>
                  {editorError ? (
                    <div className="fallback-editor">
                      <div className="editor-error-message">
                        Wystąpił problem z zaawansowanym edytorem. 
                        <button 
                          onClick={() => {
                            setUseBasicEditor(true);
                            setEditorError(false);
                          }}
                          style={{marginLeft: '10px', padding: '3px 8px'}}
                        >
                          Użyj prostego edytora
                        </button>
                        <button 
                          onClick={() => {
                            setUseBasicEditor(false);
                            setEditorError(false);
                          }}
                          style={{marginLeft: '10px', padding: '3px 8px'}}
                        >
                          Spróbuj ponownie
                        </button>
                      </div>
                      {fallbackEditor()}
                    </div>
                  ) : (
                    renderEditor()
                  )}
                </div>
              ) : (
                <div className="content-preview">
                  <div 
                    className="preview-container"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="image" className="image-upload-label">Obrazek nagłówkowy (opcjonalnie)</label>
              <input
                type="file"
                id="image"
                ref={fileInputRef}
                className="form-control"
                onChange={handleImageChange}
                accept="image/*"
              />
              <div className="image-upload-help">
                Wybierz obrazek nagłówkowy dla strony (maksymalny rozmiar: 5MB)
              </div>
              <div className="image-upload-container">
                {imagePreview ? (
                  <div className="image-preview-container">
                    <img
                      src={imagePreview}
                      alt="Podgląd"
                      className="image-preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                    >
                      Usuń obrazek
                    </button>
                  </div>
                ) : (
                  <div className="no-image-message">
                    Nie wybrano obrazka. Wybierz plik z komputera.
                  </div>
                )}
              </div>
            </div>
            
            {/* New background image section */}
            <div className="form-group">
              <label htmlFor="backgroundImage" className="image-upload-label">Obrazek tła strony (opcjonalnie)</label>
              <input
                type="file"
                id="backgroundImage"
                ref={backgroundFileInputRef}
                className="form-control"
                onChange={handleBackgroundImageChange}
                accept="image/*"
              />
              <div className="image-upload-help">
                Wybierz obrazek tła dla strony (maksymalny rozmiar: 5MB). Ten obrazek będzie wyświetlany jako tło całej strony.
              </div>
              <div className="image-upload-container">
                {backgroundImagePreview ? (
                  <div className="image-preview-container background-preview">
                    <div className="background-image-wrapper">
                      <img
                        src={backgroundImagePreview}
                        alt="Podgląd tła"
                        className="background-image-preview"
                      />
                    </div>
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveBackgroundImage}
                    >
                      Usuń obrazek tła
                    </button>
                  </div>
                ) : (
                  <div className="no-image-message">
                    Nie wybrano obrazka tła. Wybierz plik z komputera.
                  </div>
                )}
              </div>
            </div>
            
            <div className="editor-actions">
              {pageSlug ? (
                <div className="delete-container">
                  {confirmDelete ? (
                    <div className="confirm-delete">
                      <span>Czy na pewno chcesz usunąć tę stronę?</span>
                      <button
                        type="button"
                        className="btn-confirm-yes"
                        onClick={handleDelete}
                      >
                        Tak
                      </button>
                      <button
                        type="button"
                        className="btn-confirm-no"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Nie
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Usuń stronę
                    </button>
                  )}
                </div>
              ) : (
                <div></div>
              )}
              
              <div className="save-container">
                <button
                  type="submit"
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? 'Zapisywanie...' : pageSlug ? 'Aktualizuj stronę' : 'Utwórz stronę'}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default PageEditor; 