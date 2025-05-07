import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interfejs dla żądań autoryzowanych
export interface AuthRequest extends Request {
  authUser?: {
    id: number;
    email: string;
    isAdmin: boolean;
    role: string;
    approved: boolean;
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Brak tokenu autoryzacyjnego' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje' });
    }

    // Sprawdź czy konto jest zatwierdzone (chyba że to admin)
    if (!user.isAdmin && !user.approved) {
      return res.status(403).json({ message: 'Konto oczekuje na zatwierdzenie' });
    }

    // Dodaj informacje o użytkowniku do obiektu żądania
    req.authUser = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      approved: user.approved
    };

    next();
  } catch (error) {
    console.error('Błąd autoryzacji:', error);
    res.status(401).json({ message: 'Nieprawidłowy token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.authUser?.isAdmin) {
    return res.status(403).json({ message: 'Brak uprawnień administratora' });
  }
  next();
}; 