import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes';
import setupRoutes from './routes/setupRoutes';
import adminRoutes from './routes/adminRoutes';
import announcementRoutes from './routes/announcementRoutes';
import materialRoutes from './routes/materialRoutes';
import pageContentRoutes from './routes/pageContentRoutes';
import postRoutes from './routes/postRoutes';
import notificationRoutes from './routes/notificationRoutes';
import settingsRoutes from './routes/settingsRoutes';
import youtubeRoutes from './routes/youtubeRoutes';
import { auth, AuthRequest } from './middleware/authMiddleware';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';
import { createDefaultPagesIfNeeded } from './add-default-pages';
import bookingRoutes from './routes/bookingRoutes';
import userRoutes from './routes/userRoutes';
import { loadSSLConfig } from './ssl-config';

dotenv.config();

// Inicjalizacja Prisma z dodatkowymi ustawieniami logowania
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Logowanie zapytań Prisma dla debugowania
prisma.$on('query', (e) => {
  console.log('Prisma Query:', e);
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
});

// Sprawdzenie połączenia z bazą danych
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Sprawdź tabelę Post
    const postCount = await prisma.post.count();
    console.log(`Found ${postCount} posts in the database`);
    
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Tworzenie serwera HTTP lub HTTPS
const app = express();

// Ładowanie konfiguracji SSL
const sslConfig = loadSSLConfig();
let server;

if (sslConfig.enabled && sslConfig.cert && sslConfig.key) {
  console.log('Starting server with SSL/HTTPS enabled');
  server = https.createServer({
    key: sslConfig.key,
    cert: sslConfig.cert
  }, app);
} else {
  console.log('Starting server with HTTP (SSL disabled or not configured)');
  server = http.createServer(app);
}

// Inicjalizacja Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || `https://${process.env.DOMAIN}`, `http://${process.env.DOMAIN}`]
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 20000
});

// Przechowywanie aktywnych połączeń użytkowników
const userSocketMap = new Map<number, string>();

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Authenticate and associate user with socket
  socket.on('authenticate', (userId: number) => {
    console.log(`User ${userId} authenticated with socket ${socket.id}`);
    userSocketMap.set(userId, socket.id);
    
    // Send any pending notifications for this user
    socket.emit('authenticated', { success: true });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove user socket mapping
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        console.log(`Removed socket mapping for user ${userId}`);
        break;
      }
    }
  });
});

// Export Socket.IO instance to be used in other files
export { io, userSocketMap };

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || `https://${process.env.DOMAIN}`, `http://${process.env.DOMAIN}`]
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  
  // Don't log body for large content requests like file uploads
  if (!req.url.includes('upload') && !req.url.includes('image')) {
    console.log('Headers:', req.headers);
    
    if (req.method !== 'GET') {
      console.log('Body:', req.body);
    }
  } else {
    console.log('Headers:', {
      ...req.headers,
      'content-length': req.headers['content-length']
    });
    console.log('Body: [File upload content not logged]');
  }
  
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', setupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/pages', pageContentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api', bookingRoutes);
app.use('/api/users', userRoutes);

// Protected route example
app.get('/api/protected', auth, async (req: AuthRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ message: 'Brak autoryzacji' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.authUser.id },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        isAdmin: true,
        approved: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie został znaleziony' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in protected route:', error);
    res.status(500).json({ message: 'Wystąpił błąd serwera' });
  }
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Spiritual School API' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/api/db-check', async (req, res) => {
  try {
    const isConnected = await testDatabaseConnection();
    if (isConnected) {
      res.json({ status: 'ok', message: 'Database connection successful' });
    } else {
      res.status(500).json({ status: 'error', message: 'Database connection failed' }); 
    }
  } catch (error) {
    console.error('Database check error:', error);
    res.status(500).json({ status: 'error', message: 'Error checking database' });
  }
});

// Database diagnosis endpoint
app.get('/api/db-diagnosis', async (req, res) => {
  try {
    // Sprawdź połączenie
    await prisma.$connect();
    
    // Sprawdź tabele
    const tablesQuery = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    // Sprawdź strukturę tabeli Post, jeśli istnieje
    let postColumnsQuery = null;
    try {
      postColumnsQuery = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Post'
        ORDER BY ordinal_position;
      `;
    } catch (e) {
      console.error('Error querying Post table structure:', e);
    }
    
    // Próba bezpośredniego zapytania o posty
    let posts = [];
    try {
      const postsResult = await prisma.$queryRaw`SELECT * FROM "Post" LIMIT 5`;
      posts = Array.isArray(postsResult) ? postsResult : [];
    } catch (e) {
      console.error('Error directly querying Post table:', e);
    }
    
    res.json({
      connection: 'successful',
      tables: tablesQuery,
      postColumns: postColumnsQuery,
      postSample: posts.length > 0 ? posts : 'No posts found or error querying posts'
    });
  } catch (error) {
    console.error('Database diagnosis error:', error);
    res.status(500).json({ 
      error: 'Database diagnosis error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Route not found middleware
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  
  // Return friendly error message to client
  res.status(err.status || 500).json({ 
    error: err.status ? err.message : 'Internal Server Error', 
    message: err.status ? err.message : 'Wystąpił nieoczekiwany błąd serwera'
  });
});

// Jeśli jest włączona obsługa HTTPS, przekieruj HTTP na HTTPS
if (sslConfig.enabled && process.env.NODE_ENV === 'production') {
  // Utworzenie prostego serwera HTTP do przekierowania
  const httpServer = http.createServer((req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
  });
  
  httpServer.listen(80, () => {
    console.log('HTTP redirection server started on port 80');
  });
}

// Start the server after database check
const startServer = async () => {
  try {
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('Unable to connect to the database. Server will not start.');
      process.exit(1);
    }

    // Create default pages if needed
    try {
      await createDefaultPagesIfNeeded();
    } catch (error) {
      console.error('Error creating default pages:', error);
    }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      if (sslConfig.enabled) {
        console.log(`HTTPS enabled: https://${process.env.DOMAIN || 'localhost'}:${PORT}`);
      } else {
        console.log(`HTTP mode: http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server
startServer(); 