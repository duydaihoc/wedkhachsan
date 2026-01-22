import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  confirmPayment,
  confirmOnlinePayment,
  userConfirmOnlinePayment,
  cancelBooking,
  createBookingForUser,
  createGuestBooking,
  getRoomBookings,
  getPublicRoomSchedule,
  changeRoom,
  getAvailableRoomsForChange,
  getGuestBookingById
} from '../controllers/bookingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (không cần đăng nhập) - Đặt lên đầu tiên để đảm bảo không bị protect
router.post('/public/guest-booking', createGuestBooking); // Đặt phòng cho khách vãng lai
router.get('/public/room-schedule', getPublicRoomSchedule); // Lấy lịch đặt phòng công khai
router.get('/public/:id', getGuestBookingById); // Lấy thông tin booking cho khách vãng lai


// Tất cả routes dưới đây đều cần đăng nhập
router.use(protect);

// User routes
router.route('/').post(createBooking); // Tạo booking
router.route('/mybookings').get(getBookings); // Lấy danh sách bookings của user
router.route('/room-bookings').get(getRoomBookings); // Lấy bookings của một phòng (public)

// Admin routes - PHẢI đặt TRƯỚC route /:id để tránh conflict
router.route('/admin').get(admin, getBookings); // Lấy tất cả bookings (admin only)
router.route('/admin/create').post(admin, createBookingForUser); // Admin tạo booking cho user
router.route('/admin/room-bookings').get(admin, getRoomBookings); // Lấy bookings của một phòng (admin)

// Dynamic routes - đặt sau các static routes
router.route('/:id').get(getBookingById); // Lấy booking theo ID
router.route('/:id/cancel').put(cancelBooking); // Hủy booking
router.route('/:id/status').put(admin, updateBookingStatus); // Cập nhật trạng thái (check-in, check-out)
router.route('/:id/payment').put(admin, confirmPayment); // Xác nhận thanh toán
router.route('/:id/user-confirm-payment').put(userConfirmOnlinePayment); // User xác nhận đã thanh toán online
router.route('/:id/online-payment').put(admin, confirmOnlinePayment); // Xác nhận đã nhận tiền online
router.route('/:id/change-room').put(admin, changeRoom); // Đổi phòng
router.route('/:id/available-rooms').get(admin, getAvailableRoomsForChange); // Lấy danh sách phòng có thể đổi

export default router;
