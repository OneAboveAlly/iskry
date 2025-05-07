import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/YouTube.css';
import YouTubePlayer from '../components/YouTubePlayer';
import AddVideoForm from '../components/AddVideoForm';
import Pagination from '../components/Pagination';

interface Author {
  id: number;
  name: string;
  surname: string;
}

interface YouTubeVideo {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string;
  videoId: string;
  topic: string | null;
  createdAt: string;
  author: Author;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const YouTube: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 9,
    pages: 0
  });

  // Fetch videos
  const fetchVideos = async (page: number = 1, topic: string | null = null) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `http://localhost:3001/api/youtube?page=${page}&limit=${pagination.limit}`;
      if (topic) {
        url += `&topic=${encodeURIComponent(topic)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Błąd podczas pobierania danych');
      }
      
      const data = await response.json();
      setVideos(data.videos);
      setPagination(data.pagination);
      setTopics(data.topics);
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchVideos(1, selectedTopic);
  }, [selectedTopic]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    fetchVideos(page, selectedTopic);
  };
  
  // Handle topic filter
  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const topic = e.target.value === "all" ? null : e.target.value;
    setSelectedTopic(topic);
  };
  
  // Handle video added
  const handleVideoAdded = () => {
    setShowAddForm(false);
    setSuccess('Film został dodany pomyślnie!');
    fetchVideos(1, selectedTopic);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="youtube-container">
      <div className="youtube-header">
        <h1 className="page-title">YouTube</h1>
        <p className="page-description">Biblioteka filmów szkoleniowych i materiałów wideo</p>
      </div>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="youtube-controls">
        <div className="filter-controls">
          <select
            className="topic-filter"
            value={selectedTopic || "all"}
            onChange={handleTopicChange}
          >
            <option value="all">Wszystkie tematy</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
        
        {isAuthenticated && user?.isAdmin && (
          <button
            className="add-video-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Anuluj dodawanie' : 'Dodaj nowy film'}
          </button>
        )}
      </div>
      
      {showAddForm && isAuthenticated && user?.isAdmin && (
        <AddVideoForm onVideoAdded={handleVideoAdded} onCancel={() => setShowAddForm(false)} />
      )}
      
      {loading ? (
        <div className="loading-spinner">Ładowanie filmów...</div>
      ) : videos.length === 0 ? (
        <div className="empty-message">
          Brak filmów do wyświetlenia
          {selectedTopic && ` dla tematu: ${selectedTopic}`}
        </div>
      ) : (
        <>
          <div className="videos-grid">
            {videos.map((video) => (
              <div key={video.id} className="video-card">
                <YouTubePlayer videoId={video.videoId} />
                <div className="video-details">
                  <h3 className="video-title">{video.title}</h3>
                  {video.topic && <span className="video-topic">{video.topic}</span>}
                  {video.description && (
                    <p className="video-description">{video.description}</p>
                  )}
                  <div className="video-meta">
                    <span className="video-date">Dodano: {formatDate(video.createdAt)}</span>
                    <span className="video-author">
                      przez {video.author.name} {video.author.surname}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default YouTube; 