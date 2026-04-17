import { Router } from 'express';
import * as reminderController from '../controllers/reminder.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const routeBase = 'reminders';

const router = Router();

router.use(requireAuth);

router.get('/due-count', reminderController.dueCount);
router.get('/', reminderController.list);
router.post('/', reminderController.create);
router.patch('/:id', reminderController.markComplete);

export default router;
