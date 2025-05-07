import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// Aktualizacja profilu zalogowanego użytkownika
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.authUser?.id;
    if (!userId) return res.status(401).json({ message: 'Brak autoryzacji' });

    const { name, surname, email, phone, newPassword, currentPassword } = req.body;

    // Pobierz użytkownika
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'Nie znaleziono użytkownika' });

    // Jeśli zmiana hasła, sprawdź aktualne hasło
    let passwordData = {};
    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Nieprawidłowe aktualne hasło' });
      passwordData = { password: await bcrypt.hash(newPassword, 10) };
    }

    // Aktualizuj dane
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        surname,
        email,
        phone,
        ...passwordData
      }
    });

    res.json({ message: 'Profil zaktualizowany', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera podczas aktualizacji profilu' });
  }
});

export default router; 