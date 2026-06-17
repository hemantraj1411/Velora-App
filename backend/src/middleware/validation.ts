import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

export const validateTask = [
  body('title').notEmpty().withMessage('Title is required').trim().isLength({ min: 1, max: 200 }),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['high', 'medium', 'low']),
  body('category').optional().isString(),
];

export const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export const validateHabit = [
  body('name').notEmpty().withMessage('Habit name is required'),
  body('frequency').isIn(['daily', 'weekly', 'monthly']),
];