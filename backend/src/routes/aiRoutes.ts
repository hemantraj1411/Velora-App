import { Router } from 'express';
import {
  chatWithAI,
  generateStudyPlan,
  planMyDay,
  prioritizeTasks,
  getSmartSuggestions,
  voiceCommand,
} from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/chat', chatWithAI);
router.post('/study-plan', generateStudyPlan);
router.post('/plan-day', planMyDay);
router.get('/prioritize', prioritizeTasks);
router.get('/suggestions', getSmartSuggestions);
router.post('/voice-command', voiceCommand);

export default router;