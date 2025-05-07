import React, { useState } from 'react';
import '../styles/UserEditModal.css';
import { authFetch } from '../utils/auth';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  approved: boolean;
  isAdmin: boolean;
}

interface FormData {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  approved: boolean;
  isAdmin: boolean;
  password?: string;
}

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState<FormData>({
    name: user.name,
    surname: user.surname,
    email: user.email,
    phone: user.phone || '',
    approved: user.approved,
    isAdmin: user.isAdmin,
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create data to send, removing empty password
      const dataToSend: FormData = { ...formData };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }
      
      const response = await authFetch(`http://localhost:3001/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        throw new Error('Nie udało się zaktualizować użytkownika');
      }
      
      setSuccessMessage('Użytkownik został zaktualizowany');
      onUserUpdated();
      
      // Zamknij modal po krótkim opóźnieniu, aby użytkownik zobaczył komunikat sukcesu
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="user-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edycja użytkownika</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <form onSubmit={handleSubmit} className="user-edit-form">
          <div className="form-group">
            <label htmlFor="name">Imię</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="surname">Nazwisko</label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Numer telefonu</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="np. +48 123 456 789"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Hasło (pozostaw puste, aby nie zmieniać)</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nowe hasło"
            />
          </div>
          
          <div className="checkbox-group">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="approved"
                name="approved"
                checked={formData.approved}
                onChange={handleChange}
              />
              <label htmlFor="approved">Zatwierdzony</label>
            </div>
            
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="isAdmin"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={handleChange}
              />
              <label htmlFor="isAdmin">Administrator</label>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={loading}
            >
              <i className="fas fa-times"></i> Anuluj
            </button>
            <button 
              type="submit" 
              className="save-button" 
              disabled={loading}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>} {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal; 