import { Router, RequestHandler } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

router.get('/stats', getDashboardStats as RequestHandler)

export default router;