import { Router } from 'express';
import {
  getCalendarEvents,
  syncGoogleCalendar,
  getCalendarSettings,
  updateCalendarSettings,
} from '../controllers/calendarController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/events', getCalendarEvents);
router.post('/sync-google', syncGoogleCalendar);
router.get('/settings', getCalendarSettings);
router.put('/settings', updateCalendarSettings);

export default router;