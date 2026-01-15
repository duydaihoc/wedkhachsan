import express from 'express';
import { createAmenity, getAmenities, getAmenityById, updateAmenity, deleteAmenity } from '../controllers/amenityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
const router = express.Router();
//cho user 
router.route('/').get(getAmenities);
//cho admin
router.route('/').post(protect, admin, createAmenity);
router.route('/:id').get(getAmenityById).put(protect, admin, updateAmenity).delete(protect, admin, deleteAmenity);
export default router;