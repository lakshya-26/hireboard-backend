import { Router } from 'express';
import * as applicationController from '../controllers/application.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const routeBase = 'applications';

const router = Router();

router.use(requireAuth);

router.post('/', applicationController.create);
router.get('/', applicationController.list);
router.get('/:id', applicationController.getOne);
router.patch('/:id', applicationController.update);
router.delete('/:id', applicationController.remove);
router.post('/:id/notes', applicationController.addNote);

export default router;
