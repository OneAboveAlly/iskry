import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AddVideoFormProps {
  onVideoAdded: () => void;
  onCancel: () => void;
}

const AddVideoForm: React.FC<AddVideoFormProps> = ({ onVideoAdded, onCancel }) => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !videoUrl) {
      setError('Tytuł i URL filmu są wymagane');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3001/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          videoUrl,
          description: description || null,
          topic: topic || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Błąd podczas dodawania filmu');
      }
      
      // Reset form
      setTitle('');
      setVideoUrl('');
      setDescription('');
      setTopic('');
      
      // Notify parent
      onVideoAdded();
    } catch (err: any) {
      console.error('Error adding video:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-video-form">
      <h3>Dodaj nowy film</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Tytuł</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="videoUrl">URL filmu YouTube</label>
          <input
            type="url"
            id="videoUrl"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="np. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Opis (opcjonalnie)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="topic">Temat (opcjonalnie)</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="np. Medytacja, Praktyki duchowe"
          />
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
            disabled={loading}
          >
            {loading ? 'Dodawanie...' : 'Dodaj film'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVideoForm; 