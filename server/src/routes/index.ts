import express from 'express';
import authRoutes from './authRoutes';
import setupRoutes from './setupRoutes';
import pageContentRoutes from './pageContentRoutes';
import postRoutes from './postRoutes';
import adminRoutes from './adminRoutes';
import announcementRoutes from './announcementRoutes';
import materialRoutes from './materialRoutes';
import notificationRoutes from './notificationRoutes';
import bookingRoutes from './bookingRoutes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/setup', setupRoutes);
router.use('/pages', pageContentRoutes);
router.use('/posts', postRoutes);
router.use('/admin', adminRoutes);
router.use('/announcements', announcementRoutes);
router.use('/materials', materialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/api', bookingRoutes);

export default router; 