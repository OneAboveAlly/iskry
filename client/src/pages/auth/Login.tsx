import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storeAuthData } from '../../utils/auth';
import '../../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add login-body class for correct background
  useEffect(() => {
    document.body.classList.add('login-body');
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

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Wystąpił błąd podczas logowania');
      }

      // Save token and user data using auth utility
      storeAuthData(data.token, data.user);

      // Redirect based on user role
      if (data.user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas logowania');
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
            {success && (
              <div className="auth-success">
                <span>{success}</span>
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
                className="auth-input"
                placeholder="przyklad@domena.pl"
                value={formData.email}
                onChange={handleChange}
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
                className="auth-input"
                placeholder="Wpisz swoje hasło"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="auth-button-container">
              <button type="submit" className="auth-button">
                Zaloguj się
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