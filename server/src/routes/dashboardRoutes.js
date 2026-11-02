import express from 'express';
import { getStudentDashboardData } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/auth.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();

router.get('/student', validateAllowedQuery(), protect, getStudentDashboardData);

export default router;
