#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const { spawn } = require('child_process');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Konfiguracja instalacji
 */
const config = {
  // Konfiguracja ogólna
  appName: 'Iskrzący',
  mode: 'development', // 'development' lub 'production'
  
  // Konfiguracja bazy danych
  database: {
    host: 'localhost',
    port: 5432,
    name: 'iskrzacy',
    user: 'postgres',
    password: null
  },
  
  // Konfiguracja serwera
  server: {
    port: 3000,
    frontendPort: 5173
  },
  
  // Konfiguracja hostingu
  hosting: {
    domain: null,
    useSSL: false
  }
};

/**
 * Funkcja pomocnicza do zadawania pytań
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Funkcja do uruchamiania komend
 */
function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    
    console.log(`Uruchamianie: ${command} w katalogu ${cwd}`);
    
    const proc = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Komenda ${command} zakończyła się z kodem ${code}`));
      }
    });
  });
}

/**
 * Główna funkcja instalacyjna
 */
async function install() {
  console.log(`
=================================================
    Instalator aplikacji ${config.appName}
=================================================
  `);
  
  // 1. Wybór trybu
  console.log('\n=== Konfiguracja trybu ===');
  const modeAnswer = await prompt('Czy instalować w trybie produkcyjnym? (tak/nie): ');
  config.mode = modeAnswer.toLowerCase() === 'tak' ? 'production' : 'development';
  
  // 2. Konfiguracja bazy danych
  console.log('\n=== Konfiguracja bazy danych PostgreSQL ===');
  config.database.password = await prompt('Podaj hasło do bazy danych PostgreSQL: ');
  
  // 3. Konfiguracja hostingu (tylko w trybie produkcyjnym)
  if (config.mode === 'production') {
    console.log('\n=== Konfiguracja hostingu ===');
    config.hosting.domain = await prompt('Podaj nazwę domeny (np. iskrzacy.pl) lub adres IP: ');
    
    const sslAnswer = await prompt('Czy chcesz skonfigurować SSL (https)? (tak/nie): ');
    config.hosting.useSSL = sslAnswer.toLowerCase() === 'tak';
  }
  
  // 4. Podsumowanie konfiguracji
  console.log('\n=== Podsumowanie konfiguracji ===');
  console.log(`Tryb: ${config.mode}`);
  console.log(`Baza danych: ${config.database.name} na ${config.database.host}:${config.database.port}`);
  
  if (config.mode === 'production') {
    console.log(`Domena: ${config.hosting.domain}`);
    console.log(`SSL: ${config.hosting.useSSL ? 'Włączony' : 'Wyłączony'}`);
  }
  
  const confirmInstall = await prompt('\nCzy chcesz rozpocząć instalację? (tak/nie): ');
  if (confirmInstall.toLowerCase() !== 'tak') {
    console.log('Instalacja przerwana przez użytkownika.');
    rl.close();
    return;
  }
  
  // 5. Instalacja zależności
  try {
    console.log('\n=== Instalacja zależności ===');
    await runCommand('npm run install-all');
    
    // 6. Konfiguracja środowiska
    console.log('\n=== Konfiguracja środowiska ===');
    createEnvironmentFiles();
    
    // 7. Budowanie aplikacji (w trybie produkcyjnym)
    if (config.mode === 'production') {
      console.log('\n=== Budowanie aplikacji ===');
      await runCommand('cd client && npm run build');
      await runCommand('cd server && npm run build');
    }
    
    // 8. Konfiguracja bazy danych
    console.log('\n=== Konfiguracja bazy danych ===');
    await runCommand('cd server && npm run prisma:generate');
    await runCommand('cd server && npm run prisma:migrate');
    
    // 9. Konfiguracja produkcyjna (jeśli wybrano)
    if (config.mode === 'production') {
      console.log('\n=== Konfiguracja produkcyjna ===');
      generateProductionFiles();
      
      if (config.hosting.useSSL) {
        console.log('\n=== Instrukcje konfiguracji SSL ===');
        console.log('1. Upewnij się, że domena wskazuje na adres IP tego serwera');
        console.log('2. Zainstaluj certbot na serwerze: sudo apt-get install certbot');
        console.log(`3. Wygeneruj certyfikat: sudo certbot certonly --standalone -d ${config.hosting.domain}`);
        console.log('4. Uruchom aplikację: npm start');
      }
    }
    
    console.log('\n=== Instalacja zakończona ===');
    if (config.mode === 'development') {
      console.log('Aby uruchomić aplikację w trybie deweloperskim:');
      console.log('npm run dev');
    } else {
      console.log('Aby uruchomić aplikację w trybie produkcyjnym:');
      console.log('npm start');
    }
    
  } catch (error) {
    console.error('\n=== BŁĄD INSTALACJI ===');
    console.error(error);
    console.log('Próbuj ponowić instalację po rozwiązaniu problemów.');
  }
  
  rl.close();
}

/**
 * Tworzy pliki środowiskowe
 */
function createEnvironmentFiles() {
  // Tworzenie katalogu konfiguracji
  const configDir = path.join(process.cwd(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
  }
  
  // Plik .env dla serwera
  const serverEnv = `
