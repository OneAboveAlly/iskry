import React, { useState, useEffect } from 'react';
import '../../styles/SettingsManagement.css';

interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  label: string;
  icon?: string;
  displayOrder: number;
}

const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newSetting, setNewSetting] = useState<Omit<Setting, 'id'>>({
    key: '',
    value: '',
    type: 'contact',
    label: '',
    icon: '',
    displayOrder: 0
  });
  
  const [editSetting, setEditSetting] = useState<Setting | null>(null);

  // Available social media platforms with icons
  const socialPlatforms = [
    { name: 'facebook', label: 'Facebook', icon: 'facebook' },
    { name: 'twitter', label: 'Twitter', icon: 'twitter' },
    { name: 'instagram', label: 'Instagram', icon: 'instagram' },
    { name: 'youtube', label: 'YouTube', icon: 'youtube' },
    { name: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { name: 'tiktok', label: 'TikTok', icon: 'tiktok' },
    { name: 'pinterest', label: 'Pinterest', icon: 'pinterest' },
    { name: 'telegram', label: 'Telegram', icon: 'telegram' }
  ];

  // Fetch settings from the API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Błąd podczas pobierania ustawień');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle input change for new setting
  const handleNewSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSetting(prev => ({ ...prev, [name]: value }));
  };

  // Handle input change for editing a setting
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editSetting) return;
    
    const { name, value } = e.target;
    setEditSetting({ ...editSetting, [name]: value });
  };

  // Start editing a setting
  const startEdit = (setting: Setting) => {
    setEditingId(setting.id);
    setEditSetting(setting);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditSetting(null);
  };

  // Save edited setting
  const saveSetting = async (id: number) => {
    if (!editSetting) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/settings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editSetting)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setSuccess('Ustawienie zostało zaktualizowane');
      setEditingId(null);
      setEditSetting(null);
      fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Błąd podczas aktualizacji ustawienia');
    }
  };

  // Add new setting
  const addSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSetting)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setSuccess('Nowe ustawienie zostało dodane');
      setShowAddForm(false);
      setNewSetting({
        key: '',
        value: '',
        type: 'contact',
        label: '',
        icon: '',
        displayOrder: 0
      });
      fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error adding setting:', err);
      setError('Błąd podczas dodawania ustawienia');
    }
  };

  // Delete setting
  const deleteSetting = async (id: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to ustawienie?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/settings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      setSuccess('Ustawienie zostało usunięte');
      fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting setting:', err);
      setError('Błąd podczas usuwania ustawienia');
    }
  };

  // Handle social platform selection
  const handleSocialSelect = (platform: typeof socialPlatforms[0]) => {
    if (editingId !== null && editSetting) {
      setEditSetting({
        ...editSetting,
        key: platform.name,
        label: platform.label,
        icon: platform.icon
      });
    } else {
      setNewSetting({
        ...newSetting,
        key: platform.name,
        label: platform.label,
        icon: platform.icon
      });
    }
  };

  return (
    <div className="settings-management">
      <h1 className="settings-title">Zarządzanie Ustawieniami</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="settings-actions">
        <button 
          className="add-setting-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Anuluj' : 'Dodaj Nowe Ustawienie'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="add-setting-form">
          <h3>Dodaj Nowe Ustawienie</h3>
          <form onSubmit={addSetting}>
            <div className="form-group">
              <label htmlFor="type">Typ</label>
              <select
                id="type"
                name="type"
                value={newSetting.type}
                onChange={handleNewSettingChange}
                required
              >
                <option value="contact">Kontakt</option>
                <option value="social">Social Media</option>
              </select>
            </div>
            
            {newSetting.type === 'social' && (
              <div className="form-group">
                <label>Wybierz platformę</label>
                <div className="social-platforms">
                  {socialPlatforms.map(platform => (
                    <button
                      key={platform.name}
                      type="button"
                      className={`platform-btn ${newSetting.key === platform.name ? 'selected' : ''}`}
                      onClick={() => handleSocialSelect(platform)}
                    >
                      <i className={`fab fa-${platform.icon}`}></i>
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="key">Klucz</label>
              <input
                type="text"
                id="key"
                name="key"
                value={newSetting.key}
                onChange={handleNewSettingChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="label">Etykieta</label>
              <input
                type="text"
                id="label"
                name="label"
                value={newSetting.label}
                onChange={handleNewSettingChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="value">Wartość</label>
              <input
                type="text"
                id="value"
                name="value"
                value={newSetting.value}
                onChange={handleNewSettingChange}
                required
                placeholder={newSetting.type === 'social' ? 'https://...' : 'Wartość'}
              />
            </div>
            
            {newSetting.type === 'social' && (
              <div className="form-group">
                <label htmlFor="icon">Ikona</label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  value={newSetting.icon || ''}
                  onChange={handleNewSettingChange}
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="displayOrder">Kolejność wyświetlania</label>
              <input
                type="number"
                id="displayOrder"
                name="displayOrder"
                value={newSetting.displayOrder}
                onChange={handleNewSettingChange}
                min="0"
              />
            </div>
            
            <div className="form-buttons">
              <button type="button" className="cancel-btn" onClick={() => setShowAddForm(false)}>
                Anuluj
              </button>
              <button type="submit" className="save-btn">
                Dodaj
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="settings-sections">
        <div className="settings-section">
          <h2>Dane kontaktowe</h2>
          {loading ? (
            <p className="loading">Ładowanie...</p>
          ) : (
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Etykieta</th>
                  <th>Klucz</th>
                  <th>Wartość</th>
                  <th>Kolejność</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {settings
                  .filter(setting => setting.type === 'contact')
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map(setting => (
                    <tr key={setting.id}>
                      {editingId === setting.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              name="label"
                              value={editSetting?.label || ''}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="key"
                              value={editSetting?.key || ''}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="value"
                              value={editSetting?.value || ''}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="displayOrder"
                              value={editSetting?.displayOrder || 0}
                              onChange={handleEditChange}
                              min="0"
                            />
                          </td>
                          <td className="action-buttons">
                            <button className="save-btn" onClick={() => saveSetting(setting.id)}>
                              Zapisz
                            </button>
                            <button className="cancel-btn" onClick={cancelEdit}>
                              Anuluj
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{setting.label}</td>
                          <td>{setting.key}</td>
                          <td>{setting.value}</td>
                          <td>{setting.displayOrder}</td>
                          <td className="action-buttons">
                            <button className="edit-btn" onClick={() => startEdit(setting)}>
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="delete-btn" onClick={() => deleteSetting(setting.id)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                {settings.filter(setting => setting.type === 'contact').length === 0 && (
                  <tr>
                    <td colSpan={5} className="no-data">Brak danych kontaktowych</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="settings-section">
          <h2>Social Media</h2>
          {loading ? (
            <p className="loading">Ładowanie...</p>
          ) : (
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Platforma</th>
                  <th>Ikona</th>
                  <th>Link</th>
                  <th>Kolejność</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {settings
                  .filter(setting => setting.type === 'social')
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map(setting => (
                    <tr key={setting.id}>
                      {editingId === setting.id ? (
                        <>
                          <td>
                            <select
                              name="key"
                              value={editSetting?.key || ''}
                              onChange={(e) => {
                                const platform = socialPlatforms.find(p => p.name === e.target.value);
                                if (platform && editSetting) {
                                  setEditSetting({
                                    ...editSetting,
                                    key: platform.name,
                                    label: platform.label,
                                    icon: platform.icon
                                  });
                                }
                              }}
                            >
                              {socialPlatforms.map(platform => (
                                <option key={platform.name} value={platform.name}>
                                  {platform.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              name="icon"
                              value={editSetting?.icon || ''}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="value"
                              value={editSetting?.value || ''}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="displayOrder"
                              value={editSetting?.displayOrder || 0}
                              onChange={handleEditChange}
                              min="0"
                            />
                          </td>
                          <td className="action-buttons">
                            <button className="save-btn" onClick={() => saveSetting(setting.id)}>
                              Zapisz
                            </button>
                            <button className="cancel-btn" onClick={cancelEdit}>
                              Anuluj
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{setting.label}</td>
                          <td>
                            <i className={`fab fa-${setting.icon || setting.key}`}></i>
                          </td>
                          <td>
                            <a href={setting.value} target="_blank" rel="noopener noreferrer">
                              {setting.value}
                            </a>
                          </td>
                          <td>{setting.displayOrder}</td>
                          <td className="action-buttons">
                            <button className="edit-btn" onClick={() => startEdit(setting)}>
                              <i className="fas fa-edit"></i>
                            </button>
                            <button className="delete-btn" onClick={() => deleteSetting(setting.id)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                {settings.filter(setting => setting.type === 'social').length === 0 && (
                  <tr>
                    <td colSpan={5} className="no-data">Brak ustawień social media</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement; 