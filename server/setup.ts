import inquirer from 'inquirer';
import { PrismaClient, Role } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import chalk from 'chalk';

const questions = [
  {
    type: 'input',
    name: 'dbName',
    message: 'Podaj nazwę bazy danych:',
    default: 'duchowosc_szkola'
  },
  {
    type: 'input',
    name: 'dbUser',
    message: 'Podaj nazwę użytkownika bazy danych:',
    default: 'postgres'
  },
  {
    type: 'password',
    name: 'dbPassword',
    message: 'Podaj hasło do bazy danych:',
    mask: '*'
  },
  {
    type: 'input',
    name: 'adminEmail',
    message: 'Podaj email administratora:',
    validate: (input: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(input)) {
        return true;
      }
      return 'Proszę podać prawidłowy adres email';
    }
  },
  {
    type: 'password',
    name: 'adminPassword',
    message: 'Podaj hasło administratora (min. 8 znaków):',
    mask: '*',
    validate: (input: string) => {
      if (input.length >= 8) {
        return true;
      }
      return 'Hasło musi mieć co najmniej 8 znaków';
    }
  },
  {
    type: 'input',
    name: 'adminName',
    message: 'Podaj imię administratora:',
    validate: (input: string) => input.length > 0
  },
  {
    type: 'input',
    name: 'adminSurname',
    message: 'Podaj nazwisko administratora:',
    validate: (input: string) => input.length > 0
  },
  {
    type: 'confirm',
    name: 'configureEmail',
    message: 'Czy chcesz skonfigurować wysyłanie emaili (wymagane do funkcji resetowania hasła)?',
    default: true
  },
  {
    type: 'input',
    name: 'emailHost',
    message: 'Podaj adres serwera SMTP:',
    default: 'smtp.gmail.com',
    when: (answers: any) => answers.configureEmail
  },
  {
    type: 'input',
    name: 'emailPort',
    message: 'Podaj port serwera SMTP:',
    default: '587',
    when: (answers: any) => answers.configureEmail,
    validate: (input: string) => {
      const port = parseInt(input);
      if (isNaN(port) || port < 1 || port > 65535) {
        return 'Proszę podać prawidłowy numer portu (1-65535)';
      }
      return true;
    }
  },
  {
    type: 'confirm',
    name: 'emailSecure',
    message: 'Czy używać połączenia SSL/TLS?',
    default: false,
    when: (answers: any) => answers.configureEmail
  },
  {
    type: 'input',
    name: 'emailUser',
    message: 'Podaj nazwę użytkownika (adres email do wysyłki):',
    default: (answers: any) => answers.adminEmail,
    when: (answers: any) => answers.configureEmail,
    validate: (input: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(input)) {
        return true;
      }
      return 'Proszę podać prawidłowy adres email';
    }
  },
  {
    type: 'password',
    name: 'emailPassword',
    message: 'Podaj hasło do konta email (dla Gmaila użyj hasła aplikacji):',
    mask: '*',
    when: (answers: any) => answers.configureEmail
  },
  {
    type: 'input',
    name: 'emailFrom',
    message: 'Podaj adres nadawcy emaili:',
    default: (answers: any) => answers.emailUser || answers.adminEmail,
    when: (answers: any) => answers.configureEmail,
    validate: (input: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(input)) {
        return true;
      }
      return 'Proszę podać prawidłowy adres email';
    }
  },
  {
    type: 'input',
    name: 'frontendUrl',
    message: 'Podaj URL strony frontendowej:',
    default: 'http://localhost:5173',
    when: (answers: any) => answers.configureEmail
  }
];

async function createEnvFile(answers: any) {
  let envContent = `DATABASE_URL="postgresql://${answers.dbUser}:${answers.dbPassword}@localhost:5432/${answers.dbName}"
JWT_SECRET="${Math.random().toString(36).slice(-20)}"
PORT=3001
NODE_ENV=${answers.configureEmail ? 'production' : 'development'}`;

  // Dodaj konfigurację email, jeśli została wybrana
  if (answers.configureEmail) {
    envContent += `\n
# Konfiguracja email do resetowania hasła
EMAIL_HOST=${answers.emailHost}
EMAIL_PORT=${answers.emailPort}
EMAIL_SECURE=${answers.emailSecure}
EMAIL_USER=${answers.emailUser}
EMAIL_PASS=${answers.emailPassword}
EMAIL_FROM=${answers.emailFrom}
FRONTEND_URL=${answers.frontendUrl}`;
  }

  await fs.writeFile(path.join(__dirname, '.env'), envContent);
}

async function createDatabase(answers: any) {
  const createDbSQL = `
    DROP DATABASE IF EXISTS ${answers.dbName};
    CREATE DATABASE ${answers.dbName}
    WITH
    OWNER = ${answers.dbUser}
    ENCODING = 'UTF8'
    LC_COLLATE = 'Polish_Poland.1250'
    LC_CTYPE = 'Polish_Poland.1250'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;`;

  await fs.writeFile(path.join(__dirname, 'create-db.sql'), createDbSQL);
  console.log(chalk.yellow('Tworzenie bazy danych...'));
  
  try {
    execSync(`psql -U ${answers.dbUser} -f create-db.sql`);
    console.log(chalk.green('✓ Baza danych została utworzona'));
  } catch (error) {
    console.error(chalk.red('Błąd podczas tworzenia bazy danych:'), error);
    throw error;
  }
}

