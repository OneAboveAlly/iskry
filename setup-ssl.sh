#!/bin/bash

# Skrypt do automatycznej konfiguracji SSL dla aplikacji Iskrzący
# Ten skrypt należy uruchomić po instalacji aplikacji i konfiguracji domeny

# Kolory do wiadomości
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Sprawdzenie czy użytkownik jest rootem lub ma uprawnienia sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Ten skrypt musi być uruchomiony jako root lub z uprawnieniami sudo!${NC}" 
   exit 1
fi

# Funkcja do wyświetlania wiadomości
message() {
  echo -e "${GREEN}==>${NC} $1"
}

error() {
  echo -e "${RED}BŁĄD:${NC} $1"
}

warning() {
  echo -e "${YELLOW}UWAGA:${NC} $1"
}

# Sprawdzenie czy konfiguracja domeny istnieje
CONFIG_DIR="./config"
if [ ! -f "$CONFIG_DIR/.env.production" ]; then
  error "Nie znaleziono pliku konfiguracyjnego produkcyjnego (.env.production)"
  exit 1
fi

# Pobranie domeny z pliku konfiguracyjnego
DOMAIN=$(grep "DOMAIN=" "$CONFIG_DIR/.env.production" | cut -d= -f2)
if [ -z "$DOMAIN" ]; then
  error "Nie znaleziono domeny w pliku konfiguracyjnym"
  exit 1
fi

# Sprawdzenie czy HTTPS jest włączone
SSL_ENABLED=$(grep "SSL_ENABLED=" "$CONFIG_DIR/.env.production" | cut -d= -f2)
if [ "$SSL_ENABLED" != "true" ]; then
  warning "SSL nie jest włączony w konfiguracji. Włączyć? (y/n)"
  read -r answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    message "Anulowano konfigurację SSL"
    exit 0
  fi
  # Aktualizacja pliku konfiguracyjnego
  sed -i 's/SSL_ENABLED=false/SSL_ENABLED=true/g' "$CONFIG_DIR/.env.production"
  message "Włączono SSL w konfiguracji"
fi

# Pobierz port serwera
PORT=$(grep "PORT=" "$CONFIG_DIR/.env.production" | cut -d= -f2)
if [ -z "$PORT" ]; then
  PORT="3000"
  warning "Nie znaleziono portu w konfiguracji. Użycie domyślnego: $PORT"
fi

# Sprawdzenie czy certbot jest zainstalowany
if ! command -v certbot &> /dev/null; then
  message "Instalowanie certbot..."
  apt-get update
  apt-get install -y certbot
fi

# Sprawdzenie czy nginx jest zainstalowany
if ! command -v nginx &> /dev/null; then
  message "Instalowanie nginx..."
  apt-get update
  apt-get install -y nginx
fi

# Zatrzymanie nginx, aby zwolnić port 80
message "Zatrzymywanie serwera nginx..."
systemctl stop nginx

# Generowanie certyfikatu Let's Encrypt
message "Generowanie certyfikatu SSL dla domeny $DOMAIN..."
certbot certonly --standalone --agree-tos --email admin@$DOMAIN -d $DOMAIN

# Sprawdzenie czy certyfikat został wygenerowany
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  error "Nie udało się wygenerować certyfikatu SSL"
  systemctl start nginx
  exit 1
fi

# Tworzenie konfiguracji nginx
message "Tworzenie konfiguracji nginx dla aplikacji z SSL..."
NGINX_CONFIG="/etc/nginx/sites-available/iskrzacy"

cat > "$NGINX_CONFIG" << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Przekieruj cały ruch HTTP na HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;
    
    # Certyfikaty SSL z Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Optymalizacja SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Przekierowanie do aplikacji Node.js
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Włączenie konfiguracji
message "Włączanie konfiguracji nginx..."
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testowanie konfiguracji
message "Testowanie konfiguracji nginx..."
nginx -t

# Uruchomienie nginx
message "Uruchamianie serwera nginx..."
systemctl start nginx

# Konfiguracja automatycznego odnawiania certyfikatu
message "Konfigurowanie automatycznego odnawiania certyfikatu..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -

message "Konfiguracja SSL zakończona pomyślnie!"
message "Twoja aplikacja jest teraz dostępna pod adresem: https://$DOMAIN"
message "Certyfikat będzie automatycznie odnawiany" 