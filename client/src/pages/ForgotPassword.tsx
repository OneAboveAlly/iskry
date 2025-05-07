import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Błąd podczas resetowania hasła');
      }

      setSuccess('Instrukcje dotyczące resetowania hasła zostały wysłane na podany adres email.');
      setEmail('');
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
          <h2 className="auth-title">Zapomniałeś hasła?</h2>
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
                value={email}
                onChange={handleChange}
                className="auth-input"
                placeholder="Podaj swój adres email"
              />
            </div>
            
            <div className="auth-form-group">
              <p className="text-sm text-gray-600">
                Podaj swój adres email, a wyślemy Ci link do zresetowania hasła.
              </p>
            </div>
            
            <div className="auth-button-container">
              <button 
                type="submit" 
                disabled={loading}
                className="auth-button"
              >
                {loading ? 'Wysyłanie...' : 'Resetuj hasło'}
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

export default ForgotPassword; 