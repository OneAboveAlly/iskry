import React from 'react';

interface SetupSSLInstructionsProps {
  domain: string;
  serverPort: string;
}

const SetupSSLInstructions: React.FC<SetupSSLInstructionsProps> = ({ domain, serverPort }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Instrukcje konfiguracji SSL/HTTPS</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Wymagania wstępne</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Serwer z systemem Linux (Ubuntu/Debian zalecany)</li>
          <li>Domena <span className="font-semibold">{domain}</span> wskazująca na IP serwera</li>
          <li>Dostęp administratora do serwera (sudo)</li>
          <li>Otwarty port 80 i 443 w firewallu</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Krok 1: Instalacja Certbot</h3>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            sudo apt update<br/>
            sudo apt install -y certbot
          </pre>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Krok 2: Generowanie certyfikatu</h3>
        <p className="mb-2">Upewnij się, że port 80 nie jest używany (zatrzymaj tymczasowo nginx/apache):</p>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto mb-3">
          <pre className="whitespace-pre-wrap">
            sudo systemctl stop nginx # lub apache2
          </pre>
        </div>
        <p className="mb-2">Uruchom certbot w trybie standalone:</p>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            sudo certbot certonly --standalone -d {domain}
          </pre>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Certyfikaty zostaną zapisane w katalogu <code>/etc/letsencrypt/live/{domain}/</code>
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Krok 3: Konfiguracja Nginx</h3>
        <p className="mb-2">Utwórz plik konfiguracyjny Nginx:</p>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            sudo nano /etc/nginx/sites-available/iskrzacy
          </pre>
        </div>
        <p className="mb-2">Wklej następującą konfigurację:</p>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="whitespace-pre-wrap">
{`server {
    listen 80;
    server_name ${domain};
    
    # Przekieruj cały ruch HTTP na HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain};
    
    # Certyfikaty SSL z Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    # Optymalizacja SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Przekierowanie do aplikacji Node.js
    location / {
        proxy_pass http://localhost:${serverPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`}
          </pre>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Krok 4: Aktywacja i uruchomienie</h3>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            sudo ln -s /etc/nginx/sites-available/iskrzacy /etc/nginx/sites-enabled/<br/>
            sudo nginx -t<br/>
            sudo systemctl restart nginx
          </pre>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Krok 5: Automatyczne odnawianie certyfikatu</h3>
        <p className="mb-2">Dodaj zadanie cron, aby automatycznie odnawiać certyfikat:</p>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            sudo crontab -e
          </pre>
        </div>
        <p className="mb-2">Dodaj linię:</p>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="whitespace-pre-wrap">
            0 3 * * * certbot renew --quiet && systemctl reload nginx
          </pre>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Troubleshooting</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Problem z prawami dostępu:</strong> Upewnij się, że certyfikaty są dostępne dla Nginx:
            <div className="bg-gray-100 p-2 rounded-md mt-1">
              <code>sudo chmod -R 755 /etc/letsencrypt/live/</code>
            </div>
          </li>
          <li>
            <strong>Błąd certyfikatu:</strong> Sprawdź logi Nginx:
            <div className="bg-gray-100 p-2 rounded-md mt-1">
              <code>sudo tail -f /var/log/nginx/error.log</code>
            </div>
          </li>
          <li>
            <strong>Aplikacja nie jest dostępna przez HTTPS:</strong> Upewnij się, że jest uruchomiona na porcie {serverPort}:
            <div className="bg-gray-100 p-2 rounded-md mt-1">
              <code>sudo netstat -tuln | grep {serverPort}</code>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SetupSSLInstructions; 