PORT=${config.server.port}
NODE_ENV=${config.mode}
DATABASE_URL=postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}
JWT_SECRET=${generateRandomString(32)}
FRONTEND_URL=${config.mode === 'production' 
  ? `https://${config.hosting.domain}` 
  : `http://localhost:${config.server.frontendPort}`}
DOMAIN=${config.hosting.domain || 'localhost'}
SSL_ENABLED=${config.hosting.useSSL}
  `.trim();
  
  fs.writeFileSync(path.join(process.cwd(), 'server', '.env'), serverEnv);
  console.log('Utworzono plik .env dla serwera');
  
  // Plik .env dla produkcji
  if (config.mode === 'production') {
    fs.writeFileSync(path.join(configDir, '.env.production'), serverEnv);
    console.log('Utworzono plik .env.production dla konfiguracji produkcyjnej');
  }
}

/**
 * Generuje pliki dla konfiguracji produkcyjnej
 */
function generateProductionFiles() {
  const configDir = path.join(process.cwd(), 'config');
  
  // Konfiguracja Nginx
  if (config.hosting.useSSL) {
    const nginxConfig = `
server {
    listen 80;
    server_name ${config.hosting.domain};
    
    # Przekierowanie HTTP na HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ${config.hosting.domain};
    
    # Certyfikaty SSL z Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/${config.hosting.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${config.hosting.domain}/privkey.pem;
    
    # Optymalizacja SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    
    # Przekierowanie do aplikacji Node.js
    location / {
        proxy_pass http://localhost:${config.server.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
    `.trim();
    
    fs.writeFileSync(path.join(configDir, 'nginx.conf'), nginxConfig);
    console.log('Utworzono plik konfiguracyjny dla Nginx');
  }
  
  // Skrypt startowy dla PM2
  const pm2Config = `
module.exports = {
  apps: [
    {
      name: '${config.appName}',
      script: './server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: ${config.server.port}
      }
    }
  ]
};
  `.trim();
  
  fs.writeFileSync(path.join(configDir, 'ecosystem.config.js'), pm2Config);
  console.log('Utworzono plik konfiguracyjny dla PM2');
  
  // Aktualizacja package.json dla skryptów produkcyjnych
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      start: 'NODE_ENV=production node server/dist/index.js',
      'start:pm2': 'pm2 start config/ecosystem.config.js'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Zaktualizowano package.json o skrypty produkcyjne');
  } catch (error) {
    console.error('Błąd podczas aktualizacji package.json:', error);
  }
}

/**
 * Generuje losowy ciąg znaków
 */
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Uruchom instalator
install(); 