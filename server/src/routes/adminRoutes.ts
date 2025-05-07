import { Router } from 'express';
import { getUsers, approveUser, deleteUser, createUser, updateUser } from '../controllers/adminController';
import { auth, requireAdmin, AuthRequest } from '../middleware/authMiddleware';
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Wszystkie endpointy wymagają autoryzacji i uprawnień administratora

// Pobierz wszystkich użytkowników
router.get('/users', getUsers);

// Zatwierdź użytkownika
router.patch('/users/:id/approve', approveUser);

// Usuń użytkownika
router.delete('/users/:id', deleteUser);

// Stwórz nowego użytkownika
router.post('/users', createUser);

// Aktualizuj użytkownika
router.put('/users/:id', updateUser);

// GET /api/admin/comments - Get all comments (admin only)
router.get('/comments', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const comments = await prisma.$queryRaw`
      SELECT 
        c.id, 
        c.content, 
        c."createdAt", 
        c."updatedAt",
        c."authorId",
        c."postId",
        u.name as "authorName",
        u.surname as "authorSurname",
        p.title as "postTitle"
      FROM "Comment" c
      JOIN "User" u ON c."authorId" = u.id
      JOIN "Post" p ON c."postId" = p.id
      ORDER BY c."createdAt" DESC
    `;

    // Transform the result to match the expected interface
    const formattedComments = (comments as any[]).map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.authorId,
        name: comment.authorName,
        surname: comment.authorSurname
      },
      post: {
        id: comment.postId,
        title: comment.postTitle
      }
    }));

    res.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments for admin:', error);
    res.status(500).json({ message: 'Server error while fetching comments' });
  }
});

export default router; 