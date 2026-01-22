import express from "express";
import { createTable, updateTable, deleteTable, getTables, getTableById } from "../controllers/restaurantController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
const router = express.Router();
//cho người dùng xem bàn
router.route('/').get(getTables);

//cho admin tạo , sửa , xóa bàn
router.route('/:id').get(protect, admin, getTableById);
router.route('/').post(protect, admin, createTable);
router.route('/:id').put(protect, admin, updateTable);
router.route('/:id').delete(protect, admin, deleteTable);
export default router;