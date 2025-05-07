import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

interface SocialLink {
  id: number;
  key: string;
  value: string;
  type: string;
  label: string;
  icon: string;
  displayOrder: number;
}

interface ContactInfo {
  id: number;
  key: string;
  value: string;
  type: string;
  label: string;
  displayOrder: number;
}

const Footer: React.FC = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/settings');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Separate social media links from contact info
        const social = data.filter((item: SocialLink) => item.type === 'social')
          .sort((a: SocialLink, b: SocialLink) => a.displayOrder - b.displayOrder);
        
        const contact = data.filter((item: ContactInfo) => item.type === 'contact')
          .sort((a: ContactInfo, b: ContactInfo) => a.displayOrder - b.displayOrder);
        
        setSocialLinks(social);
        setContactInfo(contact);
        setError(null);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Błąd podczas ładowania danych kontaktowych');
        
        // Set default values if API fails
        setSocialLinks([]);
        setContactInfo([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const renderSocialIcon = (icon: string) => {
    // Map social media names to Font Awesome classes or other icon libraries
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

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section contact-section">
          <h3>Kontakt:</h3>
          {loading ? (
            <p>Ładowanie...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : contactInfo.length === 0 ? (
            <p>Brak danych kontaktowych</p>
          ) : (
            <ul className="contact-list">
              {contactInfo.map((contact) => (
                <li key={contact.id} className="contact-item">
                  <i className={renderSocialIcon(contact.key)}></i>
                  <span>{contact.label}: </span>
                  <span className="contact-value">{contact.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="footer-section social-section">
          <h3>Znajdziesz mnie na:</h3>
          {loading ? (
            <p>Ładowanie...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : socialLinks.length === 0 ? (
            <p>Brak linków do mediów społecznościowych</p>
          ) : (
            <div className="social-icons">
              {socialLinks.map((social) => (
                <a 
                  key={social.id} 
                  href={social.value} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="social-icon"
                  title={social.label}
                >
                  <i className={renderSocialIcon(social.icon)}></i>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="footer-bottom">
        <p className="copyright">
          &copy; {currentYear} Iskrzący. Wszelkie prawa zastrzeżone. 
          <br />
          <span className="creator">Aplikacja webowa by Piotr Nowatciński</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer; 