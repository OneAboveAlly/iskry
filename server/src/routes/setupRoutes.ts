import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Deklaracja dla globalnego obiektu prisma
declare global {
  var prisma: PrismaClient | undefined;
}

const router = Router();
const prisma = new PrismaClient();

// Helper function to check if a path exists
async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Helper function to find PostgreSQL installation
async function findPostgresPath(customPath?: string): Promise<{ path: string; version: string } | null> {
  // If custom path is provided, check it first
  if (customPath) {
    try {
      const psqlPath = customPath.endsWith('bin') ? `${customPath}\\psql.exe` : `${customPath}\\bin\\psql.exe`;
      if (await pathExists(psqlPath)) {
        try {
          const versionOutput = execSync(`"${psqlPath}" --version`, { stdio: 'pipe' }).toString();
          return {
            path: psqlPath,
            version: versionOutput.split(' ')[2]?.trim() || 'unknown'
          };
        } catch (e) {
          console.log(`Found PostgreSQL at ${psqlPath} but failed to get version`);
        }
      }
    } catch (error) {
      console.log(`Error checking custom path ${customPath}:`, error);
    }
  }

  // Common PostgreSQL installation directories
  const commonPaths = [
    'C:\\Program Files\\PostgreSQL',
    'C:\\Program Files (x86)\\PostgreSQL',
  ];

  for (const basePath of commonPaths) {
    try {
      // Check if base path exists
      if (await pathExists(basePath)) {
        // List all version directories
        const versions = await fs.readdir(basePath);
        
        // Sort versions in descending order (newest first)
        versions.sort().reverse();

        for (const version of versions) {
          const psqlPath = `${basePath}\\${version}\\bin\\psql.exe`;
          if (await pathExists(psqlPath)) {
            try {
              const versionOutput = execSync(`"${psqlPath}" --version`, { stdio: 'pipe' }).toString();
              return {
                path: psqlPath,
                version: versionOutput.split(' ')[2]?.trim() || version
              };
            } catch (e) {
              console.log(`Found PostgreSQL at ${psqlPath} but failed to get version`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`Error checking path ${basePath}:`, error);
    }
  }

  return null;
}

// Dodajmy funkcję do przeładowania klienta Prisma
async function reinitializePrismaClient() {
  try {
    console.log('Disconnecting current Prisma client...');
    
    // Zamknij bieżące połączenie
    await prisma.$disconnect();
    
    // Wyczyść moduł Prisma z pamięci podręcznej
    Object.keys(require.cache).forEach(key => {
      if (key.includes('@prisma/client')) {
        delete require.cache[key];
      }
    });
    
    console.log(`Creating new Prisma client with DATABASE_URL: ${process.env.DATABASE_URL}`);
    
    // Utwórz nowego klienta Prisma z bieżącym DATABASE_URL
    const newPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    // Testowe połączenie
    console.log('Testing connection with new Prisma client...');
    await newPrisma.$connect();
    console.log('Connection successful!');
    
    // Zaktualizuj globalny obiekt
    global.prisma = newPrisma;
    
    return global.prisma;
  } catch (error) {
    console.error('Error reinitializing Prisma client:', error);
    throw error;
  }
}

// Setup database endpoint
router.post('/setup-database', async (req, res) => {
  try {
    const { 
      dbName, 
      dbUser, 
      dbPassword, 
      postgresPath, 
      adminEmail, 
      adminPassword, 
      adminName, 
      adminSurname,
      configureEmail,
      emailHost,
      emailPort,
      emailSecure,
      emailUser,
      emailPassword,
      emailFrom,
      frontendUrl,
      domain,
      enableSSL,
      serverPort
    } = req.body;

    // Validate database parameters
    if (!dbName || !dbUser || !dbPassword || !postgresPath) {
      return res.status(400).json({
        message: 'Brakujące dane bazy danych. Wymagane pola: dbName, dbUser, dbPassword, postgresPath'
      });
    }

    // Validate admin parameters if provided
    if (adminEmail || adminPassword || adminName || adminSurname) {
      if (!adminEmail || !adminPassword || !adminName || !adminSurname) {
        return res.status(400).json({
          message: 'Brakujące dane administratora. Wymagane pola: adminEmail, adminPassword, adminName, adminSurname'
        });
      }

      if (adminPassword.length < 8) {
        return res.status(400).json({
          message: 'Hasło administratora musi mieć co najmniej 8 znaków'
        });
      }
    }

    // Validate email configuration if enabled
    if (configureEmail) {
      if (!emailHost || !emailPort || !emailUser || !emailPassword || !emailFrom) {
        return res.status(400).json({
          message: 'Brakujące dane konfiguracji email. Wymagane pola: emailHost, emailPort, emailUser, emailPassword, emailFrom'
        });
      }
    }

    // Validate SSL configuration if enabled
    if (enableSSL && !domain) {
      return res.status(400).json({
        message: 'Aby włączyć SSL, wymagane jest podanie nazwy domeny'
      });
    }

    // Determine environment type based on settings
    const isProduction = configureEmail || domain || enableSSL;
    const resolvedPort = serverPort || '3001';
    
    // Create .env file with base configuration
    let envContent = `DATABASE_URL="postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}"
JWT_SECRET="${Math.random().toString(36).slice(-20)}"
PORT=${resolvedPort}
NODE_ENV=${isProduction ? 'production' : 'development'}`;

    // Add domain and SSL configuration if provided
    if (domain) {
      envContent += `\n
# Konfiguracja hostingu
DOMAIN=${domain}
SSL_ENABLED=${enableSSL === true ? 'true' : 'false'}`;
    }

    // Add email configuration if enabled
    if (configureEmail) {
      envContent += `\n
# Konfiguracja email do resetowania hasła
EMAIL_HOST=${emailHost}
EMAIL_PORT=${emailPort}
EMAIL_SECURE=${emailSecure === true ? 'true' : 'false'}
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPassword}
EMAIL_FROM=${emailFrom}
FRONTEND_URL=${frontendUrl || (domain ? `https://${domain}` : 'http://localhost:5173')}`;
    }

    const envPath = path.join(__dirname, '../../.env');
    await fs.writeFile(envPath, envContent);
    
    // Załaduj plik .env po utworzeniu
    dotenv.config({ path: envPath });
    
    // Aktualizuj zmienną środowiskową DATABASE_URL w bieżącym procesie
    process.env.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`;
    console.log('Environment variables updated with new DATABASE_URL');

    // Create production config directory and .env.production if domain is set
    if (domain) {
      try {
        // Ensure config directory exists
        const configDir = path.join(__dirname, '../../../config');
        if (!await pathExists(configDir)) {
          await fs.mkdir(configDir, { recursive: true });
        }
        
        // Create .env.production
        await fs.writeFile(path.join(configDir, '.env.production'), envContent);
        console.log('Created production environment file in config directory');
        
        // Generate nginx config if SSL is enabled
        if (enableSSL) {
          const nginxConfig = `
server {
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
        proxy_pass http://localhost:${resolvedPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
          await fs.writeFile(path.join(configDir, 'nginx.conf'), nginxConfig);
          console.log('Created nginx configuration in config directory');
          
          // Create SSL directory
          const sslDir = path.join(configDir, 'ssl');
          if (!await pathExists(sslDir)) {
            await fs.mkdir(sslDir, { recursive: true });
          }
        }
      } catch (error) {
        console.error('Error creating production configuration files:', error);
      }
    }

    // Find PostgreSQL installation
    const postgres = await findPostgresPath(postgresPath);
    
    if (!postgres) {
      throw new Error(
        'Nie znaleziono instalacji PostgreSQL. Sprawdź czy:\n' +
        '1. PostgreSQL jest zainstalowany w systemie\n' +
        '2. Podana ścieżka jest poprawna\n' +
        '3. W katalogu bin znajduje się plik psql.exe'
      );
    }

    console.log(`Found PostgreSQL ${postgres.version} at ${postgres.path}`);

    // Create database
    const createDbSQL = `
      DROP DATABASE IF EXISTS "${dbName}";
      CREATE DATABASE "${dbName}"
      WITH
      OWNER = "${dbUser}"
      ENCODING = 'UTF8'
      LC_COLLATE = 'Polish_Poland.1250'
      LC_CTYPE = 'Polish_Poland.1250'
      TABLESPACE = pg_default
      CONNECTION LIMIT = -1
      IS_TEMPLATE = False;`;

    const sqlFilePath = path.join(__dirname, '../../create-db.sql');
    await fs.writeFile(sqlFilePath, createDbSQL);

    try {
      // Set PGPASSWORD environment variable to avoid password prompt
      process.env.PGPASSWORD = dbPassword;

      try {
        // First, connect to the default 'postgres' database to create the new database
        console.log('Attempting to connect to PostgreSQL...');
        execSync(`"${postgres.path}" -U ${dbUser} -d postgres -c "SELECT 1"`, { stdio: 'pipe' });
        
        console.log('Creating database...');
        // Execute the SQL script to create the database
        execSync(`"${postgres.path}" -U ${dbUser} -d postgres -f "${sqlFilePath}"`, { stdio: 'pipe' });
        console.log('Database created successfully');
      } catch (error: any) {
        console.error('Database creation error:', error);
        throw new Error(
          'Nie można utworzyć bazy danych. Sprawdź czy:\n' +
          `1. Użytkownik ${dbUser} ma uprawnienia do tworzenia baz danych\n` +
          '2. Hasło jest poprawne\n' +
          `3. Baza danych o nazwie ${dbName} nie jest aktualnie używana\n` +
          `4. Serwer PostgreSQL jest uruchomiony i dostępny na porcie 5432`
        );
      } finally {
        // Clear the password from environment
        delete process.env.PGPASSWORD;
      }

      // Update DATABASE_URL to use the new database
      process.env.DATABASE_URL = `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`;

      // Setup Prisma
      console.log('Setting up Prisma...');
      try {
        // Try to remove existing Prisma files first
        try {
          execSync('rmdir /s /q .\\node_modules\\.prisma', { stdio: 'pipe' });
        } catch (e) {
          console.log('Could not remove existing Prisma files, continuing...');
        }

        // Try to generate Prisma client
        try {
          console.log('Attempting to generate Prisma client...');
          execSync('npx prisma generate', { stdio: 'pipe' });
          console.log('Prisma client generated successfully');
        } catch (genError) {
          console.log('Failed to generate Prisma client normally, trying with elevated permissions...');
          
          // Create a temporary batch file
          const batchContent = `@echo off
cd /d "%~dp0"
powershell -Command "Start-Process cmd -ArgumentList '/c cd /d \"%~dp0\" && npx prisma generate' -Verb RunAs -Wait"`;
          
          const batchPath = path.join(__dirname, '../../generate-prisma.bat');
          await fs.writeFile(batchPath, batchContent);
          
          // Run the batch file
          console.log('Running generate-prisma.bat with elevated permissions...');
          execSync(`"${batchPath}"`, { stdio: 'pipe' });
          console.log('Prisma client generated with elevated permissions');
        }

        // Verify Prisma client was generated
        const prismaClientPath = path.join(__dirname, '../../node_modules/.prisma/client');
        if (!await pathExists(prismaClientPath)) {
          throw new Error('Prisma client generation failed. Please try running generate-prisma.bat manually as administrator.');
        }

        // Push schema to database
        console.log('Pushing Prisma schema to database...');
        try {
          // Set PGPASSWORD for Prisma
          process.env.PGPASSWORD = dbPassword;
          
          // Push schema to database
          execSync('npx prisma db push', { stdio: 'pipe' });
          console.log('Schema pushed successfully');
        } catch (error) {
          console.error('Schema push error:', error);
          throw new Error('Błąd podczas aktualizacji schematu bazy danych');
        } finally {
          // Clear the password from environment
          delete process.env.PGPASSWORD;
        }

        // Przeładuj klienta Prisma, aby uwzględnił nowe DATABASE_URL
        console.log('Reloading Prisma client with new DATABASE_URL...');
        await reinitializePrismaClient();

        // Verify database connection
        console.log('Verifying database connection...');
        try {
          // Set PGPASSWORD for the final verification
          process.env.PGPASSWORD = dbPassword;
          const testConnection = await prisma.$queryRaw`SELECT 1`;
          console.log('Database connection verified');
        } catch (error) {
          console.error('Database connection error:', error);
          throw new Error('Nie można połączyć się z bazą danych. Sprawdź czy:\n' +
            '1. PostgreSQL jest uruchomiony\n' +
            '2. Użytkownik i hasło są poprawne\n' +
            '3. Baza danych została utworzona');
        } finally {
          // Clear the password from environment
          delete process.env.PGPASSWORD;
        }

        console.log('Prisma setup completed');
      } catch (error: any) {
        console.error('Prisma setup error:', error);
        throw new Error(
          typeof error.message === 'string' ? error.message :
          'Błąd podczas konfiguracji Prisma. Sprawdź czy masz uprawnienia administratora.'
        );
      }

      // After successful database setup, push schema to database
      console.log('Pushing Prisma schema to database...');
      try {
        // Set PGPASSWORD for Prisma
        process.env.PGPASSWORD = dbPassword;
        
        // Push schema to database
        execSync('npx prisma db push', { stdio: 'pipe' });
        console.log('Schema pushed successfully');
      } catch (error) {
        console.error('Schema push error:', error);
        throw new Error('Błąd podczas aktualizacji schematu bazy danych');
      } finally {
        // Clear the password from environment
        delete process.env.PGPASSWORD;
      }

      // After successful database setup and schema push, create admin account if data provided
      if (adminEmail && adminPassword && adminName && adminSurname) {
        try {
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          
          // Check if user with this email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
          });

          if (existingUser) {
            // Update existing user instead of creating a new one
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                email: adminEmail,
                password: hashedPassword,
                name: adminName,
                surname: adminSurname,
                approved: true,
                role: 'ADMIN'
              }
            });
            
            console.log('Konto administratora zaktualizowane pomyślnie');
            
            // Create installation flag file
            await fs.writeFile(path.join(__dirname, '../../.installed'), 'true');

            // Wykonaj dodatkową konfigurację dla resetowania hasła
            if (configureEmail) {
              try {
                console.log('Konfiguracja funkcji resetowania hasła...');
                
                // Sprawdź, czy schema.prisma zawiera model PasswordReset
                const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
                let schemaContent = await fs.readFile(schemaPath, 'utf8');
                
                // Jeśli model już istnieje, nie rób nic
                if (schemaContent.includes('model PasswordReset')) {
                  console.log('Model PasswordReset już istnieje w schemacie.');
                } else {
                  // Dodaj model PasswordReset do schematu
                  console.log('Dodawanie modelu PasswordReset do schematu...');
                  
                  const passwordResetModel = `
model PasswordReset {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
`;

                  // Znajdź model User i dodaj relację
                  if (!schemaContent.includes('passwordResets PasswordReset[]')) {
                    schemaContent = schemaContent.replace(
                      /model User {([\s\S]*?)}/,
                      (match, userContent) => {
                        return `model User {${userContent}  passwordResets PasswordReset[] // relation to password reset tokens\n}`;
                      }
                    );
                  }
                  
                  // Dodaj model PasswordReset na końcu pliku
                  schemaContent += passwordResetModel;
                  
                  // Zapisz zaktualizowany schemat
                  await fs.writeFile(schemaPath, schemaContent);
                  console.log('Schemat Prisma został zaktualizowany');
                }
                
                // Wykonaj migrację i wygeneruj klienta
                try {
                  console.log('Wykonywanie migracji bazy danych...');
                  // Ustaw hasło dla Prisma
                  process.env.PGPASSWORD = dbPassword;
                  
                  // Aktualizuj schemat bazy danych
                  execSync('npx prisma db push', { stdio: 'pipe' });
                  console.log('Schema pushed successfully');
                } catch (error) {
                  console.error('Błąd podczas aktualizacji schematu bazy danych:', error);
                } finally {
                  delete process.env.PGPASSWORD;
                }
              } catch (error) {
                console.error('Błąd podczas konfiguracji resetowania hasła:', error);
              }
            }

            res.json({
              message: 'Instalacja zakończona pomyślnie. Zaktualizowano bazę danych i konto administratora.',
              databaseCreated: true,
              adminCreated: true
            });
          } else {
            // Create new user if they don't exist
            await prisma.user.create({
              data: {
                email: adminEmail,
                password: hashedPassword,
                name: adminName,
                surname: adminSurname,
                isAdmin: true,
                approved: true,
                role: 'ADMIN'
              }
            });

            console.log('Konto administratora utworzone pomyślnie');
            
            // Create installation flag file only after admin is created
            await fs.writeFile(path.join(__dirname, '../../.installed'), 'true');

            // Wykonaj dodatkową konfigurację dla resetowania hasła
            if (configureEmail) {
              try {
                console.log('Konfiguracja funkcji resetowania hasła...');
                
                // Sprawdź, czy schema.prisma zawiera model PasswordReset
                const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
                let schemaContent = await fs.readFile(schemaPath, 'utf8');
                
                // Jeśli model już istnieje, nie rób nic
                if (schemaContent.includes('model PasswordReset')) {
                  console.log('Model PasswordReset już istnieje w schemacie.');
                } else {
                  // Dodaj model PasswordReset do schematu
                  console.log('Dodawanie modelu PasswordReset do schematu...');
                  
                  const passwordResetModel = `
model PasswordReset {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
`;

                  // Znajdź model User i dodaj relację
                  if (!schemaContent.includes('passwordResets PasswordReset[]')) {
                    schemaContent = schemaContent.replace(
                      /model User {([\s\S]*?)}/,
                      (match, userContent) => {
                        return `model User {${userContent}  passwordResets PasswordReset[] // relation to password reset tokens\n}`;
                      }
                    );
                  }
                  
                  // Dodaj model PasswordReset na końcu pliku
                  schemaContent += passwordResetModel;
                  
                  // Zapisz zaktualizowany schemat
                  await fs.writeFile(schemaPath, schemaContent);
                  console.log('Schemat Prisma został zaktualizowany');
                }
                
                // Wykonaj migrację i wygeneruj klienta
                try {
                  console.log('Wykonywanie migracji bazy danych...');
                  // Ustaw hasło dla Prisma
                  process.env.PGPASSWORD = dbPassword;
                  
                  // Aktualizuj schemat bazy danych
                  execSync('npx prisma db push', { stdio: 'pipe' });
                  console.log('Schema pushed successfully');
                } catch (error) {
                  console.error('Błąd podczas aktualizacji schematu bazy danych:', error);
                } finally {
                  delete process.env.PGPASSWORD;
                }
              } catch (error) {
                console.error('Błąd podczas konfiguracji resetowania hasła:', error);
              }
            }

            res.json({
              message: 'Instalacja zakończona pomyślnie. Utworzono bazę danych i konto administratora.',
              databaseCreated: true,
              adminCreated: true
            });
          }
        } catch (error) {
          console.error('Błąd podczas tworzenia konta administratora:', error);
          res.status(500).json({
            message: 'Baza danych została utworzona, ale wystąpił błąd podczas tworzenia konta administratora',
            databaseCreated: true,
            adminCreated: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      } else {
        res.json({
          message: 'Baza danych została utworzona pomyślnie. Możesz teraz utworzyć konto administratora.',
          databaseCreated: true,
          adminCreated: false
        });
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      res.status(500).json({ 
        message: error.message || 'Wystąpił błąd podczas konfiguracji bazy danych',
        details: error.toString()
      });
    }
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Wystąpił błąd podczas instalacji',
      databaseCreated: false,
      adminCreated: false
    });
  }
});

