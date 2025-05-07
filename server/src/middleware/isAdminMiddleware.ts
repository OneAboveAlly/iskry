import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export const isAdminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ message: 'Brak autoryzacji' });
    }

    if (!req.authUser.isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień administratora' });
    }

    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas weryfikacji uprawnień' });
  }
}; 