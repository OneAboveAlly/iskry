import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth, requireAdmin } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();
const prisma = new PrismaClient();

// Konfiguracja przechowywania zdjęć
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pages');
    // Upewnij się, że katalog istnieje
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unikalna nazwa pliku
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Akceptuj tylko obrazki
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Tylko pliki obrazów są dozwolone (jpg, jpeg, png, gif)"));
  }
});

// Middleware to check if the page is protected
const checkProtectedPage = (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  if (slug === 'aktualnosci') {
    return res.status(403).json({ 
      message: 'Strona Aktualności jest statyczna i nie może być modyfikowana',
      protected: true
    });
  }
  next();
};

// Pobierz wszystkie strony (publiczne i admin)
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/pages - Fetching all pages');
    
    // Sprawdź, czy w ogóle istnieją jakieś strony w bazie
    const count = await prisma.pageContent.count();
    console.log(`Total pages in database: ${count}`);
    
    const pages = await prisma.pageContent.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`Returning ${pages.length} pages`);
    if (pages.length === 0 && count === 0) {
      console.log('No pages found in database. Creating default pages...');
      
      // Utwórz domyślne strony jeśli baza jest pusta
      const defaultPages = [
        {
          slug: 'o-mnie',
          title: 'O mnie',
          content: '<h1>O mnie</h1><p>Strona o mnie</p>',
          imageUrl: null
        },
        {
          slug: 'istnienie',
          title: 'Istnienie',
          content: '<h1>Istnienie</h1><p>Strona o istnieniu</p>',
          imageUrl: null
        },
        {
          slug: 'rytual-przykladania',
          title: 'Rytuał przykładania',
          content: '<h1>Rytuał przykładania</h1><p>Informacje o rytuale</p>',
          imageUrl: null
        },
        {
          slug: 'droga-rozwoju',
          title: 'Droga rozwoju',
          content: '<h1>Droga rozwoju</h1><p>Informacje o drodze rozwoju</p>',
          imageUrl: null
        },
        {
          slug: 'cennik',
          title: 'Cennik',
          content: '<h1>Cennik</h1><p>Informacje o cenach</p>',
          imageUrl: null
        }
      ];
      
      for (const page of defaultPages) {
        await prisma.pageContent.create({
          data: page
        });
      }
      
      // Pobierz nowo utworzone strony
      const newPages = await prisma.pageContent.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          imageUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      console.log(`Created ${newPages.length} default pages`);
      return res.json(newPages);
    }
    
    res.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania stron' });
  }
});

// Pobierz pojedynczą stronę po slug (publiczne)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`GET /api/pages/${slug} - Fetching page content`);
    
    // Upewnij się, że "upload" nie jest traktowane jak slug (to ścieżka dla obrazków)
    if (slug === 'upload') {
      return res.status(404).json({ message: 'Nieprawidłowy slug' });
    }
    
    // Próba pobrania strony przy użyciu standardowego API Prisma
    const page = await prisma.pageContent.findUnique({
      where: { slug }
    });
    
    if (!page) {
      console.log(`Page with slug "${slug}" not found`);
      return res.status(404).json({ 
        message: 'Strona nie została znaleziona',
        notFound: true,
        requestedSlug: slug
      });
    }
    
    console.log(`Found page by slug "${slug}" using Prisma API`);
    res.json(page);
  } catch (error) {
    console.error('Server error fetching page:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania strony' });
  }
});

// Utwórz nową stronę (tylko admin)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { title, slug, content, imageUrl, backgroundImageUrl } = req.body;
    
    // Sprawdź, czy slug jest już zajęty
    const existingPage = await prisma.pageContent.findUnique({
      where: { slug }
    });
    
    if (existingPage) {
      return res.status(400).json({ message: 'Strona o podanym identyfikatorze URL już istnieje' });
    }
    
    const newPage = await prisma.pageContent.create({
      data: {
        title,
        slug,
        content,
        imageUrl,
        backgroundImageUrl
      }
    });
    
    res.status(201).json(newPage);
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ message: 'Błąd podczas tworzenia strony' });
  }
});

