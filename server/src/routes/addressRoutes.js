import express from 'express';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/addressController.js';
import { protect } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/requestSecurity.js';
import {
  validateCreateAddress,
  validateUpdateAddress,
} from '../validations/addressValidation.js';
import { validateAllowedQuery } from '../validations/requestValidation.js';

const router = express.Router();

router.param('id', validateObjectIdParam);

// All address routes are protected
router.use(validateAllowedQuery(), protect);

router.route('/')
  .get(getAddresses)
  .post(validateCreateAddress, createAddress);

router.route('/:id')
  .put(validateUpdateAddress, updateAddress)
  .delete(deleteAddress);

export default router;
