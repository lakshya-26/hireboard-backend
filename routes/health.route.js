import { Router } from 'express';

const router = Router();

/**
 * Liveness / readiness probe for orchestrators and monitoring.
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'hireboard-backend',
    timestamp: new Date().toISOString(),
  });
});

export default router;
