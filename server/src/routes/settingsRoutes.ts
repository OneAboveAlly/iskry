import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get all settings
router.get('/', async (req, res) => {
  try {
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    const settings = await prisma.settings.findMany({
      orderBy: {
        displayOrder: 'asc'
      }
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania ustawień' });
  }
});

// Get a single setting by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    const setting = await prisma.settings.findUnique({
      where: { id: Number(id) }
    });
    
    if (!setting) {
      return res.status(404).json({ message: 'Ustawienie nie zostało znalezione' });
    }
    
    res.json(setting);
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania ustawienia' });
  }
});

// Create a new setting (admin only)
router.post('/', auth, async (req: AuthRequest, res) => {
  try {
    if (!req.authUser?.isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień do tej operacji' });
    }
    
    const { key, value, type, label, icon, displayOrder } = req.body;
    console.log('Received new setting:', { key, value, type, label, icon, displayOrder });
    
    // Check if setting with the same key already exists
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    const existingSetting = await prisma.settings.findUnique({
      where: { key }
    });
    
    if (existingSetting) {
      console.log('Setting with this key already exists:', existingSetting);
      return res.status(400).json({ message: 'Ustawienie o podanym kluczu już istnieje' });
    }
    
    // Konwertuj displayOrder na liczbę
    const displayOrderInt = displayOrder ? parseInt(displayOrder.toString(), 10) : 0;
    
    console.log('Creating new setting with data:', {
      key,
      value,
      type,
      label,
      icon: icon || null,
      displayOrder: displayOrderInt
    });
    
    try {
      // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
      const newSetting = await prisma.settings.create({
        data: {
          key,
          value,
          type,
          label,
          icon: icon || null,
          displayOrder: displayOrderInt
        }
      });
      
      console.log('Successfully created setting:', newSetting);
      res.status(201).json(newSetting);
    } catch (prismaError) {
      console.error('Prisma error creating setting:', prismaError);
      res.status(500).json({ 
        message: 'Wystąpił błąd podczas tworzenia ustawienia',
        error: prismaError instanceof Error ? prismaError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas tworzenia ustawienia', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a setting (admin only)
router.put('/:id', auth, async (req: AuthRequest, res) => {
  try {
    if (!req.authUser?.isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień do tej operacji' });
    }
    
    const { id } = req.params;
    const { key, value, type, label, icon, displayOrder } = req.body;
    
    const settingId = Number(id);
    
    // Check if setting exists
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    const existingSetting = await prisma.settings.findUnique({
      where: { id: settingId }
    });
    
    if (!existingSetting) {
      return res.status(404).json({ message: 'Ustawienie nie zostało znalezione' });
    }
    
    // Check if key is being changed and if new key already exists
    if (key !== existingSetting.key) {
      // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
      const keyExists = await prisma.settings.findUnique({
        where: { key }
      });
      
      if (keyExists && keyExists.id !== settingId) {
        return res.status(400).json({ message: 'Ustawienie o podanym kluczu już istnieje' });
      }
    }
    
    // Konwertuj displayOrder na liczbę
    const displayOrderInt = displayOrder ? parseInt(displayOrder.toString(), 10) : 0;
    
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    const updatedSetting = await prisma.settings.update({
      where: { id: settingId },
      data: {
        key,
        value,
        type,
        label,
        icon: icon || null,
        displayOrder: displayOrderInt
      }
    });
    
    res.json(updatedSetting);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ 
      message: 'Wystąpił błąd podczas aktualizacji ustawienia',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a setting (admin only)
router.delete('/:id', auth, async (req: AuthRequest, res) => {
  try {
    if (!req.authUser?.isAdmin) {
      return res.status(403).json({ message: 'Brak uprawnień do tej operacji' });
    }
    
    const { id } = req.params;
    
    // Check if setting exists
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    const existingSetting = await prisma.settings.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingSetting) {
      return res.status(404).json({ message: 'Ustawienie nie zostało znalezione' });
    }
    
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    await prisma.settings.delete({
      where: { id: Number(id) }
    });
    
    res.json({ message: 'Ustawienie zostało usunięte' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ message: 'Wystąpił błąd podczas usuwania ustawienia' });
  }
});

// Get settings by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    // @ts-ignore: Prisma jest zregenerowane, ale TypeScript jeszcze tego nie widzi
    const settings = await prisma.settings.findMany({
      where: { type },
      orderBy: {
        displayOrder: 'asc'
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error(`Error fetching ${req.params.type} settings:`, error);
    res.status(500).json({ message: 'Wystąpił błąd podczas pobierania ustawień' });
  }
});

export default router; 