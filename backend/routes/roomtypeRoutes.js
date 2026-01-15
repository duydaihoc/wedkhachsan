import express from 'express';
import { createRoomType, getRoomTypes, getRoomTypeById, updateRoomType, deleteRoomType } from '../controllers/roomtypeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
const router = express.Router();
//cho user 
router.route('/').get(getRoomTypes);
//cho admin
router.route('/').post(protect, admin, createRoomType);
router.route('/:id').get(getRoomTypeById).put(protect, admin, updateRoomType).delete(protect, admin, deleteRoomType);
export default router;