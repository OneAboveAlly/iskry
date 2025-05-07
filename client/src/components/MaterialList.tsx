import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/MaterialList.css';

interface Material {
  id: number;
  title: string;
  fileUrl: string;
  createdAt: string;
}

const MaterialList: React.FC = () => {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    
    const fetchMaterials = async () => {
      try {
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
        setError('Błąd podczas pobierania materiałów');
        console.error('Błąd pobierania materiałów:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Ładowanie materiałów...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="materials-container">
      <h2>Twoje materiały do nauki</h2>
      
      {materials.length === 0 ? (
        <div className="no-materials">
          <p>Nie masz jeszcze przypisanych żadnych materiałów.</p>
        </div>
      ) : (
        <div className="materials-list">
          {materials.map((material) => (
            <div key={material.id} className="material-card">
              <div className="material-info">
                <h3>{material.title}</h3>
                <p className="material-date">Dodano: {formatDate(material.createdAt)}</p>
              </div>
              <div className="material-actions">
                <a 
                  href={`http://localhost:3001${material.fileUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="download-button"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Pobierz PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaterialList; 