import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/MaterialsManagement.css';

interface Material {
  id: number;
  title: string;
  fileUrl: string;
  createdAt: string;
  student: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
}

const MaterialsManagement: React.FC = () => {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchMaterials();
    }
  }, [token]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/materials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać materiałów');
      }

      const data = await response.json();
      setMaterials(data);
    } catch (err) {
      setError('Błąd podczas pobierania listy materiałów');
      console.error('Błąd pobierania materiałów:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/materials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Nie udało się usunąć materiału');
      }

      setMaterials(materials.filter(material => material.id !== id));
      setSuccessMessage('Materiał został pomyślnie usunięty');
      
      // Wyczyść komunikat o sukcesie po 3 sekundach
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError('Błąd podczas usuwania materiału');
      console.error('Błąd usuwania materiału:', err);
    } finally {
      setConfirmDelete(null);
    }
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

  const filteredMaterials = materials.filter(material => {
    const searchLower = searchTerm.toLowerCase();
    return (
      material.title.toLowerCase().includes(searchLower) ||
      material.student.name.toLowerCase().includes(searchLower) ||
      material.student.surname.toLowerCase().includes(searchLower) ||
      material.student.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="materials-loading">Ładowanie materiałów...</div>;
  }

  return (
    <div className="materials-management">
      <div className="materials-header">
        <h3>Wszystkie przypisane materiały</h3>
        <div className="materials-search">
          <input
            type="text"
            placeholder="Szukaj materiałów lub uczniów..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
              aria-label="Wyczyść wyszukiwanie"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {error && <div className="materials-error">{error}</div>}
      {successMessage && <div className="materials-success">{successMessage}</div>}

      {materials.length === 0 ? (
        <div className="no-materials-message">
          <p>Żadne materiały nie zostały jeszcze przypisane do uczniów.</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="no-materials-message">
          <p>Brak materiałów spełniających kryteria wyszukiwania.</p>
          <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
            Wyczyść wyszukiwanie
          </button>
        </div>
      ) : (
        <div className="materials-table-container">
          <table className="materials-table">
            <thead>
              <tr>
                <th>Tytuł</th>
                <th>Uczeń</th>
                <th>Data przypisania</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(material => (
                <tr key={material.id}>
                  <td className="material-title">{material.title}</td>
                  <td className="material-student">
                    <div>{material.student.name} {material.student.surname}</div>
                    <div className="student-email">{material.student.email}</div>
                  </td>
                  <td className="material-date">{formatDate(material.createdAt)}</td>
                  <td className="material-actions">
                    <a
                      href={`http://localhost:3001${material.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-btn"
                      title="Zobacz PDF"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </a>
                    
                    {confirmDelete === material.id ? (
                      <div className="confirm-delete">
                        <span>Czy na pewno?</span>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="confirm-yes"
                        >
                          Tak
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="confirm-no"
                        >
                          Nie
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(material.id)}
                        className="delete-btn"
                        title="Usuń materiał"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MaterialsManagement; 