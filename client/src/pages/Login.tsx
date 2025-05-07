import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Apply background styles
  useEffect(() => {
    // Remove any existing background classes
    document.body.classList.remove('register-body');
    
    // Add login-body class
    document.body.classList.add('login-body');
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('login-body');
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || (user?.isAdmin ? '/admin' : '/student');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, user, location.state]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Błąd podczas logowania');
      }

      login(data.token, data.user);

      if (data.user.isAdmin) {
        navigate('/admin');
      } else {
        if (data.user.approved) {
          navigate('/student');
        } else {
          navigate('/login', { state: { message: 'Twoje konto czeka na zatwierdzenie przez administratora' } });
        }
      }
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
          <h2 className="auth-title">Zaloguj się</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                <span>{error}</span>
              </div>
            )}
            
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
                placeholder="przyklad@domena.pl"
              />
            </div>
            
            <div className="auth-form-group">
              <label htmlFor="password">Hasło</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="Wpisz swoje hasło"
              />
            </div>
            
            <div className="auth-button-container">
              <button 
                type="submit" 
                disabled={loading}
                className="auth-button"
              >
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>
            </div>
            
            <div className="auth-links">
              <p>Nie masz konta? <Link to="/register" className="auth-link">Zarejestruj się</Link></p>
              <p><Link to="/forgot-password" className="auth-link">Zapomniałeś hasła?</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 