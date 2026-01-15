import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  confirmPayment,
  confirmOnlinePayment,
  cancelBooking,
  createBookingForUser,
  getRoomBookings
} from '../controllers/bookingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(protect);

// User routes
router.route('/').post(createBooking); // Tạo booking
router.route('/mybookings').get(getBookings); // Lấy danh sách bookings của user

// Admin routes - PHẢI đặt TRƯỚC route /:id để tránh conflict
router.route('/admin').get(admin, getBookings); // Lấy tất cả bookings (admin only)
router.route('/admin/create').post(admin, createBookingForUser); // Admin tạo booking cho user
router.route('/admin/room-bookings').get(admin, getRoomBookings); // Lấy bookings của một phòng

// Dynamic routes - đặt sau các static routes
router.route('/:id').get(getBookingById); // Lấy booking theo ID
router.route('/:id/cancel').put(cancelBooking); // Hủy booking
router.route('/:id/status').put(admin, updateBookingStatus); // Cập nhật trạng thái (check-in, check-out)
router.route('/:id/payment').put(admin, confirmPayment); // Xác nhận thanh toán
router.route('/:id/online-payment').put(admin, confirmOnlinePayment); // Xác nhận đã nhận tiền online

export default router;