// Setup admin account endpoint
router.post('/setup-admin', async (req, res) => {
  try {
    const { adminEmail, adminPassword, adminName, adminSurname } = req.body;

    // Create admin user
    console.log('Creating admin user...');
    try {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Check if user with this email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      if (existingUser) {
        // Update existing user instead of creating a new one
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            surname: adminSurname,
            approved: true,
            role: 'ADMIN'
          }
        });
        res.json({ message: 'Konto administratora zostało zaktualizowane' });
      } else {
        // Create new user if they don't exist
        await prisma.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            surname: adminSurname,
            approved: true,
            role: 'ADMIN'
          }
        });
        res.json({ message: 'Konto administratora zostało utworzone' });
      }
    } catch (error: any) {
      console.error('Admin user creation error:', error);
      throw new Error('Błąd podczas tworzenia konta administratora. Sprawdź czy email nie jest już zajęty.');
    }
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      message: error.message || 'Wystąpił błąd podczas tworzenia konta administratora',
      details: error.toString()
    });
  }
});

// Check installation status
router.get('/check-installation', async (req, res) => {
  try {
    // Sprawdź czy istnieje plik .env
    const envExists = await pathExists(path.join(__dirname, '../../.env'));
    if (!envExists) {
      return res.json({ isInstalled: false });
    }

    // Sprawdź czy istnieje baza danych i czy jest skonfigurowana
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.json({ isInstalled: true });
    } catch (error) {
      return res.json({ isInstalled: false });
    }
  } catch (error) {
    console.error('Error checking installation status:', error);
    res.status(500).json({ message: 'Błąd podczas sprawdzania statusu instalacji' });
  }
});

