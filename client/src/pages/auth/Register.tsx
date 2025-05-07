import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Stan dla matematycznej captchy
  const [captchaExpression, setCaptchaExpression] = useState('');
  const [captchaResult, setCaptchaResult] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaPassed, setCaptchaPassed] = useState(false);

  // Inicjalizacja captchy i dodanie klasy do body
  useEffect(() => {
    generateMathCaptcha();
    
    // Dodaj klasę do body przy montowaniu komponentu
    document.body.classList.add('register-body');
    
    // Zastosuj tło bezpośrednio do elementu body
    document.body.style.backgroundImage = "url('/images/regi_bckg.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    
    // Usuń klasę z body przy odmontowaniu komponentu
    return () => {
      document.body.classList.remove('register-body');
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
      document.body.style.backgroundAttachment = "";
    };
  }, []);

  // Generowanie losowego równania matematycznego
  const generateMathCaptcha = () => {
    // Generujemy dwie losowe liczby między 1 a 20
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    // Wybieramy losowe działanie (dodawanie, odejmowanie, mnożenie)
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    // Tworzymy wyrażenie i obliczamy wynik
    const expression = `${num1} ${operation} ${num2}`;
    let result;
    
    switch (operation) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '×':
        result = num1 * num2;
        break;
      default:
        result = 0;
    }
    
    setCaptchaExpression(expression);
    setCaptchaResult(result.toString());
    setCaptchaAnswer('');
    setCaptchaPassed(false);
    setCaptchaError('');
  };

  // Weryfikacja captchy
  const verifyCaptcha = () => {
    if (!captchaAnswer) {
      setCaptchaError('Proszę podać wynik działania');
      return false;
    }
    
    if (captchaAnswer.trim() === captchaResult) {
      setCaptchaPassed(true);
      return true;
    } else {
      setCaptchaError('Nieprawidłowy wynik, spróbuj ponownie');
      generateMathCaptcha(); // Generujemy nową captchę
      setCaptchaAnswer('');
      return false;
    }
  };

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

    // Sprawdzanie formularza
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    if (formData.password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków');
      return;
    }

    if (!acceptTerms) {
      setError('Musisz zaakceptować regulamin');
      return;
    }

    // Weryfikacja captchy
    if (!captchaPassed && !verifyCaptcha()) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Wystąpił błąd podczas rejestracji');
      }

      setSuccess(data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas rejestracji');
    }
  };

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('/images/regi_bckg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          zIndex: -1
        }}
      />
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-form-container">
            <h2 className="auth-title">Zarejestruj się</h2>
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
                <label htmlFor="name">Imię</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="auth-input"
                  placeholder="Wpisz swoje imię"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="surname">Nazwisko</label>
                <input
                  id="surname"
                  name="surname"
                  type="text"
                  required
                  className="auth-input"
                  placeholder="Wpisz swoje nazwisko"
                  value={formData.surname}
                  onChange={handleChange}
                />
              </div>

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
                <label htmlFor="phone">Numer telefonu (opcjonalnie)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="auth-input"
                  placeholder="+48 xxx xxx xxx"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="password">Hasło</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="auth-input"
                  placeholder="Minimum 8 znaków"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="confirmPassword">Potwierdź hasło</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="auth-input"
                  placeholder="Powtórz hasło"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {/* Akceptacja regulaminu */}
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={() => setAcceptTerms(!acceptTerms)}
                />
                <label htmlFor="acceptTerms">
                  Oświadczam, że zapoznałem się i akceptuję <Link to="/regulamin">Regulamin</Link> oraz <Link to="/prywatnosc">Politykę Prywatności</Link>
                </label>
              </div>

              {/* Matematyczna Captcha */}
              <div className="captcha-container">
                <div className="captcha-title">
                  Weryfikacja bezpieczeństwa: Rozwiąż działanie
                </div>
                
                <div className="math-captcha">
                  <div className="math-captcha-expression">
                    {captchaExpression} = ?
                  </div>
                  <input
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Wpisz wynik"
                  />
                  <button 
                    type="button"
                    className="refresh-captcha"
                    onClick={generateMathCaptcha}
                    title="Wygeneruj nowe działanie"
                  >
                    ↻
                  </button>
                </div>
                
                {captchaError && (
                  <div className="auth-error" style={{ margin: '0.5rem 0' }}>
                    <span>{captchaError}</span>
                  </div>
                )}
                
                <div className="captcha-instructions">
                  Rozwiązanie działania matematycznego pomaga nam potwierdzić, że nie jesteś botem.
                </div>
              </div>

              <div className="auth-button-container">
                <button type="submit" className="auth-button">
                  Zarejestruj się
                </button>
              </div>
              
              <div className="auth-links">
                <p>Masz już konto? <Link to="/login" className="auth-link">Zaloguj się</Link></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register; 