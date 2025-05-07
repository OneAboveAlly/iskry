import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth, AuthRequest, requireAdmin } from '../middleware/authMiddleware';
import upload from '../middleware/multerConfig';

interface FileWithValidationRequest extends AuthRequest {
  file?: Express.Multer.File;
  fileValidationError?: string;
}

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/materials - Add a new material (admin only)
router.post('/', auth, requireAdmin, upload.single('file'), async (req: FileWithValidationRequest, res: Response) => {
  try {
    // Check if file validation error occurred
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const { title, studentId } = req.body;

    // Validate required fields
    if (!title || !studentId) {
      return res.status(400).json({ message: 'Title and student ID are required' });
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: parseInt(studentId) }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create material in database
    const fileUrl = `/uploads/${req.file.filename}`;
    const material = await prisma.material.create({
      data: {
        title,
        fileUrl,
        studentId: parseInt(studentId),
      }
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ message: 'Server error while creating material' });
  }
});

// GET /api/materials - Get materials for the current user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.authUser?.id;
    
    // Admin can see all materials with student details
    if (req.authUser?.isAdmin) {
      const materials = await prisma.material.findMany({
        include: {
          student: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.json(materials);
    }
    
    // Regular user can only see their own materials
    const materials = await prisma.material.findMany({
      where: {
        studentId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Server error while fetching materials' });
  }
});

// DELETE /api/materials/:id - Delete a material (admin only)
router.delete('/:id', auth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find the material first to check if it exists
    const material = await prisma.material.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    
    // Delete the material
    await prisma.material.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: 'Server error while deleting material' });
  }
});

// POST /api/materials/send-to-all - Send a material to all approved students (admin only)
router.post('/send-to-all', auth, requireAdmin, upload.single('file'), async (req: FileWithValidationRequest, res: Response) => {
  try {
    // Check if file validation error occurred
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const { title } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Get all approved students
    const approvedStudents = await prisma.user.findMany({
      where: { 
        approved: true,
        role: 'STUDENT'
      },
      select: {
        id: true
      }
    });

    if (approvedStudents.length === 0) {
      return res.status(404).json({ message: 'No approved students found' });
    }

    // Create the file record
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Define student interface for type safety
    interface ApprovedStudent {
      id: number;
    }
    
    // Create a material for each student
    const createdMaterials = await Promise.all(
      approvedStudents.map((student: ApprovedStudent) => 
        prisma.material.create({
          data: {
            title,
            fileUrl,
            studentId: student.id,
          }
        })
      )
    );

    res.status(201).json({ 
      message: `Material sent to ${createdMaterials.length} students`,
      count: createdMaterials.length
    });
  } catch (error) {
    console.error('Error sending material to all students:', error);
    res.status(500).json({ message: 'Server error while sending material to all students' });
  }
});

export default router; 