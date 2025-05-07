# 🚀 Instrukcja wdrożenia aplikacji Iskrzący na serwer

Ten dokument zawiera instrukcje dotyczące przygotowania aplikacji Iskrzący do hostingu na serwerze VPS z własną domeną i certyfikatem SSL.

## 📋 Wymagania wstępne
- Serwer VPS z systemem Linux (Ubuntu 22.04 LTS lub nowszy zalecany)
- Dostęp SSH do serwera
- Zarejestrowana domena (np. iskrzacy.pl) wskazująca na IP serwera VPS
- Podstawowa znajomość komend Linux

## 🔄 Dwie metody instalacji

Aplikacja oferuje dwie metody instalacji i konfiguracji:

1. **Konfiguracja przez GUI instalatora** - podczas instalacji aplikacji w interfejsie graficznym można skonfigurować domenę i SSL
2. **Konfiguracja przez skrypty wiersza poleceń** - dla użytkowników zaawansowanych lub w przypadku instalacji bezobsługowej

## 🔧 Metoda 1: Konfiguracja przez GUI instalatora

### 1️⃣ Przygotowanie serwera

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git nginx
```

### 2️⃣ Instalacja Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3️⃣ Instalacja PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 4️⃣ Konfiguracja bazy danych
```bash
sudo -i -u postgres
psql
CREATE DATABASE iskrzacy;
CREATE USER myuser WITH ENCRYPTED PASSWORD 'haslo';
GRANT ALL PRIVILEGES ON DATABASE iskrzacy TO myuser;
\q
exit
```

### 5️⃣ Instalacja aplikacji
```bash
git clone [twoje-repozytorium] /var/www/iskrzacy
cd /var/www/iskrzacy
npm run install-all
```

### 6️⃣ Uruchomienie aplikacji w trybie instalacji
```bash
cd /var/www/iskrzacy
npm run dev
```

### 7️⃣ Konfiguracja przez przeglądarkę

1. Otwórz przeglądarkę i przejdź do `http://IP_SERWERA:5173`
2. Postępuj zgodnie z instrukcjami instalatora
3. W kroku konfiguracji hostingu podaj swoją domenę i zaznacz opcję SSL
4. Dokończ instalację

### 8️⃣ Automatyczna konfiguracja SSL

Po zakończeniu instalacji uruchom skrypt konfiguracji SSL:

```bash
cd /var/www/iskrzacy
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

Skrypt automatycznie:
- Zainstaluje certbot
- Wygeneruje certyfikat SSL dla Twojej domeny
- Skonfiguruje NGINX jako proxy
- Ustawi automatyczne odnawianie certyfikatu

### 9️⃣ Uruchomienie aplikacji w trybie produkcyjnym

```bash
npm run build
npm start
```

## 🔧 Metoda 2: Konfiguracja przez skrypty wiersza poleceń

### 1️⃣ Podstawowe pakiety
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git nginx
```

### 2️⃣ Instalacja Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3️⃣ Instalacja PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### 4️⃣ Konfiguracja bazy danych
```bash
sudo -i -u postgres
psql
CREATE DATABASE iskrzacy;
CREATE USER myuser WITH ENCRYPTED PASSWORD 'haslo';
GRANT ALL PRIVILEGES ON DATABASE iskrzacy TO myuser;
\q
exit
```

### 5️⃣ Pobierz kod źródłowy
```bash
git clone [twoje-repozytorium] /var/www/iskrzacy
cd /var/www/iskrzacy
```

### 6️⃣ Instalacja zależności
```bash
npm run install-all
```

### 7️⃣ Konfiguracja wdrożenia
```bash
node deploy.js
```

Skrypt zada Ci kilka pytań:
- **Domena**: Podaj swoją domenę (np. iskrzacy.pl)
- **SSL**: Czy chcesz skonfigurować HTTPS? (zalecane)
- **Port**: Na jakim porcie ma działać aplikacja (domyślnie 3000)
- **Hasło do bazy danych**: Podaj hasło utworzone wcześniej

### 8️⃣ Konfiguracja SSL (HTTPS)
```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

### 9️⃣ Uruchomienie aplikacji
Możesz użyć menedżera procesów PM2 do zarządzania aplikacją:

```bash
sudo npm install -g pm2
cd /var/www/iskrzacy
npm run build
pm2 start server/dist/index.js --name iskrzacy
pm2 save
pm2 startup
```

## 🔄 Aktualizacja aplikacji

Aby zaktualizować aplikację:

```bash
cd /var/www/iskrzacy
git pull
npm run install-all
npm run build
pm2 restart iskrzacy # lub systemctl restart iskrzacy jeśli używasz systemd
```

## ❓ Rozwiązywanie problemów

### Problem z połączeniem do bazy danych
Sprawdź plik `config/.env.production` i upewnij się, że dane dostępowe do bazy danych są poprawne.

### Problem z certyfikatem SSL
Upewnij się, że certyfikaty zostały poprawnie wygenerowane:
```bash
sudo ls -la /etc/letsencrypt/live/twojadomena.pl/
```

### Ręczne odnawianie certyfikatu SSL
```bash
sudo certbot renew --dry-run # sprawdzenie
sudo certbot renew # odnawianie jeśli potrzebne
sudo systemctl reload nginx # przeładowanie nginx
```

## 🛡️ Bezpieczeństwo
- Rozważ skonfigurowanie firewalla (ufw)
- Regularnie aktualizuj system i zależności
- Włącz automatyczne aktualizacje bezpieczeństwa:
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure unattended-upgrades
  ```

---

W przypadku problemów lub pytań, skontaktuj się z administratorem systemu. 