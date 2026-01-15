import express from 'express';
import { createRoom, getRooms, getRoomById, updateRoom, deleteRoom } from '../controllers/roomController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
const router = express.Router();

// Cho user - xem danh sách phòng và chi tiết phòng
router.route('/').get(getRooms);
router.route('/:id').get(getRoomById);

// Cho admin - quản lý phòng
// Upload ảnh đại diện (single) và ảnh chi tiết (array, tối đa 10 ảnh)
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },      // Ảnh đại diện (1 ảnh)
  { name: 'images', maxCount: 10 }      // Ảnh chi tiết (tối đa 10 ảnh)
]);

router.route('/').post(protect, admin, uploadFields, createRoom);
router.route('/:id').put(protect, admin, uploadFields, updateRoom).delete(protect, admin, deleteRoom);

export default router;

