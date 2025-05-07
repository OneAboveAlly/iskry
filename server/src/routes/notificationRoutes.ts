import express, { Request, Response } from 'express';
import { PrismaClient, Notification } from '@prisma/client';
import { auth, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notifications - Get all notifications for the authenticated user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.authUser?.id;
    console.log(`Fetching notifications for user ${userId}`);
    
    if (!userId) {
      console.error('No user ID found in request');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            email: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            imageUrl: true,
            publishedAt: true,
            author: {
              select: {
                id: true,
                name: true,
                surname: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${notifications.length} notifications for user ${userId}`);
    console.log('Notifications:', notifications.map(n => ({
      id: n.id,
      content: n.content,
      isRead: n.isRead,
      archived: (n as any).archived,
      postId: n.postId,
      createdAt: n.createdAt
    })));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.authUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const count = await prisma.notification.count({
      where: { 
        userId,
        isRead: false,
        archived: false as any
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'Server error while counting notifications' });
  }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.authUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Update all unread notifications for this user
    await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
});

// PUT /api/notifications/archive-multiple - Archive multiple notifications
router.put('/archive-multiple', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.authUser?.id;
    const { ids } = req.body; // Array of notification IDs to archive
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid request. Please provide an array of notification IDs.' });
    }

    // Verify these notifications belongs to the user
    const notifications = await prisma.notification.findMany({
      where: { 
        id: { 
          in: ids.map(id => parseInt(id.toString())) 
        }
      }
    });

    // Check if any notification doesn't belong to this user
    const invalidNotifications = notifications.filter(n => n.userId !== userId);
    if (invalidNotifications.length > 0) {
      return res.status(403).json({ 
        message: 'Forbidden - some notifications do not belong to you',
        invalidIds: invalidNotifications.map(n => n.id)
      });
    }

    // Update the notifications using raw SQL query to bypass TypeScript errors
    for (const id of ids) {
      await prisma.$executeRaw`UPDATE "Notification" SET "archived" = true WHERE "id" = ${parseInt(id.toString())}`;
    }

    res.json({ 
      message: `Successfully archived ${ids.length} notifications`, 
      count: ids.length 
    });
  } catch (error) {
    console.error('Error archiving multiple notifications:', error);
    res.status(500).json({ message: 'Server error while archiving notifications' });
  }
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify this notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden - this notification does not belong to you' });
    }

    // Update the notification
    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error while updating notification' });
  }
});

// PUT /api/notifications/:id/archive - Archive a notification
router.put('/:id/archive', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify this notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden - this notification does not belong to you' });
    }

    // Update the notification using raw SQL query to bypass TypeScript errors
    await prisma.$executeRaw`UPDATE "Notification" SET "archived" = true WHERE "id" = ${parseInt(id)}`;

    // Get the updated notification
    const updatedNotification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({ message: 'Server error while archiving notification' });
  }
});

// PUT /api/notifications/:id/unarchive - Unarchive a notification
router.put('/:id/unarchive', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify this notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden - this notification does not belong to you' });
    }

    // Update the notification using raw SQL query to bypass TypeScript errors
    await prisma.$executeRaw`UPDATE "Notification" SET "archived" = false WHERE "id" = ${parseInt(id)}`;

    // Get the updated notification
    const updatedNotification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error unarchiving notification:', error);
    res.status(500).json({ message: 'Server error while unarchiving notification' });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.authUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify this notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden - this notification does not belong to you' });
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error while deleting notification' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read (for backward compatibility)
router.put('/read-all', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.authUser?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Update all unread notifications for this user
    await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
});

export default router; 