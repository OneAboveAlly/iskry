import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        approved: true,
        createdAt: true,
        isAdmin: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas pobierania użytkowników' });
  }
};

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { approved: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas zatwierdzania użytkownika' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Użytkownik został usunięty' });
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas usuwania użytkownika' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, surname, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        surname,
        email,
        password: hashedPassword,
        approved: true,
        isAdmin: false
      }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Błąd podczas tworzenia użytkownika' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, surname, email, isAdmin, approved, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        surname,
        email,
        isAdmin,
        approved,
        phone
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji użytkownika' });
  }
}; 