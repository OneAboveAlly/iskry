import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/auth';
import '../../styles/CommentsManagement.css';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    surname: string;
  };
  post: {
    id: number;
    title: string;
  };
}

interface Modal {
  show: boolean;
  type: 'editComment' | 'deleteComment' | 'none';
  data: any;
}

const CommentsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editComment, setEditComment] = useState({ id: 0, content: '' });
  const [modal, setModal] = useState<Modal>({
    show: false,
    type: 'none',
    data: null
  });

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await authFetch('http://localhost:3001/api/admin/comments');
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać komentarzy');
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setComments([]);
      } else {
        setComments(data);
      }
    } catch (err) {
      setError('Błąd podczas pobierania komentarzy');
      console.error('Error fetching comments:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (id: number) => {
    try {
      const response = await authFetch(`http://localhost:3001/api/posts/comments/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się usunąć komentarza');
      }
      
      setComments(comments.filter(comment => comment.id !== id));
      setSuccess('Komentarz został pomyślnie usunięty');
      closeModal();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Błąd podczas usuwania komentarza');
      console.error('Error deleting comment:', err);
    }
  };

  const handleEditComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await authFetch(`http://localhost:3001/api/posts/comments/${editComment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editComment.content })
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się zaktualizować komentarza');
      }
      
      // Update the comment in the local state
      setComments(comments.map(comment => 
        comment.id === editComment.id ? { ...comment, content: editComment.content } : comment
      ));
      
      setSuccess('Komentarz został pomyślnie zaktualizowany');
      closeModal();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Błąd podczas aktualizacji komentarza');
      console.error('Error updating comment:', err);
    }
  };

  const openModal = (type: 'editComment' | 'deleteComment', data: any) => {
    if (type === 'editComment') {
      setEditComment({ id: data.id, content: data.content });
    }
    
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredComments = comments.filter(comment => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      comment.content.toLowerCase().includes(searchTermLower) ||
      `${comment.author.name} ${comment.author.surname}`.toLowerCase().includes(searchTermLower) ||
      comment.post.title.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <div className="comments-management-container">
      <h1 className="page-title">Moderacja Komentarzy</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="comments-filter-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Szukaj w komentarzach..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">
            <i className="fas fa-search"></i>
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-indicator">Ładowanie komentarzy...</div>
      ) : filteredComments.length === 0 ? (
        <div className="no-comments-message">
          <i className="fas fa-comment-slash fa-3x"></i>
          <p>Brak komentarzy do wyświetlenia</p>
        </div>
      ) : (
        <div className="comments-list">
          {filteredComments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <div className="comment-avatar">
                    <span>{comment.author.name.charAt(0)}{comment.author.surname.charAt(0)}</span>
                  </div>
                  <div className="comment-author-details">
                    <h3>{comment.author.name} {comment.author.surname}</h3>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                <div className="comment-actions">
                  <button
                    className="action-button edit-button"
                    onClick={() => openModal('editComment', comment)}
                    title="Edytuj komentarz"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="action-button delete-button"
                    onClick={() => openModal('deleteComment', comment)}
                    title="Usuń komentarz"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
              
              <div className="comment-post">
                <span>Do posta: </span>
                <a href={`/aktualnosci/${comment.post.id}`} target="_blank" rel="noopener noreferrer">
                  {comment.post.title}
                </a>
              </div>
              
              <div className="comment-content">{comment.content}</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Comment Modal */}
      {modal.show && modal.type === 'editComment' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edytuj komentarz</h3>
              <button className="close-button" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditComment}>
                <div className="form-group">
                  <label htmlFor="content">Treść komentarza</label>
                  <textarea
                    id="content"
                    value={editComment.content}
                    onChange={(e) => setEditComment({ ...editComment, content: e.target.value })}
                    required
                    rows={5}
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={closeModal}>
                    <i className="fas fa-times"></i> Anuluj
                  </button>
                  <button type="submit" className="save-button">
                    <i className="fas fa-save"></i> Zapisz zmiany
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Comment Modal */}
      {modal.show && modal.type === 'deleteComment' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Potwierdź usunięcie</h3>
              <button className="close-button" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Czy na pewno chcesz usunąć ten komentarz?</p>
              <div className="comment-preview">
                <p><strong>Autor:</strong> {modal.data.author.name} {modal.data.author.surname}</p>
                <p><strong>Treść:</strong> {modal.data.content}</p>
              </div>
              <p className="warning-text">Tej operacji nie można cofnąć!</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={closeModal}>
                <i className="fas fa-times"></i> Anuluj
              </button>
              <button 
                className="confirm-delete-button" 
                onClick={() => handleDeleteComment(modal.data.id)}
              >
                <i className="fas fa-check"></i> Tak, usuń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsManagement; 