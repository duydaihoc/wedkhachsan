import Booking from '../models/bookingModel.js';
import Room from '../models/roomModel.js';
import User from '../models/userModel.js';
import { getIO } from '../socket.js';

// Tạo booking mới
export const createBooking = async (req, res) => {
  try {
    const {
      room,
      bookingType,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      hours,
      adults,
      children,
      amenities,
      services,
      roomPrice,
      amenitiesPrice,
      servicesPrice,
      totalPrice,
      paymentMethod
    } = req.body;

    const userId = req.user._id;

    // Kiểm tra phòng có tồn tại không
    const roomData = await Room.findById(room).populate('category').populate('type');
    if (!roomData) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Kiểm tra phòng có sẵn không (chưa được đặt trong khoảng thời gian này)
    const conflictingBookings = await Booking.find({
      room: room,
      status: { $in: ['pending', 'confirmed', 'checked-in'] },
      $or: [
        {
          checkInDate: { $lte: new Date(checkOutDate) },
          checkOutDate: { $gte: new Date(checkInDate) }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ message: 'Phòng đã được đặt trong khoảng thời gian này' });
    }

    // Tính số tiền còn lại
    let paidAmount = 0;
    let remainingAmount = totalPrice;
    
    if (paymentMethod === 'online') {
      // Thanh toán online: đặt cọc 30%
      paidAmount = Math.round(totalPrice * 0.3);
      remainingAmount = totalPrice - paidAmount;
    }

    // Tạo booking
    const booking = await Booking.create({
      user: userId,
      room,
      bookingType,
      checkInDate: new Date(checkInDate),
      checkInTime,
      checkOutDate: new Date(checkOutDate),
      checkOutTime,
      hours: hours || 1,
      adults: adults || 1,
      children: children || 0,
      amenities: amenities || [],
      services: services || [],
      roomPrice,
      amenitiesPrice,
      servicesPrice,
      totalPrice,
      paymentMethod: paymentMethod || 'cash',
      paidAmount,
      remainingAmount,
      paymentStatus: paymentMethod === 'online' ? 'partial' : 'pending',
      status: 'pending' // Tất cả booking ban đầu đều là pending, admin sẽ xác nhận
    });

    // Với thanh toán tại quầy: không đánh dấu phòng ngay (chờ admin xác nhận)
    // Với thanh toán online: cũng chờ admin xác nhận đã nhận tiền mới đánh dấu phòng

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo real-time cho admin
    try {
      const io = getIO();
      io.to('admin-room').emit('new-booking', {
        booking: populatedBooking,
        message: `Có đặt phòng mới từ ${populatedBooking.user.fullName || populatedBooking.user.username}`
      });
      
      // Gửi thông báo cho user
      io.to(`user-${userId}`).emit('booking-created', {
        booking: populatedBooking,
        message: 'Đặt phòng của bạn đã được tạo thành công!'
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
      // Không throw error, chỉ log vì booking đã được tạo thành công
    }

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Không thể tạo đặt phòng', error: error.message });
  }
};

// Lấy tất cả bookings (admin) hoặc bookings của user
export const getBookings = async (req, res) => {
  try {
    const isAdmin = req.user.isAdmin;
    let query = {};

    // Nếu không phải admin, chỉ lấy bookings của user đó
    if (!isAdmin) {
      query.user = req.user._id;
    }

    const bookings = await Booking.find(query)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services')
      .sort('-createdAt');

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Không thể tải danh sách đặt phòng', error: error.message });
  }
};

// Lấy booking theo ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    // Kiểm tra quyền: user chỉ xem được booking của mình, admin xem được tất cả
    if (!req.user.isAdmin && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đặt phòng này' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Không thể tải thông tin đặt phòng', error: error.message });
  }
};

