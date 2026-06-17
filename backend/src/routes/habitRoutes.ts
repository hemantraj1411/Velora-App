import { Router } from 'express';
import {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  trackHabit,
  getHabitStats,
} from '../controllers/habitController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createHabit);
router.get('/', getHabits);
router.get('/stats', getHabitStats);
router.get('/:id', getHabitById);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/track', trackHabit);

export default router;