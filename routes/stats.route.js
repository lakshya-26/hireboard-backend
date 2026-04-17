import { Router } from 'express';
import * as statsController from '../controllers/stats.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const routeBase = 'stats';

const router = Router();

router.use(requireAuth);
router.get('/overview', statsController.overview);

export default router;
