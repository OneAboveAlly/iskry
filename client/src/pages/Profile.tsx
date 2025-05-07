import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/auth';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('profile-body');
    return () => {
      document.body.classList.remove('profile-body');
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Sprawdź czy nowe hasła się zgadzają
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError('Nowe hasła nie są identyczne');
        return;
      }

      const response = await authFetch('http://localhost:3001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phone,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Nie udało się zaktualizować profilu');
      }

      setSuccess('Profil został zaktualizowany');
      setIsEditing(false);
      // Odśwież dane użytkownika
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas aktualizacji profilu');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await authFetch('http://localhost:3001/api/users/profile', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Nie udało się usunąć konta');
      }

      logout();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas usuwania konta');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto rounded-xl shadow-lg p-8" style={{ background: 'rgba(255,255,255,0.85)' }}>
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Profil użytkownika
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Zarządzaj swoimi danymi i ustawieniami konta
          </p>
        </div>
        <div className="px-4 py-5 sm:px-6 bg-transparent">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Imię
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
                  Nazwisko
                </label>
                <input
                  type="text"
                  name="surname"
                  id="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                />
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                />
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Numer telefonu
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="np. +48 123 456 789"
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                />
              </div>

              {isEditing && (
                <>
                  <div className="sm:col-span-6">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Aktualne hasło
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      Nowe hasło
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Potwierdź nowe hasło
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Edytuj profil
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Usuń konto
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Zapisz zmiany
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Modal potwierdzenia usunięcia konta */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="rounded-lg p-6 max-w-md w-full" style={{ background: 'rgba(245,245,245,0.98)' }}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Potwierdź usunięcie konta</h3>
            <p className="text-sm text-gray-500 mb-6">
              Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna i spowoduje utratę wszystkich danych.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Usuń konto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 