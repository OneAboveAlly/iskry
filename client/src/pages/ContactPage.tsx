import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../styles/ContactPage.css';

interface ContactInfo {
  id: number;
  key: string;
  value: string;
  type: string;
  label: string;
  displayOrder: number;
}

const ContactPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/settings');
        if (!response.ok) {
          throw new Error('Nie udało się pobrać danych kontaktowych');
        }
        const data = await response.json();
        const contactData = data.filter((item: ContactInfo) => item.type === 'contact')
          .sort((a: ContactInfo, b: ContactInfo) => a.displayOrder - b.displayOrder);
        setContactInfo(contactData);
      } catch (err) {
        setError('Wystąpił błąd podczas pobierania danych kontaktowych');
        console.error('Error fetching contact info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const renderSocialIcon = (icon: string) => {
    const iconMap: {[key: string]: string} = {
      facebook: 'fab fa-facebook',
      twitter: 'fab fa-twitter',
      instagram: 'fab fa-instagram',
      youtube: 'fab fa-youtube',
      linkedin: 'fab fa-linkedin',
      tiktok: 'fab fa-tiktok',
      pinterest: 'fab fa-pinterest',
      telegram: 'fab fa-telegram',
      whatsapp: 'fab fa-whatsapp',
      phone: 'fas fa-phone',
      email: 'fas fa-envelope',
      website: 'fas fa-globe',
      location: 'fas fa-map-marker-alt'
    };

    return iconMap[icon.toLowerCase()] || 'fas fa-link';
  };

  if (loading) {
    return (
      <div className="contact-page loading">
        <div className="spinner"></div>
        <p>Ładowanie danych kontaktowych...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contact-page error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="contact-container">
        <h1>Kontakt</h1>
        
        <div className="contact-info">
          {contactInfo.length > 0 ? (
            contactInfo.map((contact) => (
              <div key={contact.id} className="contact-item">
                <i className={renderSocialIcon(contact.key)}></i>
                <span>{contact.label}: </span>
                <span className="contact-value">{contact.value}</span>
              </div>
            ))
          ) : (
            <p>Brak danych kontaktowych</p>
          )}
        </div>

        <div className="appointment-section">
          <h2>Umów wizytę</h2>
          {isAuthenticated ? (
            <div className="booking-info">
              <p>Aby umówić wizytę, przejdź do "Panelu ucznia", gdzie dostępny jest moduł rezerwacji z kalendarzem. Możesz tam wybrać wolny termin i dokonać rezerwacji.</p>
              <Link to="/student" className="login-button">
                Przejdź do panelu ucznia
              </Link>
            </div>
          ) : (
            <div className="login-required">
              <p>Aby umówić wizytę, musisz się zarejestrować i zalogować.</p>
              <Link to="/register" className="login-button">
                Zarejestruj się
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 