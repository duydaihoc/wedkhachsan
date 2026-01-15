import express from 'express';
import { createService, getServices, getServiceById, updateService, deleteService } from '../controllers/serviceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
const router = express.Router();
//cho user 
router.route('/').get(getServices);
//cho admin
router.route('/').post(protect, admin, createService);
router.route('/:id').get(getServiceById).put(protect, admin, updateService).delete(protect, admin, deleteService);
export default router;