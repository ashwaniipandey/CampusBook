import express from 'express';
import { getPublicStats } from '../controllers/publicController.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();

router.get('/stats', validateAllowedQuery(), getPublicStats);

export default router;
