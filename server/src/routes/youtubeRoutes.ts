import express from 'express';
import { getAllVideos, getVideoById, addVideo, updateVideo, deleteVideo } from '../controllers/youtubeController';
import { auth } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getAllVideos);
router.get('/:id', getVideoById);

// Protected routes
router.post('/', auth, addVideo);
router.put('/:id', auth, updateVideo);
router.delete('/:id', auth, deleteVideo);

export default router; 