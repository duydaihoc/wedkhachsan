import express from 'express';
import { createRoomCategory, getRoomCategories, getRoomCategoryById, updateRoomCategory, deleteRoomCategory } from '../controllers/roomcategoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
const router = express.Router();
//cho user 
router.route('/').get(getRoomCategories);
//cho admin
router.route('/').post(protect, admin, createRoomCategory);
router.route('/:id').get(getRoomCategoryById).put(protect, admin, updateRoomCategory).delete(protect, admin, deleteRoomCategory);
export default router;