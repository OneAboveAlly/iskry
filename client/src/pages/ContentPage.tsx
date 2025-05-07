import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useParams } from 'react-router-dom';
import '../styles/ContentPage.css';
import '../styles/Announcements.css'; // Import our enhanced styles
import '../styles/Home.css'; // Import Home styles for news display
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import EnhancedEditor from '../components/EnhancedEditor';
import { Link } from 'react-router-dom';

interface PageContent {
  id: number;
  slug: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  publishedAt: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    surname: string;
  };
  comments?: Comment[];
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    id: number;
    name: string;
    surname: string;
  };
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  postId: number;
  createdAt: string;
  author: {
    id: number;
    name: string;
    surname: string;
  };
}

interface CommentPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface AnnouncementsResponse {
  announcements: Announcement[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
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

// Add new component for announcement actions
const AnnouncementActions: React.FC<{
  announcement: Announcement;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}> = ({ announcement, onEdit, onDelete, isAdmin }) => {
  if (!isAdmin) return null;

  return (
    <div className="announcement-actions">
      <button 
        className="edit-button"
        onClick={onEdit}
        title="Edytuj ogłoszenie"
      >
        <i className="fas fa-edit"></i>
      </button>
      <button 
        className="delete-button"
        onClick={onDelete}
        title="Usuń ogłoszenie"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );
};

// Add new component for announcement form
const AnnouncementForm: React.FC<{
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  error: string | null;
  success: string | null;
  isSubmitting: boolean;
  initialData?: {
    title: string;
    content: string;
    imageUrl: string | null;
  };
}> = ({ onSubmit, onCancel, error, success, isSubmitting, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }
    await onSubmit(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="add-post-form">
      <h3>{initialData ? 'Edytuj ogłoszenie' : 'Dodaj nowe ogłoszenie'}</h3>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Tytuł</label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Treść</label>
          <EnhancedEditor
            value={content}
            onChange={setContent}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="image">Obrazek (opcjonalnie)</label>
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
        
        <div className="form-buttons">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
          >
            Anuluj
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Zapisywanie...' : (initialData ? 'Zapisz zmiany' : 'Dodaj ogłoszenie')}
          </button>
        </div>
      </form>
    </div>
  );
};

// Add new interface for user's comment history
interface CommentHistory {
  lastCommentTime: number;
  commentCount: number;
}

const ContentPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [content, setContent] = useState<PageContent | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retries, setRetries] = useState<number>(0);
  const maxRetries = 3;
  const [randomQuote, setRandomQuote] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: null as File | null
  });
  const [addingPost, setAddingPost] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [postComments, setPostComments] = useState<Record<number, Comment[]>>({});
  const [commentContent, setCommentContent] = useState<Record<number, string>>({});
  const [addingComment, setAddingComment] = useState<Record<number, boolean>>({});
  const [commentsVisible, setCommentsVisible] = useState<Record<number, boolean>>({});
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newComments, setNewComments] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<number, boolean>>({});
  const [commentHistory, setCommentHistory] = useState<Record<number, CommentHistory>>({});
  const [showCaptcha, setShowCaptcha] = useState<Record<number, boolean>>({});
  const [captchaValue, setCaptchaValue] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<Record<number, string>>({});
  const [generatedCaptcha, setGeneratedCaptcha] = useState<Record<number, string>>({});
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'error' | 'success';
    message: string;
  }>({
    isOpen: false,
    type: 'error',
    message: ''
  });
  const [pagination, setPagination] = useState<Record<number, CommentPagination>>({});
  const [currentCommentPage, setCurrentCommentPage] = useState<Record<number, number>>({});
  const [deleteModal, setDeleteModal] = useState<{ postId: number | null, commentId: number | null, visible: boolean }>({ postId: null, commentId: null, visible: false });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pobierz numer strony z parametrów URL (dla paginacji)
  const currentPage = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    // Select a random spiritual quote
    if (slug === 'aktualnosci') {
      const quote = spiritualQuotes[Math.floor(Math.random() * spiritualQuotes.length)];
      setRandomQuote(quote);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      if (slug === 'aktualnosci') {
        console.log('Fetching posts for aktualnosci page');
        fetchPosts();
      } else {
        fetchPageContent();
      }
    }
  }, [slug]);

  const fetchPageContent = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching content for slug: ${slug}`);
      const response = await fetch(`http://localhost:3001/api/pages/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`Page not found for slug: ${slug}`);
          throw new Error('Strona nie została znaleziona');
        }
        console.error(`Error fetching page: ${response.status} ${response.statusText}`);
        throw new Error('Błąd podczas pobierania zawartości strony');
      }

      const data = await response.json();
      console.log('Fetched page content:', data);
      setContent(data);
    } catch (err) {
      console.error('Error fetching page content:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas ładowania strony');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/posts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const postsArray = Array.isArray(data) ? data : data.posts || [];
      
      // Filter posts to show only those with publication date in past or present
      const now = new Date();
      const publishedPosts = postsArray.filter((post: Post) => {
        const publishDate = new Date(post.publishedAt || post.createdAt);
        return publishDate <= now;
      });
      
      setPosts(publishedPosts);
      setFilteredPosts(publishedPosts);
      setError(null);
      
      // Initialize comments for each post
      const initialComments: { [key: number]: Comment[] } = {};
      const initialPagination: { [key: number]: CommentPagination } = {};
      const initialCurrentPage: { [key: number]: number } = {};
      
      // Fetch comments for each post
      for (const post of publishedPosts) {
        try {
          const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments?page=1&limit=5`);
          if (!response.ok) continue;
          
          const data = await response.json();
          initialComments[post.id] = data.comments || [];
          initialPagination[post.id] = data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: initialComments[post.id].length,
            itemsPerPage: 5
          };
          initialCurrentPage[post.id] = 1;
        } catch (err) {
          console.error(`Error fetching comments for post ${post.id}:`, err);
          initialComments[post.id] = [];
          initialPagination[post.id] = {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 5
          };
          initialCurrentPage[post.id] = 1;
        }
      }
      
      setComments(initialComments);
      setPagination(initialPagination);
      setCurrentCommentPage(initialCurrentPage);
      
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Nie udało się pobrać postów. Sprawdź połączenie internetowe.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetries(0); // Reset retries to trigger a new fetch
  };

  const handlePageChange = (page: number) => {
    // Aktualizuj URL przy zmianie strony
    setSearchParams({ page: page.toString() });
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

  const clearSearch = () => {
    setSearchTerm('');
  };

  const togglePostContent = (postId: number) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const truncateHtml = (html: string, maxLength: number = 150) => {
    if (!html) return '';
    
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

  const fixImagePaths = (content: string) => {
    if (!content) return '';
    
    // Zamień wszystkie referencje do /uploads/ na pełne URL
    return content.replace(
      /<img(.*?)src=["'](\/uploads\/[^"']+)["']/gi, 
      '<img$1src="http://localhost:3001$2"'
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPost(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content: string) => {
    setNewPost(prev => ({ ...prev, content }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPost(prev => ({ ...prev, image: file }));
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setNewPost({
      title: '',
      content: '',
      image: null
    });
    setPreviewUrl(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowAddForm(true);
  };

  const handleDelete = async (announcement: Announcement) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Brak tokenu autoryzacji');
      
      const response = await fetch(`http://localhost:3001/api/announcements/${announcement.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Błąd podczas usuwania ogłoszenia');
      
      setSuccess('Ogłoszenie zostało pomyślnie usunięte');
      setRetries(0);
    } catch (err) {
      setError('Błąd podczas usuwania ogłoszenia. Spróbuj ponownie.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingPost) return;
    
    if (!isAuthenticated || !user?.isAdmin) {
      setError('Brak uprawnień do dodawania/edycji ogłoszeń.');
      return;
    }
    
    setAddingPost(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('content', newPost.content);
      
      if (newPost.image) {
        formData.append('image', newPost.image);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Brak tokenu autoryzacji.');
        setAddingPost(false);
        return;
      }
      
      const url = editingAnnouncement 
        ? `http://localhost:3001/api/announcements/${editingAnnouncement.id}`
        : 'http://localhost:3001/api/announcements';
      
      const response = await fetch(url, {
        method: editingAnnouncement ? 'PUT' : 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.status} ${response.statusText}`);
      }
      
      setSuccess(editingAnnouncement ? 'Ogłoszenie zostało pomyślnie zaktualizowane' : 'Ogłoszenie zostało pomyślnie dodane');
      resetForm();
      setRetries(0);
      setShowAddForm(false);
      setEditingAnnouncement(null);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Błąd podczas dodawania/edycji ogłoszenia. Spróbuj ponownie.');
      console.error('Error adding/editing announcement:', err);
    } finally {
      setAddingPost(false);
    }
  };

  const handleCaptchaChange = (postId: number, value: string) => {
    setCaptchaInput(prev => ({ ...prev, [postId]: value }));
  };

  const toggleComments = (postId: number) => {
    setCommentsVisible(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!comments[postId]) {
      fetchComments(postId);
    }
  };

  const handleCommentChange = (postId: number, content: string) => {
    setNewComments(prev => ({ ...prev, [postId]: content }));
  };

  const fetchComments = async (postId: number, page: number = 1) => {
    try {
      console.log(`Fetching comments for post: ${postId}, page: ${page}`);
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments?page=${page}&limit=5`);
      
      if (!response.ok) {
        console.error(`Failed to fetch comments: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Fetched comments data:', data);
      
      const fetchedComments = data.comments || [];
      const paginationData = data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: fetchedComments.length,
        itemsPerPage: 5
      };
      
      console.log(`Fetched ${fetchedComments.length} comments for post ${postId}`);
      
      setComments(prev => ({
        ...prev,
        [postId]: fetchedComments
      }));

      setPagination(prev => ({
        ...prev,
        [postId]: paginationData
      }));

      setCurrentCommentPage(prev => ({
        ...prev,
        [postId]: page
      }));
    } catch (err) {
      console.error(`Error fetching comments for post ${postId}:`, err);
    }
  };

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaValue(result);
    return result;
  };

  const addComment = async (postId: number) => {
    if (!newComments[postId]?.trim()) return;
    
    if (showCaptcha[postId] && captchaInput[postId] !== captchaValue) {
      setModal({
        isOpen: true,
        type: 'error',
        message: 'Nieprawidłowy kod CAPTCHA'
      });
      return;
    }

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newComments[postId],
          captcha: showCaptcha[postId] ? captchaInput[postId] : undefined,
          notifyParticipants: true
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const newComment = await response.json();
      
      if (!newComment.author && user) {
        newComment.author = {
          id: user?.id || 0,
          name: user?.name || 'Nieznany',
          surname: user?.surname || 'użytkownik'
        };
      }

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));

      setNewComments(prev => ({ ...prev, [postId]: '' }));
      setShowCaptcha(prev => ({ ...prev, [postId]: false }));
      setCaptchaInput(prev => ({ ...prev, [postId]: '' }));
      
      setModal({
        isOpen: true,
        type: 'success',
        message: 'Komentarz został dodany pomyślnie'
      });

    } catch (err) {
      console.error('Error adding comment:', err);
      setModal({
        isOpen: true,
        type: 'error',
        message: 'Wystąpił błąd podczas dodawania komentarza'
      });
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleSearch = (term: string) => {
    console.log('Handling search with term:', term);
    setSearchTerm(term);
    
    // Ensure posts is an array
    const currentPosts = Array.isArray(posts) ? posts : [];
    
    if (term.trim() === '') {
      console.log('Empty search term, setting filteredPosts to all posts');
      setFilteredPosts(currentPosts);
    } else {
      console.log('Filtering posts with term:', term);
      const filtered = currentPosts.filter(post => 
        post.title.toLowerCase().includes(term.toLowerCase()) ||
        post.content.toLowerCase().includes(term.toLowerCase())
      );
      console.log('Filtered posts:', filtered);
      setFilteredPosts(filtered);
    }
  };

  const handleCommentPageChange = (postId: number, page: number) => {
    fetchComments(postId, page);
  };

  const Modal = () => {
    if (!modal.isOpen) return null;
    
    return (
      <div className="modal-overlay">
        <div className={`modal ${modal.type}`}>
          <div className="modal-content">
            <p>{modal.message}</p>
            <button 
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="modal-button"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const openDeleteModal = (postId: number, commentId: number) => {
    document.body.style.setProperty('--modal-bg', 'none');
    document.querySelector('.modal-overlay')?.setAttribute('style', 'background: none !important');
    setDeleteModal({ postId, commentId, visible: true });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ postId: null, commentId: null, visible: false });
  };

  const handleDeleteComment = async () => {
    if (!deleteModal.postId || !deleteModal.commentId) return;
    setDeleteLoading(true);
    try {
      await fetch(`http://localhost:3001/api/posts/${deleteModal.postId}/comments/${deleteModal.commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchComments(deleteModal.postId, currentCommentPage[deleteModal.postId] || 1);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeleteLoading(false);
      closeDeleteModal();
    }
  };

  useEffect(() => {
    if (deleteModal.visible) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [deleteModal.visible]);

  if (loading) {
    return (
      <div className="content-page loading">
        <div className="spinner"></div>
        <p>Ładowanie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-page error">
        <div className="error-icon">!</div>
        <h2>Wystąpił błąd</h2>
        <p>{error}</p>
        <button className="retry-button" onClick={fetchPosts}>
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (slug === 'aktualnosci') {
    console.log('Rendering aktualnosci page with filteredPosts:', filteredPosts);
    
    // Ensure filteredPosts is an array before rendering
    const postsToRender = Array.isArray(filteredPosts) ? filteredPosts : [];
    
    return (
      <div className="content-page">
        <Modal />
        <div className="content-container news-content-container with-transparent-bg">
          <div className="news-header">
            <h1>Aktualności</h1>
            <div className="search-container">
              <input
                type="text"
                placeholder="Szukaj postów..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => handleSearch('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="posts-container">
            {postsToRender.length === 0 ? (
              <div className="posts-empty">
                {searchTerm ? 'Brak wyników wyszukiwania' : 'Brak aktualności do wyświetlenia'}
              </div>
            ) : (
              postsToRender
                .filter(post => post !== null)
                .map(post => (
                <div key={post.id} id={`post-${post.id}`} className="post-card">
                  <h3 className="post-title">{post.title || 'Bez tytułu'}</h3>
                  <div className="post-meta">
                    <span className="post-author">
                      {post.author?.name || 'Nieznany'} {post.author?.surname || 'użytkownik'}
                    </span>
                    <span className="post-date">
                      {formatDate(post.publishedAt || new Date().toISOString())}
                    </span>
                  </div>
                  
                  {post.imageUrl && (
                    <div className="post-image">
                      <img
                        src={post.imageUrl.startsWith('/uploads/') 
                          ? `http://localhost:3001${post.imageUrl}` 
                          : post.imageUrl}
                        alt={post.title || 'Post image'}
                      />
                    </div>
                  )}
                  
                  <div className="post-content">
                    {expandedPosts[post.id] ? (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: fixImagePaths(post.content || '') 
                        }} 
                      />
                    ) : (
                      <>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: truncateHtml(fixImagePaths(post.content || ''))
                          }}
                        />
                        {(post.content?.length || 0) > 150 && (
                          <button 
                            className="read-more" 
                            onClick={() => togglePostContent(post.id)}
                          >
                            Czytaj więcej
                          </button>
                        )}
                      </>
                    )}
                    
                    {expandedPosts[post.id] && (post.content?.length || 0) > 150 && (
                      <button 
                        className="read-less" 
                        onClick={() => togglePostContent(post.id)}
                      >
                        Pokaż mniej
                      </button>
                    )}
                  </div>
                  
                  <div className="post-actions">
                    <button
                      className="btn-comments"
                      onClick={() => toggleComments(post.id)}
                    >
                      {commentsVisible[post.id] 
                        ? 'Ukryj komentarze' 
                        : `Komentarze (${pagination[post.id]?.totalItems || 0})`}
                    </button>
                  </div>
                  
                  {commentsVisible[post.id] && (
                    <div className="comments-section">
                      <h4>Komentarze</h4>
                      
                      {isAuthenticated ? (
                        <div className="add-comment">
                          <textarea
                            placeholder="Dodaj komentarz..."
                            value={newComments[post.id] || ''}
                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          />
                          {showCaptcha[post.id] && (
                            <div className="captcha-container">
                              <div className="captcha-display">{captchaValue}</div>
                              <input
                                type="text"
                                placeholder="Wpisz kod CAPTCHA"
                                value={captchaInput[post.id] || ''}
                                onChange={(e) => handleCaptchaChange(post.id, e.target.value)}
                                className="captcha-input"
                              />
                            </div>
                          )}
                          <button
                            onClick={() => {
                              if (!showCaptcha[post.id]) {
                                setShowCaptcha(prev => ({ ...prev, [post.id]: true }));
                                generateCaptcha();
                              } else {
                                addComment(post.id);
                              }
                            }}
                            disabled={submittingComment[post.id]}
                          >
                            {submittingComment[post.id] ? 'Dodawanie...' : 'Dodaj komentarz'}
                          </button>
                        </div>
                      ) : (
                        <div className="auth-prompt">
                          <p>Zaloguj się, aby dodać komentarz</p>
                          <Link to="/login" className="login-link">Zaloguj się</Link>
                        </div>
                      )}

                      <div className="comments-list">
                        {comments[post.id]?.length > 0 ? (
                          <>
                            {comments[post.id].map((comment) => (
                              <div key={comment.id} className="comment">
                                <div className="comment-header">
                                  <span className="comment-author">{comment.author?.name} {comment.author?.surname}</span>
                                  <span className="comment-date">{new Date(comment.createdAt).toLocaleString('pl-PL')}</span>
                                  {user?.isAdmin && (
                                    <button
                                      className="delete-comment-btn"
                                      onClick={() => openDeleteModal(post.id, comment.id)}
                                      style={{ marginLeft: '1rem', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                                      title="Usuń komentarz"
                                    >
                                      Usuń komentarz
                                    </button>
                                  )}
                                </div>
                                <div className="comment-content">{comment.content}</div>
                              </div>
                            ))}
                            
                            {pagination[post.id]?.totalPages > 1 && (
                              <div className="comments-pagination">
                                <button
                                  onClick={() => handleCommentPageChange(post.id, pagination[post.id].currentPage - 1)}
                                  disabled={pagination[post.id].currentPage === 1}
                                >
                                  Poprzednia
                                </button>
                                <span>
                                  Strona {pagination[post.id].currentPage} z {pagination[post.id].totalPages}
                                </span>
                                <button
                                  onClick={() => handleCommentPageChange(post.id, pagination[post.id].currentPage + 1)}
                                  disabled={pagination[post.id].currentPage === pagination[post.id].totalPages}
                                >
                                  Następna
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="no-comments">
                            Brak komentarzy. Bądź pierwszy, który skomentuje!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        {deleteModal.visible && (
          <div id="delete-modal" style={{
            position: 'fixed',
            zIndex: 1000,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(5px)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            minWidth: '320px',
            maxWidth: '90vw',
            animation: 'none',
            opacity: 1
          }}>
            <div className="modal-content">
              <h3 style={{ marginBottom: '1.5rem', color: '#333', fontSize: '1.2rem' }}>Czy na pewno chcesz usunąć ten komentarz?</h3>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  onClick={closeDeleteModal} 
                  disabled={deleteLoading}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#eee',
                    color: '#333'
                  }}
                >
                  Anuluj
                </button>
                <button 
                  onClick={handleDeleteComment} 
                  disabled={deleteLoading}
                  style={{
                    padding: '0.5rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: '#e53935',
                    color: '#fff',
                    opacity: deleteLoading ? 0.6 : 1
                  }}
                >
                  {deleteLoading ? 'Usuwanie...' : 'Usuń'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="content-page">
      <Modal />
      <div className={`content-container ${
        ['o-mnie', 'istnienie', 'rytual-przykladania', 'droga-rozwoju', 'cennik'].includes(slug || '') 
          ? 'with-transparent-bg' 
          : ''
      }`}>
        {content && (
          <>
            <h1>{content.title}</h1>
            <div 
              className="page-content"
              dangerouslySetInnerHTML={{ __html: content.content }} 
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ContentPage; 