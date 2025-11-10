import { Router } from 'express';
import { body } from 'express-validator';
import {
  registerUser,
  loginUser,
  getTimers,
  createTimer,
  updateTimer,
  deleteTimer,
  searchTimers
} from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.post(
  '/signup',
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })],
  registerUser
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], loginUser);

router.get('/timers', authMiddleware, getTimers);
router.get('/timers/search', authMiddleware, searchTimers);
router.post('/timers', authMiddleware, createTimer);
router.put('/timers/:timerId', authMiddleware, updateTimer);
router.delete('/timers/:timerId', authMiddleware, deleteTimer);

export default router;
