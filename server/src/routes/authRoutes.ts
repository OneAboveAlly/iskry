import { Router } from 'express';
import { register, login, verifyToken, forgotPassword, resetPassword } from '../controllers/authController';
import { auth } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', auth, verifyToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router; 