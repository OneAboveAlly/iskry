import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Załaduj zmienne środowiskowe
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '../../config/.env.production' : '.env' });

export interface SSLConfig {
  enabled: boolean;
  cert?: Buffer;
  key?: Buffer;
}

/**
 * Funkcja wczytująca konfigurację SSL z plików certyfikatów
 * @returns Konfiguracja SSL
 */
export function loadSSLConfig(): SSLConfig {
  // Sprawdzenie czy SSL jest włączone
  const sslEnabled = process.env.SSL_ENABLED === 'true';
  
  if (!sslEnabled) {
    return { enabled: false };
  }
  
  try {
    // Dla konfiguracji produkcyjnej
    if (process.env.NODE_ENV === 'production') {
      const domain = process.env.DOMAIN;
      
      // Standardowa ścieżka dla certyfikatów Let's Encrypt
      const certPath = `/etc/letsencrypt/live/${domain}/fullchain.pem`;
      const keyPath = `/etc/letsencrypt/live/${domain}/privkey.pem`;
      
      // Sprawdź czy pliki istnieją
      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        const cert = fs.readFileSync(certPath);
        const key = fs.readFileSync(keyPath);
        
        return {
          enabled: true,
          cert,
          key
        };
      } else {
        console.warn('Nie znaleziono plików certyfikatów SSL. Korzystanie z HTTP.');
        return { enabled: false };
      }
    }
    
    // Dla konfiguracji lokalnej/testowej
    const localCertPath = path.join(__dirname, '../../config/ssl/cert.pem');
    const localKeyPath = path.join(__dirname, '../../config/ssl/key.pem');
    
    if (fs.existsSync(localCertPath) && fs.existsSync(localKeyPath)) {
      const cert = fs.readFileSync(localCertPath);
      const key = fs.readFileSync(localKeyPath);
      
      return {
        enabled: true,
        cert,
        key
      };
    }
    
    return { enabled: false };
  } catch (error) {
    console.error('Błąd podczas wczytywania konfiguracji SSL:', error);
    return { enabled: false };
  }
} 