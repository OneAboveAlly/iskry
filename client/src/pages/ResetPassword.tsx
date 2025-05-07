import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import '../styles/Auth.css';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Apply background styles
  useEffect(() => {
    // Remove any existing background classes
    document.body.classList.remove('register-body');
    
    // Add login-body class (reusing the login background)
    document.body.classList.add('login-body');
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('login-body');
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
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate password
    if (formData.password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków');
      setLoading(false);
      return;
    }

    // Validate matching passwords
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne');
      setLoading(false);
      return;
    }

    // Validate email in emergency mode
    if (isEmergencyMode && !formData.email) {
      setError('Adres email jest wymagany w trybie awaryjnym');
      setLoading(false);
      return;
    }

    try {
      // Przygotuj dane do wysłania z lub bez emaila
      const requestData: any = {
        token,
        password: formData.password
      };

      // Dodaj email w trybie awaryjnym
      if (isEmergencyMode && formData.email) {
        requestData.email = formData.email;
      }

      const response = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Sprawdź, czy błąd dotyczy braku tabeli PasswordReset
        if (data.message?.includes('Tabela PasswordReset nie istnieje') || 
            data.message?.includes('adres email nie został podany')) {
          setIsEmergencyMode(true);
          setError('Wystąpił problem z bazą danych. Proszę podać adres email, aby zresetować hasło w trybie awaryjnym.');
          setLoading(false);
          return;
        }
        
        throw new Error(data.message || 'Błąd podczas resetowania hasła');
      }

      setSuccess(data.message);
      setFormData({ password: '', confirmPassword: '', email: '' });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-form-container">
          <h2 className="auth-title">Resetowanie hasła</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="auth-success">
                <span>{success}</span>
              </div>
            )}
            
            {isEmergencyMode && (
              <div className="auth-form-group">
                <label htmlFor="email">Adres email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Podaj adres email powiązany z kontem"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Tryb awaryjny: Podaj adres email powiązany z kontem, aby zresetować hasło.
                </p>
              </div>
            )}
            
            <div className="auth-form-group">
              <label htmlFor="password">Nowe hasło</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="Wpisz nowe hasło"
              />
            </div>
            
            <div className="auth-form-group">
              <label htmlFor="confirmPassword">Potwierdź hasło</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="auth-input"
                placeholder="Potwierdź nowe hasło"
              />
            </div>
            
            <div className="auth-button-container">
              <button 
                type="submit" 
                disabled={loading}
                className="auth-button"
              >
                {loading ? 'Resetowanie...' : 'Zresetuj hasło'}
              </button>
            </div>
            
            <div className="auth-links">
              <p><Link to="/login" className="auth-link">Powrót do logowania</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 