import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, auth, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get public announcements (dostępne bez logowania)
router.get('/public', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        isPublic: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            name: true,
            surname: true
          }
        }
      }
    });

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania ogłoszeń publicznych' });
  }
});

// Get all announcements (wymagane logowanie)
router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            name: true,
            surname: true
          }
        }
      }
    });

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania ogłoszeń' });
  }
});

// Create new announcement (admin only)
router.post('/', auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, content, link, isPublic } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Tytuł i treść są wymagane' });
    }

    if (!req.authUser) {
      return res.status(401).json({ message: 'Brak autoryzacji' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        link,
        isPublic: isPublic === true, // Domyślnie false jeśli nie podano
        authorId: req.authUser.id
      },
      include: {
        author: {
          select: {
            name: true,
            surname: true
          }
        }
      }
    });

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas tworzenia ogłoszenia' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id: Number(id) }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Ogłoszenie nie zostało znalezione' });
    }

    await prisma.announcement.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Ogłoszenie zostało usunięte' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas usuwania ogłoszenia' });
  }
});

// Update announcement (admin only)
router.put('/:id', auth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, link, isPublic } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Tytuł i treść są wymagane' });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: Number(id) }
    });

    if (!announcement) {
      return res.status(404).json({ message: 'Ogłoszenie nie zostało znalezione' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: Number(id) },
      data: {
        title,
        content,
        link,
        isPublic: isPublic === true // Zachowaj obecną wartość jeśli nie podano
      },
      include: {
        author: {
          select: {
            name: true,
            surname: true
          }
        }
      }
    });

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas aktualizacji ogłoszenia' });
  }
});

export default router; 