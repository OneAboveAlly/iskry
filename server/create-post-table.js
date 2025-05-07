// Skrypt do utworzenia tabeli Post, jeśli nie istnieje
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Załaduj zmienne środowiskowe
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Pobierz URL bazy danych z zmiennej środowiskowej
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

// Utwórz klienta bazy danych PostgreSQL
const client = new Client({
  connectionString: databaseUrl
});

// Funkcja do utworzenia tabeli Post
async function createPostTable() {
  try {
    // Połącz z bazą danych
    await client.connect();
    console.log('Connected to the PostgreSQL database');

    // Sprawdź czy tabela Post istnieje
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Post'
      );
    `);

    const tableExists = checkTableResult.rows[0].exists;

    if (tableExists) {
      console.log('Table "Post" already exists');
    } else {
      console.log('Table "Post" does not exist, creating...');

      // Utwórz tabelę Post
      await client.query(`
        CREATE TABLE "Post" (
          "id" SERIAL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "imageUrl" TEXT,
          "publishedAt" TIMESTAMP NOT NULL,
          "authorId" INTEGER NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_author FOREIGN KEY("authorId") REFERENCES "User"("id") ON DELETE CASCADE
        );
      `);

      console.log('Table "Post" created successfully');
    }

    // Sprawdź kolumny tabeli Post
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Post'
      ORDER BY ordinal_position;
    `);

    console.log('Post table columns:');
    columnsResult.rows.forEach(column => {
      console.log(`${column.column_name}: ${column.data_type}`);
    });

    // Sprawdź czy tabela User istnieje
    const checkUserTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `);

    const userTableExists = checkUserTableResult.rows[0].exists;

    if (userTableExists) {
      console.log('Table "User" exists');
      
      // Wyświetl użytkowników
      const usersResult = await client.query(`
        SELECT id, name, surname, email, "isAdmin" FROM "User" LIMIT 5;
      `);
      
      console.log('Users in the database:');
      console.log(usersResult.rows);
    } else {
      console.log('Table "User" does not exist. You need to create it first.');
    }

  } catch (error) {
    console.error('Error creating Post table:', error);
  } finally {
    // Zamknij połączenie
    await client.end();
    console.log('Disconnected from the PostgreSQL database');
  }
}

// Uruchom funkcję
createPostTable().catch(console.error); 