// Cập nhật trạng thái booking (admin only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    const oldStatus = booking.status;
    booking.status = status;

    // Cập nhật trạng thái phòng dựa trên trạng thái booking
    const room = booking.room;
    
    if (status === 'checked-in') {
      room.status = 'Occupied';
    } else if (status === 'checked-out') {
      room.status = 'Dirty';
    } else if (status === 'completed') {
      room.status = 'Available';
    } else if (status === 'cancelled') {
      // Nếu hủy booking, trả phòng về Available
      if (oldStatus === 'confirmed' || oldStatus === 'pending') {
        room.status = 'Available';
      }
    }

    await room.save();
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    res.status(200).json(populatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Không thể cập nhật trạng thái đặt phòng', error: error.message });
  }
};

// Xác nhận thanh toán (admin only)
export const confirmPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const booking = await Booking.findById(req.params.id).populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    const paymentAmount = parseFloat(amount) || booking.remainingAmount;
    booking.paidAmount += paymentAmount;
    booking.remainingAmount -= paymentAmount;

    if (booking.remainingAmount <= 0) {
      booking.paymentStatus = 'paid';
      booking.paymentDate = new Date();
      // Nếu đã check-out và thanh toán xong, hoàn tất booking
      if (booking.status === 'checked-out') {
        booking.status = 'completed';
        // Trả phòng về Available
        const room = booking.room;
        room.status = 'Available';
        await room.save();
      }
    } else {
      booking.paymentStatus = 'partial';
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo real-time cho user
    try {
      const io = getIO();
      let message = 'Thanh toán đã được xác nhận';
      if (populatedBooking.paymentStatus === 'paid') {
        message = 'Bạn đã thanh toán đầy đủ. Cảm ơn bạn!';
      } else if (populatedBooking.paymentStatus === 'partial') {
        message = `Đã thanh toán ${paymentAmount.toLocaleString('vi-VN')} VND. Còn lại ${populatedBooking.remainingAmount.toLocaleString('vi-VN')} VND`;
      }
      
      io.to(`user-${populatedBooking.user._id}`).emit('booking-updated', {
        booking: populatedBooking,
        message: message,
        paymentStatus: populatedBooking.paymentStatus
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.status(200).json(populatedBooking);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Không thể xác nhận thanh toán', error: error.message });
  }
};

// Xác nhận đã nhận tiền online (admin only)
export const confirmOnlinePayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    if (booking.paymentMethod !== 'online') {
      return res.status(400).json({ message: 'Đặt phòng này không phải thanh toán online' });
    }

    // Xác nhận đã nhận tiền đặt cọc
    booking.status = 'confirmed';
    
    // Đánh dấu phòng đã được đặt
    const room = booking.room;
    room.status = 'Occupied';
    await room.save();

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo real-time cho user
    try {
      const io = getIO();
      io.to(`user-${populatedBooking.user._id}`).emit('booking-updated', {
        booking: populatedBooking,
        message: 'Đặt cọc của bạn đã được xác nhận! Đặt phòng đã được xác nhận.',
        status: 'confirmed'
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.status(200).json(populatedBooking);
  } catch (error) {
    console.error('Error confirming online payment:', error);
    res.status(500).json({ message: 'Không thể xác nhận thanh toán online', error: error.message });
  }
};

// Hủy booking
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    // Kiểm tra quyền: user chỉ hủy được booking của mình, admin hủy được tất cả
    if (!req.user.isAdmin && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền hủy đặt phòng này' });
    }

    // Chỉ cho phép hủy nếu chưa check-in
    if (['checked-in', 'checked-out', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Không thể hủy đặt phòng đã nhận phòng' });
    }

    booking.status = 'cancelled';

    // Trả phòng về Available
    const room = booking.room;
    if (room.status === 'Occupied') {
      room.status = 'Available';
      await room.save();
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo real-time cho user
    try {
      const io = getIO();
      io.to(`user-${populatedBooking.user._id}`).emit('booking-updated', {
        booking: populatedBooking,
        message: 'Đặt phòng của bạn đã bị hủy.',
        status: 'cancelled'
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.status(200).json(populatedBooking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Không thể hủy đặt phòng', error: error.message });
  }
};

// Admin tạo booking cho user khác hoặc khách vãng lai
export const createBookingForUser = async (req, res) => {
  try {
    const {
      userId, // ID của user (có thể null nếu là khách vãng lai)
      guestInfo, // Thông tin khách vãng lai: { fullName, phone, email? }
      room,
      bookingType,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      hours,
      adults,
      children,
      amenities,
      services,
      roomPrice,
      amenitiesPrice,
      servicesPrice,
      totalPrice
    } = req.body;

    // Kiểm tra phòng có tồn tại không
    const roomData = await Room.findById(room).populate('category').populate('type');
    if (!roomData) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Kiểm tra phòng có sẵn không
    const conflictingBookings = await Booking.find({
      room: room,
      status: { $in: ['pending', 'confirmed', 'checked-in'] },
      $or: [
        {
          checkInDate: { $lte: new Date(checkOutDate) },
          checkOutDate: { $gte: new Date(checkInDate) }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({ message: 'Phòng đã được đặt trong khoảng thời gian này' });
    }

    let finalUserId = userId;

    // Nếu không có userId, tạo user tạm cho khách vãng lai
    if (!userId && guestInfo) {
      // Tạo username và email tạm
      const tempUsername = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const tempEmail = `guest_${Date.now()}@temp.com`;
      const tempPassword = Math.random().toString(36).substring(2, 15);

      const guestUser = await User.create({
        username: tempUsername,
        email: tempEmail,
        password: tempPassword, // Sẽ được hash trong pre-save hook
        fullName: guestInfo.fullName || 'Khách Vãng Lai',
        phone: guestInfo.phone || '',
        isAdmin: false
      });

      finalUserId = guestUser._id;
    } else if (!userId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp userId hoặc thông tin khách vãng lai' });
    }

    // Tạo booking với paymentMethod = 'cash' (thanh toán tại quầy)
    const booking = await Booking.create({
      user: finalUserId,
      room,
      bookingType,
      checkInDate: new Date(checkInDate),
      checkInTime,
      checkOutDate: new Date(checkOutDate),
      checkOutTime,
      hours: hours || 1,
      adults: adults || 1,
      children: children || 0,
      amenities: amenities || [],
      services: services || [],
      roomPrice,
      amenitiesPrice,
      servicesPrice,
      totalPrice,
      paymentMethod: 'cash', // Luôn là cash cho admin booking
      paidAmount: 0,
      remainingAmount: totalPrice,
      paymentStatus: 'pending',
      status: 'pending'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo real-time cho user (nếu có)
    try {
      const io = getIO();
      io.to(`user-${finalUserId}`).emit('booking-created', {
        booking: populatedBooking,
        message: 'Đặt phòng của bạn đã được tạo thành công!'
      });
      
      // Gửi thông báo cho admin
      io.to('admin-room').emit('new-booking', {
        booking: populatedBooking,
        message: `Admin đã tạo đặt phòng mới cho ${populatedBooking.user.fullName || populatedBooking.user.username}`
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Error creating booking for user:', error);
    res.status(500).json({ message: 'Không thể tạo đặt phòng', error: error.message });
  }
};

// Lấy bookings của một phòng trong khoảng thời gian (để hiển thị lịch)
export const getRoomBookings = async (req, res) => {
  try {
    const { roomId, startDate, endDate } = req.query;

    if (!roomId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp roomId' });
    }

    const query = {
      room: roomId,
      status: { $in: ['pending', 'confirmed', 'checked-in'] } // Chỉ lấy các booking đang active
    };

    // Nếu có startDate và endDate, filter theo khoảng thời gian
    if (startDate && endDate) {
      query.$or = [
        {
          checkInDate: { $lte: new Date(endDate) },
          checkOutDate: { $gte: new Date(startDate) }
        }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .sort('checkInDate checkInTime');

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching room bookings:', error);
    res.status(500).json({ message: 'Không thể tải lịch đặt phòng', error: error.message });
  }
};