// Check PostgreSQL installation
router.get('/check-postgres', async (req, res) => {
  try {
    // Try to find psql in common locations
    const possiblePaths = [
      'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\13\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\12\\bin\\psql.exe',
      'psql.exe' // Try if psql is in PATH
    ];

    let isInstalled = false;
    let foundPath = '';
    let version = '';

    for (const path of possiblePaths) {
      try {
        const output = execSync(`"${path}" --version`).toString();
        isInstalled = true;
        foundPath = path;
        version = output.split(' ')[2].trim();
        break;
      } catch (e) {
        continue;
      }
    }

    res.json({ 
      isInstalled,
      path: foundPath,
      version
    });
  } catch (error) {
    console.error('Error checking PostgreSQL installation:', error);
    res.json({ 
      isInstalled: false,
      path: '',
      version: ''
    });
  }
});

// Verify PostgreSQL path
router.post('/verify-postgres-path', async (req, res) => {
  try {
    const { path: postgresPath } = req.body;
    if (!postgresPath) {
      return res.json({ valid: false });
    }

    console.log('Checking PostgreSQL path:', postgresPath);
    
    // Sprawdź czy ścieżka kończy się na bin
    const binPath = postgresPath.endsWith('bin') ? postgresPath : `${postgresPath}\\bin`;
    console.log('Bin path:', binPath);
    
    // Sprawdź czy katalog bin istnieje
    const binExists = await pathExists(binPath);
    console.log('Bin directory exists:', binExists);
    
    if (!binExists) {
      console.log('Bin directory not found');
      return res.json({ valid: false });
    }

    // Sprawdź zawartość katalogu bin
    const files = await fs.readdir(binPath);
    console.log('Files in bin directory:', files);
    
    // Sprawdź czy psql.exe istnieje
    const psqlPath = `${binPath}\\psql.exe`;
    console.log('Looking for psql.exe at:', psqlPath);
    
    const psqlExists = await pathExists(psqlPath);
    console.log('psql.exe exists:', psqlExists);
    
    if (!psqlExists) {
      console.log('psql.exe not found');
      return res.json({ valid: false });
    }

    try {
      console.log('Trying to get psql version...');
      const output = execSync(`"${psqlPath}" --version`).toString();
      console.log('psql version output:', output);
      const version = output.split(' ')[2].trim();
      res.json({ 
        valid: true,
        version
      });
    } catch (error) {
      console.error('Error getting psql version:', error);
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error verifying PostgreSQL path:', error);
    res.json({ valid: false });
  }
});

// Verify PostgreSQL connection
router.post('/verify-postgres-connection', async (req, res) => {
  console.log('=== Starting connection verification ===');
  try {
    const { path, user, password, database } = req.body;
    console.log('Received connection request:', { path, user, database });
    
    if (!path || !user || !password || !database) {
      const missing = [];
      if (!path) missing.push('path');
      if (!user) missing.push('user');
      if (!password) missing.push('password');
      if (!database) missing.push('database');
      console.log('Missing required fields:', missing);
      return res.json({ connected: false, error: `Brakujące dane połączenia: ${missing.join(', ')}` });
    }

    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = password;

    try {
      const psqlPath = path.endsWith('bin') ? `${path}\\psql.exe` : `${path}\\bin\\psql.exe`;
      console.log('Checking psql at path:', psqlPath);
      
      // First check if psql exists
      const psqlExists = await pathExists(psqlPath);
      console.log('psql exists:', psqlExists);
      
      if (!psqlExists) {
        console.log('psql not found at path:', psqlPath);
        return res.json({ connected: false, error: `Nie znaleziono programu psql w lokalizacji: ${psqlPath}` });
      }

      console.log('Attempting connection with timeout...');
      // Try simple connection test with timeout
      const connectionTest = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('Connection attempt timed out');
          reject(new Error('TIMEOUT'));
        }, 5000); // 5 second timeout

        try {
          console.log('Executing psql command...');
          const result = execSync(`"${psqlPath}" -U ${user} -d ${database} -c "SELECT 1"`, { 
            stdio: 'pipe',
            timeout: 5000 // 5 second timeout for the command
          });
          console.log('psql command executed successfully:', result.toString());
          clearTimeout(timeout);
          resolve(true);
        } catch (err) {
          console.error('Error during psql execution:', err);
          clearTimeout(timeout);
          reject(err);
        }
      });

      await connectionTest;
      console.log('Connection test passed successfully');
      res.json({ connected: true });
    } catch (err) {
      const error = err as Error;
      console.error('Connection test failed:', error);
      res.json({ 
        connected: false, 
        error: error.message === 'TIMEOUT'
          ? 'Przekroczono czas oczekiwania na połączenie. Sprawdź czy serwer PostgreSQL jest uruchomiony.'
          : 'Nie można połączyć się z bazą danych. Sprawdź dane logowania i upewnij się, że serwer PostgreSQL jest uruchomiony.'
      });
    } finally {
      // Clear the password from environment
      delete process.env.PGPASSWORD;
      console.log('Cleared PGPASSWORD from environment');
    }
  } catch (err) {
    const error = err as Error;
    console.error('Unexpected error during connection verification:', error);
    res.json({ 
      connected: false, 
      error: `Wystąpił nieoczekiwany błąd: ${error.message}` 
    });
  }
  console.log('=== Connection verification completed ===');
});

// New endpoint to check PostgreSQL path
router.post('/check-postgres-path', async (req, res) => {
  try {
    const { postgresPath } = req.body;
    
    if (!postgresPath) {
      return res.status(400).json({ 
        message: 'Nie podano ścieżki do PostgreSQL',
        success: false
      });
    }

    const postgres = await findPostgresPath(postgresPath);
    
    if (!postgres) {
      return res.status(404).json({ 
        message: 'Nie znaleziono PostgreSQL w podanej ścieżce. Sprawdź czy:\n' +
        '1. Ścieżka jest poprawna\n' +
        '2. W katalogu bin znajduje się plik psql.exe',
        success: false
      });
    }

    res.json({
      message: `Znaleziono PostgreSQL ${postgres.version} w ścieżce ${postgres.path}`,
      success: true,
      version: postgres.version,
      path: postgres.path
    });
  } catch (error: any) {
    console.error('Error checking PostgreSQL path:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas sprawdzania ścieżki PostgreSQL',
      details: error.toString(),
      success: false
    });
  }
});

export default router; 