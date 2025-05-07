import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserEditModal from '../../components/UserEditModal';
import '../../styles/UsersManagement.css';
import { authFetch } from '../../utils/auth';

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  approved: boolean;
  createdAt: string;
  isAdmin: boolean;
}

interface Modal {
  show: boolean;
  type: 'userDetails' | 'deleteUser' | 'editUser' | 'none';
  data: any;
}

const UsersManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: ''
  });
  const [searchUser, setSearchUser] = useState('');
  const [showUsersList, setShowUsersList] = useState(true);
  const [modal, setModal] = useState<Modal>({ 
    show: false, 
    type: 'none',
    data: null
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await authFetch('http://localhost:3001/api/admin/users');

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

  const handleApprove = async (id: number) => {
    try {
      const response = await authFetch(`http://localhost:3001/api/admin/users/${id}/approve`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Błąd podczas zatwierdzania użytkownika');
      }

      fetchUsers();
      closeModal();
    } catch (error) {
      setError('Błąd podczas zatwierdzania użytkownika');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const response = await authFetch(`http://localhost:3001/api/admin/users/${id}`, {
        method: 'DELETE'
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authFetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: {
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
        phone: '',
        password: ''
      });
      fetchUsers();
    } catch (error) {
      setError('Błąd podczas tworzenia użytkownika');
    }
  };

  const openModal = (type: 'userDetails' | 'deleteUser' | 'editUser', data: any) => {
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

  const filteredUsers = users.filter(user => {
    const fullName = `${user.name} ${user.surname}`.toLowerCase();
    const email = user.email.toLowerCase();
    const search = searchUser.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Ładowanie...</div>;
  }

  return (
    <div className="users-management-container">
      <h1 className="page-title">Zarządzanie Użytkownikami</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lista użytkowników */}
        <div className="card-container">
          <div className="card-header" onClick={() => setShowUsersList(!showUsersList)}>
            <h2 className="section-title">Użytkownicy</h2>
            <div className="card-toggle">
              {showUsersList ? (
                <i className="fas fa-chevron-up"></i>
              ) : (
                <i className="fas fa-chevron-down"></i>
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
                  <i className="fas fa-search"></i>
                </span>
              </div>
              
              <div className="users-list-container">
                {filteredUsers.length === 0 ? (
                  <div className="empty-results">
                    <i className="fas fa-search fa-3x empty-icon"></i>
                    <p className="empty-message">Brak użytkowników spełniających kryteria wyszukiwania</p>
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
                            {user.isAdmin && (
                              <span className="status-badge status-admin">Admin</span>
                            )}
                          </div>
                        </div>
                        <div className="user-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('editUser', user);
                            }}
                            className="action-button edit-button"
                            title="Edytuj"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {!user.approved && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(user.id);
                              }}
                              className="action-button approve-button"
                              title="Zatwierdź"
                            >
                              <i className="fas fa-check"></i>
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
                            <i className="fas fa-trash-alt"></i>
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
            <h2 className="section-title">Dodaj ucznia</h2>
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
              <label htmlFor="phone">Telefon</label>
              <input
                type="text"
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
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
              <i className="fas fa-user-plus"></i> Dodaj ucznia
            </button>
          </form>
        </div>
      </div>

      {/* Modals */}
      {modal.show && modal.type === 'userDetails' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="user-details-modal">
              <div className="modal-header">
                <h3>Szczegóły użytkownika</h3>
                <button className="close-button" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="user-detail-avatar">
                  <span>{modal.data.name.charAt(0)}{modal.data.surname.charAt(0)}</span>
                </div>
                <div className="user-detail-info">
                  <p><strong>Imię i nazwisko:</strong> {modal.data.name} {modal.data.surname}</p>
                  <p><strong>Email:</strong> {modal.data.email}</p>
                  <p><strong>Telefon:</strong> {modal.data.phone}</p>
                  <p><strong>Status:</strong> {modal.data.approved ? 'Zatwierdzony' : 'Oczekujący'}</p>
                  <p><strong>Admin:</strong> {modal.data.isAdmin ? 'Tak' : 'Nie'}</p>
                  <p><strong>Data utworzenia:</strong> {new Date(modal.data.createdAt).toLocaleDateString('pl-PL')}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="edit-button-modal" 
                  onClick={() => openModal('editUser', modal.data)}
                >
                  <i className="fas fa-edit"></i> Edytuj użytkownika
                </button>
                {!modal.data.approved && (
                  <button 
                    className="approve-button-modal" 
                    onClick={() => handleApprove(modal.data.id)}
                  >
                    <i className="fas fa-check"></i> Zatwierdź użytkownika
                  </button>
                )}
                <button 
                  className="delete-button-modal" 
                  onClick={() => openModal('deleteUser', modal.data)}
                >
                  <i className="fas fa-trash-alt"></i> Usuń użytkownika
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {modal.show && modal.type === 'deleteUser' && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirmation-modal">
              <div className="modal-header">
                <h3>Potwierdź usunięcie</h3>
                <button className="close-button" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <p>Czy na pewno chcesz usunąć użytkownika <strong>{modal.data.name} {modal.data.surname}</strong>?</p>
                <p className="warning-text">Tej operacji nie można cofnąć!</p>
              </div>
              <div className="modal-footer">
                <button className="cancel-button" onClick={closeModal}>
                  <i className="fas fa-times"></i> Anuluj
                </button>
                <button 
                  className="confirm-delete-button" 
                  onClick={() => handleDeleteUser(modal.data.id)}
                >
                  <i className="fas fa-check"></i> Tak, usuń
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal.show && modal.type === 'editUser' && (
        <UserEditModal 
          user={modal.data} 
          onClose={closeModal} 
          onUserUpdated={fetchUsers}
        />
      )}
    </div>
  );
};

export default UsersManagement; 