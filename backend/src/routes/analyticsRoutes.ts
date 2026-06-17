import { Router } from 'express';
import {
  getProductivityStats,
  getTaskAnalytics,
  getHabitAnalytics,
  getWeeklyReport,
  getMonthlyReport,
  getRealTimeStats, // Add this import
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/productivity', getProductivityStats);
router.get('/tasks', getTaskAnalytics);
router.get('/habits', getHabitAnalytics);
router.get('/weekly-report', getWeeklyReport);
router.get('/monthly-report', getMonthlyReport);
router.get('/realtime', getRealTimeStats); // Add this route

export default router;