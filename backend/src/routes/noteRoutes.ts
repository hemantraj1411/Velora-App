import { Router } from 'express';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  summarizeNote,
  generateActionItems,
  convertToTask,
  getNoteFolders,
} from '../controllers/noteController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createNote);
router.get('/', getNotes);
router.get('/folders', getNoteFolders);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/summarize', summarizeNote);
router.post('/:id/action-items', generateActionItems);
router.post('/:id/convert-to-task', convertToTask);

export default router;