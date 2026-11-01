import express from 'express';
import { getStudentDashboardData } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/student', protect, getStudentDashboardData);

export default router;
