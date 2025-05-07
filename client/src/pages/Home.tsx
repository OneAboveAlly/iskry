import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EnhancedEditor from '../components/EnhancedEditor';
import '../styles/Home.css';

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

interface PublicAnnouncement {
  id: number;
  title: string;
  content: string;
  link?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    surname: string;
  };
}

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    image: null as File | null
  });
  const [addingPost, setAddingPost] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselImages = [
    '/images/carousel/karuz.png',
    '/images/carousel/karuz2.png',
    '/images/carousel/ryt.png',
  ];
  
  // Carousel content for each slide
  const carouselContent = [
    {
      title: "Wiedza duchowa. Praktyka. Przebudzenie",
      description: "Odkryj swoją duchową ścieżkę"
    },
    {
      title: "Rozpocznij swoją przygodę już dziś",
      description: "Dołącz do naszej społeczności i rozwijaj się duchowo",
      button: {
        text: "Zarejestruj się",
        link: "/register"
      }
    },
    {
      title: "Rytuał przykładania",
      description: "Poznaj wyjątkową metodę transformacji energetycznej",
      button: {
        text: "Poznaj rytuał",
        link: "/rytual-przykladania"
      }
    }
  ];

  // New state for comments
  const [postComments, setPostComments] = useState<{ [key: number]: Comment[] }>({});
  const [commentContent, setCommentContent] = useState<{ [key: number]: string }>({});
  const [addingComment, setAddingComment] = useState<{ [key: number]: boolean }>({});
  const [expandedPosts, setExpandedPosts] = useState<{ [key: number]: boolean }>({});

  // CAPTCHA state
  const [captchaValue, setCaptchaValue] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<{ [key: number]: string }>({});
  const [showCaptcha, setShowCaptcha] = useState<{ [key: number]: boolean }>({});

  // Comment pagination state
  const [commentPagination, setCommentPagination] = useState<Record<number, CommentPagination>>({});
  const [currentCommentPage, setCurrentCommentPage] = useState<Record<number, number>>({});

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ postId: number | null, commentId: number | null, visible: boolean }>({ postId: null, commentId: null, visible: false });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prevSlide => 
        prevSlide === carouselImages.length - 1 ? 0 : prevSlide + 1
      );
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Function to manually change slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Function to go to next slide
  const nextSlide = () => {
    setCurrentSlide(prevSlide => 
      prevSlide === carouselImages.length - 1 ? 0 : prevSlide + 1
    );
  };

  // Function to go to previous slide
  const prevSlide = () => {
    setCurrentSlide(prevSlide => 
      prevSlide === 0 ? carouselImages.length - 1 : prevSlide - 1
    );
  };

  // Funkcja do pobierania postów
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
      
      setPostComments(initialComments);
      setCommentPagination(initialPagination);
      setCurrentCommentPage(initialCurrentPage);
      
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Nie udało się pobrać postów. Sprawdź połączenie internetowe.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Add useEffect to fetch comments when posts are loaded
  useEffect(() => {
    if (posts.length > 0) {
      fetchCommentCounts();
    }
  }, [posts]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addingPost) return;
    
    // Validate the form
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('Tytuł i treść są wymagane');
      return;
    }
    
    setAddingPost(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('content', newPost.content);
      formData.append('publishedAt', new Date().toISOString());
      
      if (newPost.image) {
        formData.append('image', newPost.image);
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Musisz być zalogowany, aby dodać post');
        setAddingPost(false);
        return;
      }
      
      console.log('Sending POST request to add a new post');
      console.log('Content length:', newPost.content.length);
      
      try {
        const response = await fetch('http://localhost:3001/api/posts', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error(`Failed to add post: ${response.status} ${response.statusText}`);
          
          // Spróbuj wyświetlić szczegółowy komunikat błędu z serwera
          try {
            const errorDetails = await response.json();
            console.error('Server error details:', errorDetails);
            throw new Error(`Błąd serwera: ${errorDetails.message || response.statusText}`);
          } catch (jsonError) {
            throw new Error(`Błąd serwera: ${response.status} ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        console.log('Post added successfully:', data);
        
        // Post added successfully
        setSuccess('Post został pomyślnie dodany');
        resetForm();
        // Poczekaj chwilę przed odświeżeniem postów
        setTimeout(() => {
          fetchPosts();
          setShowAddForm(false);
        }, 500);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Nieznany błąd podczas dodawania posta');
        
        // Mimo błędu, odświeżamy posty po 2 sekundach
        setTimeout(() => {
          fetchPosts();
        }, 2000);
      }
    } catch (err) {
      setError('Błąd podczas dodawania posta. Spróbuj ponownie.');
      console.error('Error adding post:', err);
    } finally {
      setAddingPost(false);
    }
  };

  // Format date for display, with null check
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
      console.error('Error formatting date:', error);
      return 'Nieznana data';
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId: number) => {
    try {
      // Get current state
      const isExpanded = expandedPosts[postId] || false;
      
      // Update the state safely
      setExpandedPosts(prev => {
        const newState = { ...prev };
        newState[postId] = !isExpanded;
        return newState;
      });
      
      // Fetch comments if expanding
      if (!isExpanded) {
        fetchComments(postId);
      }
      
      // Force UI to remain visible by preventing rendering issues
      const postsContainer = document.querySelector('.posts-container');
      if (postsContainer) {
        postsContainer.classList.add('visible');
      }
      
      // Ensure the post stays in view
      setTimeout(() => {
        try {
          const element = document.getElementById(`post-${postId}`);
          if (element) {
            // Make sure the element and its parents are visible
            let currentElement: HTMLElement | null = element;
            while (currentElement) {
              currentElement.style.display = 'block';
              currentElement.style.visibility = 'visible';
              currentElement.style.opacity = '1';
              currentElement = currentElement.parentElement;
            }
            
            // Scroll to the post
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } catch (innerError) {
          console.error('Error handling post visibility:', innerError);
        }
      }, 100);
      
      console.log(`Comments toggled for post ${postId}, expanded: ${!isExpanded}`);
    } catch (error) {
      console.error('Error toggling comments:', error);
    }
  };

  // Fetch comments for a post
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
      const pagination = data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: fetchedComments.length,
        itemsPerPage: 5
      };
      
      console.log(`Fetched ${fetchedComments.length} comments for post ${postId}`);
      
      setPostComments(prev => ({
        ...prev,
        [postId]: fetchedComments
      }));

      setCommentPagination(prev => ({
        ...prev,
        [postId]: pagination
      }));

      setCurrentCommentPage(prev => ({
        ...prev,
        [postId]: page
      }));
    } catch (err) {
      console.error(`Error fetching comments for post ${postId}:`, err);
    }
  };

  // Fetch initial comment counts for all posts
  const fetchCommentCounts = async () => {
    try {
      if (!posts || posts.length === 0) return;
      
      console.log(`Fetching comment counts for ${posts.length} posts`);
      
      // Create an array of promises for fetching comments
      const commentPromises = posts.map(async (post) => {
        try {
          if (!post || !post.id) return { postId: 0, comments: [], pagination: null };
          
          const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments?page=1&limit=5`);
          if (!response.ok) return { postId: post.id, comments: [], pagination: null };
          
          const data = await response.json();
          return { 
            postId: post.id, 
            comments: data.comments || [], 
            pagination: data.pagination 
          };
        } catch (err) {
          console.error(`Error fetching comments for post ${post?.id}:`, err);
          return { postId: post?.id || 0, comments: [], pagination: null };
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(commentPromises);
      
      // Update state with the comments and pagination
      const commentsMap: {[key: number]: Comment[]} = {};
      const paginationMap: {[key: number]: CommentPagination} = {};
      const currentPageMap: {[key: number]: number} = {};
      
      results.forEach(result => {
        if (result.postId) {
          commentsMap[result.postId] = result.comments;
          if (result.pagination) {
            paginationMap[result.postId] = result.pagination;
            currentPageMap[result.postId] = 1;
          }
        }
      });
      
      setPostComments(prev => ({
        ...prev,
        ...commentsMap
      }));
      
      setCommentPagination(prev => ({
        ...prev,
        ...paginationMap
      }));
      
      setCurrentCommentPage(prev => ({
        ...prev,
        ...currentPageMap
      }));
      
      console.log('Comments and pagination initialized successfully');
    } catch (err) {
      console.error('Error initializing comments:', err);
    }
  };

  // Handle comment input change
  const handleCommentChange = (postId: number, content: string) => {
    setCommentContent(prev => ({ ...prev, [postId]: content }));
  };

  // Add a comment to a post
  const addComment = async (postId: number) => {
    if (!isAuthenticated) {
      setError('Musisz być zalogowany, aby dodać komentarz');
      return;
    }

    const content = commentContent[postId];
    if (!content || content.trim() === '') {
      return;
    }

    // Check CAPTCHA if it's shown
    if (showCaptcha[postId]) {
      if (!captchaInput[postId] || captchaInput[postId].toLowerCase() !== captchaValue.toLowerCase()) {
        setError('Nieprawidłowy kod CAPTCHA');
        // Generate new CAPTCHA
        generateCaptcha();
        return;
      }
    }

    setAddingComment(prev => ({ ...prev, [postId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content,
          notifyParticipants: true
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      let newComment = await response.json();
      
      // Add author info to the new comment if it's missing
      if (!newComment.author && user) {
        newComment = {
          ...newComment,
          author: {
            id: user.id || 0,
            name: user.name || 'Nieznany',
            surname: user.surname || 'użytkownik'
          }
        };
      }

      // Ensure existing comments array exists to prevent null reference errors
      const existingComments = postComments[postId] || [];
      
      setPostComments(prev => ({
        ...prev,
        [postId]: [...existingComments, newComment]
      }));

      // Clear comment input and CAPTCHA
      setCommentContent(prev => ({ ...prev, [postId]: '' }));
      setCaptchaInput(prev => ({ ...prev, [postId]: '' }));
      setShowCaptcha(prev => ({ ...prev, [postId]: false }));
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Błąd podczas dodawania komentarza');
    } finally {
      setAddingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Generate CAPTCHA
  const generateCaptcha = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaValue(captcha);
  };

  // Handle CAPTCHA input change
  const handleCaptchaChange = (postId: number, value: string) => {
    setCaptchaInput(prev => ({ ...prev, [postId]: value }));
  };

  // Funkcja do przełączania stanu rozwinięcia posta
  const togglePostContent = (postId: number) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Funkcja do skracania treści HTML z zachowaniem tagów
  const truncateHtml = (html: string, maxLength: number = 150) => {
    if (!html) return '';
    
    try {
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
    } catch (error) {
      console.error('Error truncating HTML:', error);
      return html.substring(0, maxLength) + '...';
    }
  };

  // Funkcja do naprawiania ścieżek obrazków w treści
  const fixImagePaths = (content: string) => {
    if (!content) return '';
    
    try {
      // Zamień wszystkie referencje do /uploads/ na pełne URL
      return content.replace(
        /<img(.*?)src=["'](\/uploads\/[^"']+)["']/gi, 
        '<img$1src="http://localhost:3001$2"'
      );
    } catch (error) {
      console.error('Error fixing image paths:', error);
      return content;
    }
  };

  const handleCommentPageChange = (postId: number, page: number) => {
    fetchComments(postId, page);
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

  return (
    <div className="home-container">
      <div className="carousel-section">
        <div className="carousel-container">
          <div 
            className="carousel-slides" 
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {carouselImages.map((image, index) => (
              <div key={index} className={`carousel-slide ${currentSlide === index ? 'active' : ''}`}>
                <img src={image} alt={`Slide ${index + 1}`} />
                <div className="carousel-overlay">
                  {index === 0 ? (
                    <div className="first-slide-content">
                      <div className="spiritual-ornament">
                        <div className="ornament-line"></div>
                      </div>
                      <h1 className="first-slide-title">
                        <div className="word-row">
                          <span className="animated-word word1">Wiedza</span>
                          <span className="animated-word word2">duchowa.</span>
                          <span className="animated-word word3">Praktyka.</span>
                        </div>
                        <div className="word-row">
                          <span className="animated-word word4">Przebudzenie</span>
                        </div>
                      </h1>
                      <div className="spiritual-ornament bottom">
                        <div className="ornament-line"></div>
                      </div>
                      <p className="first-slide-description">{carouselContent[index].description}</p>
                    </div>
                  ) : (
                    <div className="carousel-content">
                      <h1 className="carousel-title">{carouselContent[index].title}</h1>
                      <p className="carousel-description">{carouselContent[index].description}</p>
                      {carouselContent[index].button && (
                        <Link to={carouselContent[index].button.link} className="carousel-button">
                          {carouselContent[index].button.text}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Carousel controls */}
          <button className="carousel-control prev" onClick={prevSlide}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="carousel-control next" onClick={nextSlide}>
            <i className="fas fa-chevron-right"></i>
          </button>
          
          {/* Carousel indicators */}
          <div className="carousel-indicators">
            {carouselImages.map((_, index) => (
              <button 
                key={index} 
                className={index === currentSlide ? 'active' : ''}
                onClick={() => goToSlide(index)}
              ></button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="content-section">
        {/* Admin controls for adding posts */}
        {isAuthenticated && user?.role === 'ADMIN' && (
          <div className="admin-controls">
            {!showAddForm ? (
              <button 
                className="btn-add-post"
                onClick={() => setShowAddForm(true)}
              >
                Dodaj nowy post
              </button>
            ) : (
              <div className="add-post-form">
                <h3>Dodaj nowy post</h3>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Tytuł</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newPost.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="content">Treść</label>
                    <EnhancedEditor
                      value={newPost.content}
                      onChange={handleContentChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="image">Zdjęcie (opcjonalnie)</label>
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {previewUrl && (
                      <div className="image-preview">
                        <img src={previewUrl} alt="Preview" />
                      </div>
                    )}
                  </div>
                  
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={addingPost}
                    >
                      {addingPost ? 'Dodawanie...' : 'Dodaj post'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        
        {/* Posts list */}
        <div className="posts-container">
          <h2>Aktualności</h2>
          
          {loading ? (
            <div className="loading">Ładowanie postów...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : posts.length === 0 ? (
            <div className="no-posts">Brak dostępnych postów</div>
          ) : (
            posts
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
                      {expandedPosts[post.id] 
                        ? 'Ukryj komentarze' 
                        : `Komentarze (${commentPagination[post.id]?.totalItems || 0})`}
                    </button>
                  </div>
                  
                  {expandedPosts[post.id] && (
                    <div className="comments-section">
                      <h4>Komentarze</h4>
                      
                      {isAuthenticated ? (
                        <div className="add-comment">
                          <textarea
                            placeholder="Dodaj komentarz..."
                            value={commentContent[post.id] || ''}
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
                            disabled={addingComment[post.id] || !commentContent[post.id]}
                          >
                            {addingComment[post.id] ? 'Dodawanie...' : 'Dodaj komentarz'}
                          </button>
                        </div>
                      ) : (
                        <div className="login-prompt">
                          <p>Zaloguj się, aby dodać komentarz</p>
                        </div>
                      )}

                      <div className="comments-list">
                        {postComments[post.id]?.length > 0 ? (
                          <>
                            {postComments[post.id].map((comment) => (
                              <div key={comment.id} className="comment">
                                <div className="comment-header">
                                  <span className="comment-author">
                                    {comment.author?.name || 'Nieznany'} {comment.author?.surname || 'użytkownik'}
                                  </span>
                                  <span className="comment-date">
                                    {formatDate(comment.createdAt, true)}
                                  </span>
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
                            
                            {commentPagination[post.id]?.totalPages > 1 && (
                              <div className="pagination">
                                <button
                                  onClick={() => handleCommentPageChange(post.id, currentCommentPage[post.id] - 1)}
                                  disabled={currentCommentPage[post.id] <= 1}
                                >
                                  Poprzednia
                                </button>
                                <span>
                                  Strona {currentCommentPage[post.id]} z {commentPagination[post.id]?.totalPages}
                                </span>
                                <button
                                  onClick={() => handleCommentPageChange(post.id, currentCommentPage[post.id] + 1)}
                                  disabled={currentCommentPage[post.id] >= commentPagination[post.id]?.totalPages}
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
};

export default Home;