// Aktualizuj stronę (tylko admin)
router.put('/:slug', auth, requireAdmin, checkProtectedPage, async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content, imageUrl, backgroundImageUrl } = req.body;
    
    // Sprawdź, czy strona istnieje
    const existingPage = await prisma.pageContent.findUnique({
      where: { slug }
    });
    
    if (!existingPage) {
      return res.status(404).json({ message: 'Strona nie została znaleziona' });
    }
    
    const updatedPage = await prisma.pageContent.update({
      where: { slug },
      data: {
        title,
        content,
        imageUrl,
        backgroundImageUrl
      }
    });
    
    res.json(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji strony' });
  }
});

// Usuń stronę (tylko admin)
router.delete('/:slug', auth, requireAdmin, checkProtectedPage, async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Sprawdź, czy strona istnieje
    const existingPage = await prisma.pageContent.findUnique({
      where: { slug }
    });
    
    if (!existingPage) {
      return res.status(404).json({ message: 'Strona nie została znaleziona' });
    }
    
    // Usuń również plik obrazka jeśli istnieje
    if (existingPage.imageUrl) {
      const imagePath = path.join(__dirname, '../../', existingPage.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await prisma.pageContent.delete({
      where: { slug }
    });
    
    res.json({ message: 'Strona została usunięta' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania strony' });
  }
});

// Upload obrazka (tylko admin)
router.post('/upload', auth, requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Brak pliku' });
    }
    
    // Zwróć URL do pliku, który będzie zapisany w bazie
    const imageUrl = `/uploads/pages/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Błąd podczas przesyłania pliku' });
  }
});

// Modify the POST route to create default pages if none exist
router.post('/create-defaults', auth, requireAdmin, async (req, res) => {
  try {
    console.log('POST /api/pages/create-defaults - Creating default pages');
    
    // Check if any pages already exist
    const count = await prisma.pageContent.count();
    if (count > 0) {
      return res.status(400).json({ 
        message: 'Domyślne strony nie zostały utworzone, ponieważ istnieją już strony w bazie danych', 
        existingCount: count 
      });
    }
    
    // Create default pages
    const defaultPages = [
      {
        slug: 'o-mnie',
        title: 'O mnie',
        content: '<h1>O mnie</h1><p>Strona o mnie</p>',
        imageUrl: null
      },
      {
        slug: 'istnienie',
        title: 'Istnienie',
        content: '<h1>Istnienie</h1><p>Strona o istnieniu</p>',
        imageUrl: null
      },
      {
        slug: 'rytual-przykladania',
        title: 'Rytuał przykładania',
        content: '<h1>Rytuał przykładania</h1><p>Informacje o rytuale</p>',
        imageUrl: null
      },
      {
        slug: 'droga-rozwoju',
        title: 'Droga rozwoju',
        content: '<h1>Droga rozwoju</h1><p>Informacje o drodze rozwoju</p>',
        imageUrl: null
      },
      {
        slug: 'cennik',
        title: 'Cennik',
        content: '<h1>Cennik</h1><p>Informacje o cenach</p>',
        imageUrl: null
      }
    ];
    
    // Create pages in database
    for (const page of defaultPages) {
      await prisma.pageContent.create({
        data: page
      });
    }
    
    // Return the newly created pages
    const newPages = await prisma.pageContent.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`Created ${newPages.length} default pages`);
    return res.json(newPages);
  } catch (error) {
    console.error('Error creating default pages:', error);
    res.status(500).json({ message: 'Błąd podczas tworzenia domyślnych stron' });
  }
});

// Przesyłanie obrazka tła
router.post('/upload-background', auth, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nie przesłano pliku obrazu tła' });
    }
    
    // Utworzenie unikalnej nazwy pliku
    const timestamp = Date.now();
    const newFilename = `bg_${timestamp}_${req.file.originalname}`;
    
    // Ścieżka do zapisania pliku
    const oldPath = req.file.path;
    const newPath = path.join(__dirname, '../../uploads', newFilename);
    
    // Przeniesienie pliku
    fs.renameSync(oldPath, newPath);
    
    // Zwracamy URL do pliku
    const imageUrl = `/uploads/${newFilename}`;
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading background image:', error);
    res.status(500).json({ message: 'Błąd podczas przesyłania obrazu tła' });
  }
});

export default router; 