async function setupPrisma() {
  console.log(chalk.yellow('Konfiguracja Prisma...'));
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log(chalk.green('✓ Prisma została skonfigurowana'));
  } catch (error) {
    console.error(chalk.red('Błąd podczas konfiguracji Prisma:'), error);
    throw error;
  }
}

async function createAdminUser(answers: any) {
  console.log(chalk.yellow('Tworzenie konta administratora...'));
  const prisma = new PrismaClient();

  try {
    const hashedPassword = await bcrypt.hash(answers.adminPassword, 10);
    await prisma.user.create({
      data: {
        email: answers.adminEmail,
        password: hashedPassword,
        name: answers.adminName,
        surname: answers.adminSurname,
        approved: true,
        role: Role.ADMIN
      }
    });
    console.log(chalk.green('✓ Konto administratora zostało utworzone'));
  } catch (error) {
    console.error(chalk.red('Błąd podczas tworzenia konta administratora:'), error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Dodajemy funkcję do utworzenia tabeli resetowania hasła
async function setupPasswordReset() {
  console.log(chalk.yellow('Konfiguracja funkcji resetowania hasła...'));
  
  // Sprawdź, czy prisma.schema już zawiera model PasswordReset
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  let schemaContent = await fs.readFile(schemaPath, 'utf8');
  
  // Jeśli model już istnieje, nie rób nic
  if (schemaContent.includes('model PasswordReset')) {
    console.log(chalk.blue('Model PasswordReset już istnieje w schemacie.'));
    return;
  }
  
  // Dodaj model PasswordReset do schematu
  console.log(chalk.yellow('Dodawanie modelu PasswordReset do schematu...'));
  
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
  let userModelUpdated = false;
  if (!schemaContent.includes('passwordResets PasswordReset[]')) {
    schemaContent = schemaContent.replace(
      /model User {([\s\S]*?)}/,
      (match, userContent) => {
        userModelUpdated = true;
        return `model User {${userContent}  passwordResets PasswordReset[] // relation to password reset tokens\n}`;
      }
    );
  }
  
  // Dodaj model PasswordReset na końcu pliku
  if (!schemaContent.includes('model PasswordReset')) {
    schemaContent += passwordResetModel;
  }
  
  // Zapisz zaktualizowany schemat tylko jeśli były zmiany
  if (userModelUpdated || !schemaContent.includes('model PasswordReset')) {
    await fs.writeFile(schemaPath, schemaContent);
    console.log(chalk.green('✓ Schemat Prisma został zaktualizowany'));
  }
  
  // Wykonaj migrację i wygeneruj klienta
  try {
    console.log(chalk.yellow('Wykonywanie migracji bazy danych...'));
    execSync('npx prisma migrate dev --name add_password_reset', { stdio: 'inherit' });
    console.log(chalk.green('✓ Migracja została wykonana pomyślnie'));
  } catch (error) {
    console.error(chalk.red('Ostrzeżenie: Błąd podczas wykonywania migracji:'), error);
    console.log(chalk.yellow('Próba alternatywnej metody: prisma db push...'));
    
    try {
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log(chalk.green('✓ Struktura bazy została zaktualizowana za pomocą db push'));
    } catch (pushError) {
      console.error(chalk.red('Błąd podczas aktualizacji bazy danych:'), pushError);
      console.log(chalk.yellow('Funkcja resetowania hasła może nie działać poprawnie.'));
      console.log(chalk.yellow('Wykonaj ręcznie: npx prisma migrate dev --name add_password_reset'));
    }
  }
}

async function main() {
  console.log(chalk.blue.bold('Witaj w kreatorze instalacji Szkoły Duchowej!\n'));
  
  try {
    const answers = await inquirer.prompt(questions);
    
    console.log(chalk.yellow('\nRozpoczynam proces instalacji...\n'));
    
    await createEnvFile(answers);
    console.log(chalk.green('✓ Plik .env został utworzony'));
    
    await createDatabase(answers);
    await setupPrisma();
    await createAdminUser(answers);
    
    // Jeśli skonfigurowano email, ustaw również funkcję resetowania hasła
    if (answers.configureEmail) {
      await setupPasswordReset();
    }
    
    console.log(chalk.green.bold('\nInstalacja zakończona pomyślnie! 🎉'));
    console.log(chalk.blue('\nMożesz teraz uruchomić aplikację:'));
    console.log(chalk.white('1. npm install'));
    console.log(chalk.white('2. npm run dev'));
    
    if (answers.configureEmail) {
      console.log(chalk.green('\nKonfiguracja poczty została pomyślnie dodana.'));
      console.log(chalk.blue('Funkcja resetowania hasła jest aktywna.'));
    } else {
      console.log(chalk.yellow('\nUwaga: Konfiguracja poczty nie została dodana.'));
      console.log(chalk.yellow('Funkcja resetowania hasła będzie działać tylko w trybie rozwojowym (link w konsoli).'));
      console.log(chalk.blue('Aby skonfigurować wysyłanie emaili później, edytuj plik .env ręcznie.'));
    }
    
  } catch (error) {
    console.error(chalk.red.bold('\nWystąpił błąd podczas instalacji:'), error);
    process.exit(1);
  }
}

main(); 