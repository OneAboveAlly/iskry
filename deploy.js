const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Konfiguracja wdrożeniowa
const config = {
  domain: null,
  sslEnabled: false,
  port: 3000,
  dbConfig: {
    host: 'localhost',
    port: 5432,
    database: 'iskrzacy',
    user: 'postgres',
    password: null
  }
};

// Asynchroniczna funkcja prompt
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupDeployment() {
  console.log('\n=== Konfiguracja wdrożenia projektu Iskrzący ===\n');
  
  // 1. Konfiguracja domeny
  config.domain = await prompt('Podaj nazwę domeny (np. iskrzacy.pl) lub adres IP serwera: ');
  
  // 2. Konfiguracja SSL
  const sslAnswer = await prompt('Czy chcesz skonfigurować SSL (https)? (tak/nie): ');
  config.sslEnabled = sslAnswer.toLowerCase() === 'tak';
  
  // 3. Konfiguracja portu
  const portAnswer = await prompt(`Podaj port, na którym ma działać aplikacja (domyślnie ${config.port}): `);
  if (portAnswer) config.port = parseInt(portAnswer, 10);
  
  // 4. Konfiguracja bazy danych
  console.log('\n=== Konfiguracja bazy danych ===');
  config.dbConfig.password = await prompt('Podaj hasło do bazy danych PostgreSQL: ');
  
  // 5. Generowanie plików konfiguracyjnych
  generateConfigFiles();
  
  // 6. Instrukcje dla SSL
  if (config.sslEnabled) {
    console.log('\n=== Instrukcje konfiguracji SSL (Let\'s Encrypt) ===');
    console.log('1. Upewnij się, że serwer jest dostępny pod skonfigurowaną domeną.');
    console.log('2. Zainstaluj certbot: sudo apt-get install certbot');
    console.log(`3. Uruchom: sudo certbot certonly --standalone -d ${config.domain}`);
    console.log('4. Certyfikaty zostaną zapisane w /etc/letsencrypt/live/' + config.domain);
    console.log('5. Skonfiguruj serwer proxy (nginx/apache) lub użyj bezpośrednio certyfikatów w aplikacji Node.js');
  }
  
  console.log('\n=== Konfiguracja zakończona ===');
  console.log('Pliki konfiguracyjne zostały wygenerowane w katalogu config/');
  
  // 7. Instrukcje uruchomienia
  console.log('\n=== Instrukcje uruchomienia ===');
  console.log('1. Zbuduj aplikację: npm run build');
  console.log('2. Uruchom serwer: npm start');
  if (config.sslEnabled) {
    console.log('3. Aplikacja będzie dostępna pod adresem: https://' + config.domain);
  } else {
    console.log('3. Aplikacja będzie dostępna pod adresem: http://' + config.domain);
  }
  
  rl.close();
}

function generateConfigFiles() {
  // Tworzymy katalog config jeśli nie istnieje
  const configDir = path.join(__dirname, 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
  
  // Generowanie pliku .env dla produkcji
  const envContent = `
PORT=${config.port}
NODE_ENV=production
DATABASE_URL=postgresql://${config.dbConfig.user}:${config.dbConfig.password}@${config.dbConfig.host}:${config.dbConfig.port}/${config.dbConfig.database}
DOMAIN=${config.domain}
SSL_ENABLED=${config.sslEnabled}
`;
  fs.writeFileSync(path.join(configDir, '.env.production'), envContent.trim());
  
  // Generowanie konfiguracji nginx (jeśli SSL jest włączone)
  if (config.sslEnabled) {
    const nginxConfig = `
server {
    listen 80;
    server_name ${config.domain};
    
    # Przekieruj cały ruch HTTP na HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${config.domain};
    
    # Certyfikaty SSL z Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/${config.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${config.domain}/privkey.pem;
    
    # Optymalizacja SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Przekierowanie do aplikacji Node.js
    location / {
        proxy_pass http://localhost:${config.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
    fs.writeFileSync(path.join(configDir, 'nginx.conf'), nginxConfig.trim());
  }
}

setupDeployment(); 