import Booking from '../models/bookingModel.js';
import Room from '../models/roomModel.js';
import User from '../models/userModel.js';
import { getIO } from '../socket.js';

// Helper function để kiểm tra overlap giữa 2 khoảng thời gian
const checkTimeOverlap = (start1Date, start1Time, end1Date, end1Time, start2Date, start2Time, end2Date, end2Time) => {
  // Tạo Date objects với cả ngày và giờ (đảm bảo format đúng)
  // Sử dụng local timezone để tránh timezone issues
  const parseDateTime = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  };

  const start1 = parseDateTime(start1Date, start1Time);
  const end1 = parseDateTime(end1Date, end1Time);
  const start2 = parseDateTime(start2Date, start2Time);
  const end2 = parseDateTime(end2Date, end2Time);

  // Kiểm tra overlap: 2 khoảng thời gian overlap nếu:
  // - Có bất kỳ điểm nào trong khoảng 1 nằm trong khoảng 2, hoặc ngược lại
  // - Hoặc khoảng 1 bao phủ hoàn toàn khoảng 2, hoặc ngược lại
  // Logic: start1 < end2 AND start2 < end1 (bao gồm cả trường hợp bằng nhau ở đầu hoặc cuối)
  // Nhưng không overlap nếu: end1 <= start2 hoặc end2 <= start1

  const hasOverlap = !(end1 <= start2 || end2 <= start1);

  return hasOverlap;
};

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
    // Lấy tất cả booking active của phòng này
    const existingBookings = await Booking.find({
      room: room,
      status: { $in: ['pending', 'confirmed', 'checked-in', 'payment-pending'] }
    });

    // Format date strings đúng cách (YYYY-MM-DD)
    const formatDateString = (date) => {
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return date;
    };

    // Kiểm tra xem có booking nào trùng thời gian không
    const conflictingBookings = existingBookings.filter(booking => {
      const bookingCheckInDate = formatDateString(booking.checkInDate);
      const bookingCheckOutDate = formatDateString(booking.checkOutDate);

      const hasConflict = checkTimeOverlap(
        checkInDate, checkInTime,
        checkOutDate, checkOutTime,
        bookingCheckInDate, booking.checkInTime,
        bookingCheckOutDate, booking.checkOutTime
      );

      // Log để debug
      if (hasConflict) {
        console.log('⚠️ Phát hiện trùng giờ:', {
          newBooking: `${checkInDate} ${checkInTime} - ${checkOutDate} ${checkOutTime}`,
          existingBooking: `${bookingCheckInDate} ${booking.checkInTime} - ${bookingCheckOutDate} ${booking.checkOutTime}`,
          bookingCode: booking.bookingCode
        });
      }

      return hasConflict;
    });

    if (conflictingBookings.length > 0) {
      // Tạo danh sách các khung giờ bị trùng (KHÔNG hiển thị mã booking của người khác để bảo mật)
      const conflictDetails = conflictingBookings.map(b => {
        const checkInStr = `${new Date(b.checkInDate).toLocaleDateString('vi-VN')} ${b.checkInTime}`;
        const checkOutStr = `${new Date(b.checkOutDate).toLocaleDateString('vi-VN')} ${b.checkOutTime}`;
        return `• ${checkInStr} - ${checkOutStr}`;
      }).join('\n');

      return res.status(400).json({
        message: `⚠️ Phòng đã được đặt trong khoảng thời gian này!\n\nKhung giờ bị trùng:\n${conflictDetails}\n\nVui lòng chọn thời gian khác hoặc xem lịch đặt phòng để chọn khung giờ còn trống.`
      });
    }

    // Tính số tiền còn lại
    let paidAmount = 0;
    let remainingAmount = totalPrice;

    if (paymentMethod === 'online') {
      // Thanh toán online: đặt cọc 30%
      paidAmount = Math.round(totalPrice * 0.3);
      remainingAmount = totalPrice - paidAmount;
    }

    // Tạo Date object từ date string đúng cách (tránh timezone issues)
    // Tạo Date ở local timezone thay vì UTC
    const parseLocalDate = (dateString) => {
      // dateString format: "YYYY-MM-DD"
      const [year, month, day] = dateString.split('-').map(Number);
      // Tạo Date object ở local timezone (month - 1 vì Date month bắt đầu từ 0)
      return new Date(year, month - 1, day);
    };

    // Tạo booking
    const booking = await Booking.create({
      user: userId,
      room,
      bookingType,
      checkInDate: parseLocalDate(checkInDate),
      checkInTime,
      checkOutDate: parseLocalDate(checkOutDate),
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
      status: paymentMethod === 'online' ? 'payment-pending' : 'pending' // Nếu thanh toán online thì chờ user xác nhận thanh toán
    });

    // Với thanh toán tại quầy: không đánh dấu phòng ngay (chờ admin xác nhận)
    // Với thanh toán online: cũng chờ admin xác nhận đã nhận tiền mới đánh dấu phòng

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo real-time cho admin (chỉ khi không phải payment-pending)
    try {
      const io = getIO();
      if (booking.status !== 'payment-pending') {
        io.to('admin-room').emit('new-booking', {
          booking: populatedBooking,
          message: `Có đặt phòng mới từ ${populatedBooking.user.fullName || populatedBooking.user.username}`
        });
      }

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
    } else {
      // Admin không thấy các booking đang ở trạng thái payment-pending (chưa thanh toán)
      query.status = { $ne: 'payment-pending' };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'username email fullName phone')
      .populate({
        path: 'room',
        populate: {
          path: 'type',
          select: 'name image maxAdults maxChildren'
        }
      })
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
      .populate({
        path: 'room',
        populate: {
          path: 'type',
          select: 'name image maxAdults maxChildren'
        }
      })
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
    const wasBookingConfirmed = booking.bookingConfirmed;

    // Kiểm tra nếu đang cố check-in: phải đảm bảo phòng không có booking nào khác đang checked-in
    if (status === 'checked-in' && oldStatus !== 'checked-in') {
      // Format date strings đúng cách (YYYY-MM-DD)
      const formatDateString = (date) => {
        if (date instanceof Date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return date;
      };

      // Tìm các booking khác của cùng phòng đang ở trạng thái checked-in (chưa checked-out)
      const activeBookings = await Booking.find({
        room: booking.room._id,
        _id: { $ne: booking._id }, // Loại trừ booking hiện tại
        status: 'checked-in' // Chỉ tìm các booking đang checked-in
      });

      if (activeBookings.length > 0) {
        // Tìm thông tin booking đang sử dụng phòng
        const activeBooking = await Booking.findById(activeBookings[0]._id)
          .populate('user', 'username fullName')
          .populate('room');

        const guestName = activeBooking.user?.fullName || activeBooking.user?.username || 'Khách hàng';
        const bookingCode = activeBooking.bookingCode || 'N/A';

        return res.status(400).json({
          message: `Phòng ${booking.room.roomNumber || booking.room._id} đang được sử dụng bởi booking ${bookingCode} (${guestName}). Vui lòng đợi khách hàng trả phòng (check-out) trước khi cho booking khác nhận phòng.`
        });
      }

      // Kiểm tra xem có booking nào khác ở cùng phòng với check-in sớm hơn nhưng chưa nhận phòng không
      // Chỉ kiểm tra nếu không có flag force=true (admin đã xác nhận)
      if (!req.body.force) {
        const bookingCheckInDate = formatDateString(booking.checkInDate);
        const bookingCheckInDateTime = new Date(`${bookingCheckInDate}T${booking.checkInTime || '00:00'}`);

        // Tìm các booking khác ở cùng phòng với check-in sớm hơn nhưng chưa checked-in
        const earlierBookings = await Booking.find({
          room: booking.room._id,
          _id: { $ne: booking._id },
          status: { $in: ['pending', 'confirmed', 'payment-pending'] } // Chưa checked-in
        })
          .populate('user', 'username fullName')
          .sort({ checkInDate: 1, checkInTime: 1 }); // Sắp xếp theo thời gian check-in

        // Lọc các booking có check-in sớm hơn booking hiện tại
        const earlierPendingBookings = earlierBookings.filter(earlierBooking => {
          const earlierCheckInDate = formatDateString(earlierBooking.checkInDate);
          const earlierCheckInDateTime = new Date(`${earlierCheckInDate}T${earlierBooking.checkInTime || '00:00'}`);
          return earlierCheckInDateTime < bookingCheckInDateTime;
        });

        if (earlierPendingBookings.length > 0) {
          // Tìm booking sớm nhất
          const earliestBooking = earlierPendingBookings[0];
          const earliestCheckInDate = formatDateString(earliestBooking.checkInDate);
          const earliestCheckInDateTime = new Date(`${earliestCheckInDate}T${earliestBooking.checkInTime || '00:00'}`);

          const guestName = earliestBooking.user?.fullName || earliestBooking.user?.username || 'Khách hàng';
          const bookingCode = earliestBooking.bookingCode || 'N/A';
          const checkInStr = `${new Date(earliestBooking.checkInDate).toLocaleDateString('vi-VN')} ${earliestBooking.checkInTime}`;

          return res.status(409).json({
            message: `Có booking khác ở phòng ${booking.room.roomNumber || booking.room._id} với thời gian check-in sớm hơn nhưng chưa nhận phòng.`,
            earlierBooking: {
              _id: earliestBooking._id,
              bookingCode: bookingCode,
              guestName: guestName,
              checkInDate: earliestCheckInDate,
              checkInTime: earliestBooking.checkInTime,
              checkInDisplay: checkInStr,
              status: earliestBooking.status
            },
            currentBooking: {
              checkInDate: bookingCheckInDate,
              checkInTime: booking.checkInTime,
              checkInDisplay: `${new Date(booking.checkInDate).toLocaleDateString('vi-VN')} ${booking.checkInTime}`
            },
            requiresConfirmation: true
          });
        }
      }
    }

    // Nếu đang xác nhận booking (status = 'confirmed' và chưa confirmed), đánh dấu đã xác nhận
    if (status === 'confirmed' && !booking.bookingConfirmed) {
      booking.bookingConfirmed = true;
    }

    // Nếu check-out và đã thanh toán đủ (hoặc có hoàn tiền), tự động chuyển sang completed
    if (status === 'checked-out' && booking.paymentStatus === 'paid') {
      booking.status = 'completed';
    } else {
      booking.status = status;
    }

    // Cập nhật trạng thái phòng dựa trên trạng thái booking
    const room = booking.room;

    if (booking.status === 'checked-in') {
      room.status = 'Occupied';
    } else if (booking.status === 'checked-out') {
      room.status = 'Dirty';
    } else if (booking.status === 'completed') {
      room.status = 'Available';
    } else if (status === 'cancelled') {
      // Nếu hủy booking, trả phòng về Available
      if (oldStatus === 'confirmed' || oldStatus === 'pending' || oldStatus === 'payment-pending') {
        room.status = 'Available';
      }
      // Nếu hủy check-in (từ checked-in về cancelled), trả phòng về Available
      if (oldStatus === 'checked-in') {
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

    // Chỉ gửi thông báo khi xác nhận booking (không gửi cho check-in, check-out, payment)
    try {
      const io = getIO();

      // Nếu vừa mới xác nhận booking (bookingConfirmed chuyển từ false sang true)
      if (populatedBooking.bookingConfirmed && !wasBookingConfirmed && populatedBooking.status === 'confirmed') {
        io.to(`user-${populatedBooking.user._id}`).emit('booking-updated', {
          booking: populatedBooking,
          message: 'Booking của bạn đã được xác nhận! Bạn có thể đến nhận phòng.',
          status: populatedBooking.status
        });
        console.log('Sending booking confirmation notification to user:', populatedBooking.user._id);
      }
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.status(200).json(populatedBooking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Không thể cập nhật trạng thái đặt phòng', error: error.message });
  }
};

// Xác nhận thanh toán (admin only)
export const confirmPayment = async (req, res) => {
  try {
    const { amount, paymentMethodDetail } = req.body;
    const booking = await Booking.findById(req.params.id).populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    const paymentAmount = parseFloat(amount) || booking.remainingAmount;
    booking.paidAmount += paymentAmount;
    booking.remainingAmount -= paymentAmount;

    // Cập nhật phương thức thanh toán chi tiết (cash hoặc qr)
    if (paymentMethodDetail && ['cash', 'qr'].includes(paymentMethodDetail)) {
      booking.paymentMethodDetail = paymentMethodDetail;
    }

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

    // Không gửi thông báo socket cho thanh toán (chỉ reload trang)

    res.status(200).json(populatedBooking);
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ message: 'Không thể xác nhận thanh toán', error: error.message });
  }
};

// User xác nhận đã thực hiện thanh toán online (chuyển từ payment-pending sang pending)
export const userConfirmOnlinePayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    // Kiểm tra quyền: chỉ user tạo booking mới được xác nhận
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xác nhận booking này' });
    }

    if (booking.paymentMethod !== 'online') {
      return res.status(400).json({ message: 'Đặt phòng này không phải thanh toán online' });
    }

    if (booking.status !== 'payment-pending') {
      return res.status(400).json({ message: 'Booking này không ở trạng thái chờ thanh toán' });
    }

    // Chuyển từ payment-pending sang pending để admin thấy và xác nhận
    booking.status = 'pending';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo cho admin
    try {
      const io = getIO();
      io.to('admin-room').emit('new-booking', {
        booking: populatedBooking,
        message: `Có đặt phòng mới từ ${populatedBooking.user.fullName || populatedBooking.user.username} - Đã thanh toán online`
      });

      // Không gửi thông báo cho user (chỉ reload trang)
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.status(200).json(populatedBooking);
  } catch (error) {
    console.error('Error confirming user payment:', error);
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
    booking.bookingConfirmed = false; // Chưa xác nhận booking, chỉ mới xác nhận thanh toán

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

    // Không gửi thông báo socket cho xác nhận thanh toán (chỉ reload trang)

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

    // Cho phép hủy booking đã checked-in (admin có thể hủy nhận phòng và kết thúc booking)
    // Chỉ không cho phép hủy nếu đã checked-out hoặc completed
    if (['checked-out', 'completed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Không thể hủy đặt phòng đã trả phòng hoặc hoàn tất' });
    }

    // Lưu trạng thái cũ để gửi thông báo phù hợp
    const oldStatus = booking.status;

    booking.status = 'cancelled';

    // Trả phòng về Available (cho cả checked-in và các trạng thái khác)
    const room = booking.room;
    if (room.status === 'Occupied' || booking.status === 'checked-in') {
      room.status = 'Available';
      await room.save();
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo socket khi hủy booking
    try {
      const io = getIO();
      // Phân biệt loại hủy: hủy xác nhận thanh toán (từ payment-pending) vs hủy booking đã xác nhận thanh toán (từ confirmed)
      const wasPaymentPending = oldStatus === 'payment-pending' || oldStatus === 'pending';
      const wasConfirmed = oldStatus === 'confirmed';

      io.to(`user-${populatedBooking.user._id}`).emit('booking-updated', {
        booking: populatedBooking,
        message: wasPaymentPending
          ? 'Xác nhận thanh toán đã bị hủy do lỗi ngân hàng hoặc vấn đề kỹ thuật'
          : 'Admin đã hủy xác nhận đặt phòng của bạn',
        status: populatedBooking.status,
        cancelled: true,
        paymentCancelled: wasPaymentPending, // Đánh dấu là hủy xác nhận thanh toán
        refundRequired: wasConfirmed && populatedBooking.paymentMethod === 'online' && populatedBooking.paidAmount > 0 // Đánh dấu cần hoàn tiền khi đã xác nhận thanh toán
      });
      console.log('Sending booking cancellation notification to user:', populatedBooking.user._id);
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
    const existingBookings = await Booking.find({
      room: room,
      status: { $in: ['pending', 'confirmed', 'checked-in', 'payment-pending'] }
    });

    // Format date strings đúng cách (YYYY-MM-DD)
    const formatDateString = (date) => {
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return date;
    };

    // Kiểm tra xem có booking nào trùng thời gian không
    const conflictingBookings = existingBookings.filter(booking => {
      const bookingCheckInDate = formatDateString(booking.checkInDate);
      const bookingCheckOutDate = formatDateString(booking.checkOutDate);

      const hasConflict = checkTimeOverlap(
        checkInDate, checkInTime,
        checkOutDate, checkOutTime,
        bookingCheckInDate, booking.checkInTime,
        bookingCheckOutDate, booking.checkOutTime
      );

      // Log để debug
      if (hasConflict) {
        console.log('⚠️ Phát hiện trùng giờ (Admin):', {
          newBooking: `${checkInDate} ${checkInTime} - ${checkOutDate} ${checkOutTime}`,
          existingBooking: `${bookingCheckInDate} ${booking.checkInTime} - ${bookingCheckOutDate} ${booking.checkOutTime}`,
          bookingCode: booking.bookingCode
        });
      }

      return hasConflict;
    });

    if (conflictingBookings.length > 0) {
      // Tạo danh sách các khung giờ bị trùng (KHÔNG hiển thị mã booking của người khác để bảo mật)
      const conflictDetails = conflictingBookings.map(b => {
        const checkInStr = `${new Date(b.checkInDate).toLocaleDateString('vi-VN')} ${b.checkInTime}`;
        const checkOutStr = `${new Date(b.checkOutDate).toLocaleDateString('vi-VN')} ${b.checkOutTime}`;
        return `• ${checkInStr} - ${checkOutStr}`;
      }).join('\n');

      return res.status(400).json({
        message: `⚠️ Phòng đã được đặt trong khoảng thời gian này!\n\nKhung giờ bị trùng:\n${conflictDetails}\n\nVui lòng chọn thời gian khác.`
      });
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

    // Tạo Date object từ date string đúng cách (tránh timezone issues)
    const parseLocalDate = (dateString) => {
      // dateString format: "YYYY-MM-DD"
      const [year, month, day] = dateString.split('-').map(Number);
      // Tạo Date object ở local timezone (month - 1 vì Date month bắt đầu từ 0)
      return new Date(year, month - 1, day);
    };

    // Tạo booking với paymentMethod = 'cash' (thanh toán tại quầy)
    const booking = await Booking.create({
      user: finalUserId,
      room,
      bookingType,
      checkInDate: parseLocalDate(checkInDate),
      checkInTime,
      checkOutDate: parseLocalDate(checkOutDate),
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

// Tạo booking cho khách vãng lai (không cần đăng nhập)
export const createGuestBooking = async (req, res) => {
  try {
    const {
      guestInfo, // { fullName, phone, email }
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

    // Validate thông tin khách vãng lai
    if (!guestInfo || !guestInfo.fullName || !guestInfo.phone) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp đầy đủ thông tin: Họ tên và Số điện thoại'
      });
    }

    // Kiểm tra phòng có tồn tại không
    const roomData = await Room.findById(room).populate('category').populate('type');
    if (!roomData) {
      return res.status(404).json({ message: 'Phòng không tồn tại' });
    }

    // Kiểm tra phòng có sẵn không (chưa được đặt trong khoảng thời gian này)
    const existingBookings = await Booking.find({
      room: room,
      status: { $in: ['pending', 'confirmed', 'checked-in', 'payment-pending'] }
    });

    // Format date strings đúng cách (YYYY-MM-DD)
    const formatDateString = (date) => {
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return date;
    };

    // Kiểm tra xem có booking nào trùng thời gian không
    const conflictingBookings = existingBookings.filter(booking => {
      const bookingCheckInDate = formatDateString(booking.checkInDate);
      const bookingCheckOutDate = formatDateString(booking.checkOutDate);

      const hasConflict = checkTimeOverlap(
        checkInDate, checkInTime,
        checkOutDate, checkOutTime,
        bookingCheckInDate, booking.checkInTime,
        bookingCheckOutDate, booking.checkOutTime
      );

      if (hasConflict) {
        console.log('⚠️ Phát hiện trùng giờ (Guest):', {
          newBooking: `${checkInDate} ${checkInTime} - ${checkOutDate} ${checkOutTime}`,
          existingBooking: `${bookingCheckInDate} ${booking.checkInTime} - ${bookingCheckOutDate} ${booking.checkOutTime}`,
          bookingCode: booking.bookingCode
        });
      }

      return hasConflict;
    });

    if (conflictingBookings.length > 0) {
      const conflictDetails = conflictingBookings.map(b => {
        const checkInStr = `${new Date(b.checkInDate).toLocaleDateString('vi-VN')} ${b.checkInTime}`;
        const checkOutStr = `${new Date(b.checkOutDate).toLocaleDateString('vi-VN')} ${b.checkOutTime}`;
        return `• ${checkInStr} - ${checkOutStr}`;
      }).join('\n');

      return res.status(400).json({
        message: `⚠️ Phòng đã được đặt trong khoảng thời gian này!\n\nKhung giờ bị trùng:\n${conflictDetails}\n\nVui lòng chọn thời gian khác.`
      });
    }

    // Tạo user tạm cho khách vãng lai
    const tempUsername = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempEmail = guestInfo.email || `guest_${Date.now()}@temp.com`;
    const tempPassword = Math.random().toString(36).substring(2, 15);

    const guestUser = await User.create({
      username: tempUsername,
      email: tempEmail,
      password: tempPassword, // Sẽ được hash trong pre-save hook
      fullName: guestInfo.fullName,
      phone: guestInfo.phone,
      isAdmin: false
    });

    // Tạo Date object từ date string đúng cách (tránh timezone issues)
    const parseLocalDate = (dateString) => {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    // Tạo booking với paymentMethod = 'cash' (khách vãng lai chỉ thanh toán tại quầy)
    const booking = await Booking.create({
      user: guestUser._id,
      room,
      bookingType,
      checkInDate: parseLocalDate(checkInDate),
      checkInTime,
      checkOutDate: parseLocalDate(checkOutDate),
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
      paymentMethod: 'cash', // Luôn là cash cho khách vãng lai
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

    // Gửi thông báo real-time cho admin
    try {
      const io = getIO();
      io.to('admin-room').emit('new-booking', {
        booking: populatedBooking,
        message: `Có đặt phòng mới từ khách vãng lai: ${guestInfo.fullName}`
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    res.status(201).json(populatedBooking);
  } catch (error) {
    console.error('Error creating guest booking:', error);
    res.status(500).json({ message: 'Không thể tạo đặt phòng', error: error.message });
  }
};

// Lấy thông tin booking cho khách vãng lai (Public access)
export const getGuestBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Không tìm thấy đặt phòng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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
      status: { $in: ['pending', 'confirmed', 'checked-in', 'payment-pending'] } // Lấy cả payment-pending
    };

    let bookings = await Booking.find(query)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .sort('checkInDate checkInTime');

    // Nếu có startDate và endDate, filter theo khoảng thời gian chính xác
    if (startDate && endDate) {
      bookings = bookings.filter(booking => {
        // Sử dụng helper function để kiểm tra overlap
        return checkTimeOverlap(
          startDate, '00:00',
          endDate, '23:59',
          booking.checkInDate.toISOString().split('T')[0], booking.checkInTime,
          booking.checkOutDate.toISOString().split('T')[0], booking.checkOutTime
        );
      });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching room bookings:', error);
    res.status(500).json({ message: 'Không thể tải lịch đặt phòng', error: error.message });
  }
};

// Lấy lịch đặt phòng công khai (không cần đăng nhập, chỉ hiển thị thông tin cơ bản)
export const getPublicRoomSchedule = async (req, res) => {
  try {
    const { roomId, startDate, endDate } = req.query;

    if (!roomId) {
      return res.status(400).json({ message: 'Vui lòng cung cấp roomId' });
    }

    const query = {
      room: roomId,
      status: { $in: ['pending', 'confirmed', 'checked-in', 'payment-pending'] }
    };

    let bookings = await Booking.find(query)
      .select('checkInDate checkInTime checkOutDate checkOutTime bookingCode status bookingType')
      .sort('checkInDate checkInTime');

    // Nếu có startDate và endDate, filter theo khoảng thời gian chính xác
    if (startDate && endDate) {
      bookings = bookings.filter(booking => {
        return checkTimeOverlap(
          startDate, '00:00',
          endDate, '23:59',
          booking.checkInDate.toISOString().split('T')[0], booking.checkInTime,
          booking.checkOutDate.toISOString().split('T')[0], booking.checkOutTime
        );
      });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching room bookings:', error);
    res.status(500).json({ message: 'Không thể tải lịch đặt phòng', error: error.message });
  }
};

// Lấy danh sách phòng có thể đổi cho booking (admin only)
export const getAvailableRoomsForChange = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    // Format date strings đúng cách
    const formatDateString = (date) => {
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return date;
    };

    const bookingCheckInDate = formatDateString(booking.checkInDate);
    const bookingCheckOutDate = formatDateString(booking.checkOutDate);

    // Lấy tất cả phòng (trừ phòng hiện tại)
    const allRooms = await Room.find({ _id: { $ne: booking.room._id } })
      .populate('category')
      .populate('type')
      .sort('roomNumber');

    // Lọc phòng dựa trên trạng thái booking
    const availableRooms = [];

    for (const room of allRooms) {
      // Nếu booking đã checked-in: loại bỏ phòng đang được thuê (checked-in)
      if (booking.status === 'checked-in') {
        const checkedInBookings = await Booking.find({
          room: room._id,
          status: 'checked-in',
          _id: { $ne: booking._id }
        });

        if (checkedInBookings.length > 0) {
          // Phòng đang được thuê, bỏ qua
          continue;
        }
      }

      // Kiểm tra trùng giờ với các booking khác
      const existingBookings = await Booking.find({
        room: room._id,
        _id: { $ne: booking._id },
        status: { $in: ['pending', 'confirmed', 'checked-in', 'payment-pending'] }
      });

      // Nếu booking đã checked-in: chỉ kiểm tra trùng với booking tới (check-in sau booking hiện tại)
      // Nếu booking chưa checked-in: kiểm tra trùng với tất cả booking
      let conflictingBookings = existingBookings;

      if (booking.status === 'checked-in') {
        // Chỉ kiểm tra booking có check-in sau thời điểm hiện tại
        const now = new Date();
        conflictingBookings = existingBookings.filter(existingBooking => {
          const existingCheckIn = new Date(`${formatDateString(existingBooking.checkInDate)}T${existingBooking.checkInTime}`);
          return existingCheckIn > now;
        });
      }

      // Kiểm tra xem có booking nào trùng thời gian không
      const hasConflict = conflictingBookings.some(existingBooking => {
        const existingCheckInDate = formatDateString(existingBooking.checkInDate);
        const existingCheckOutDate = formatDateString(existingBooking.checkOutDate);

        return checkTimeOverlap(
          bookingCheckInDate, booking.checkInTime,
          bookingCheckOutDate, booking.checkOutTime,
          existingCheckInDate, existingBooking.checkInTime,
          existingCheckOutDate, existingBooking.checkOutTime
        );
      });

      if (!hasConflict) {
        // Tính giá phòng mới
        let newPrice = 0;
        if (booking.bookingType === 'hourly') {
          newPrice = (room.price?.firstHour || 0) + (room.price?.nextHour || 0) * Math.max(0, booking.hours - 1);
        } else if (booking.bookingType === 'overnight') {
          newPrice = room.price?.overnight || 0;
        } else {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
          newPrice = (room.price?.daily || 0) * days;
        }

        // Tính điểm tối ưu để sắp xếp
        let score = 0;

        // Ưu tiên phòng cùng loại (type) - điểm cao nhất
        if (room.type?._id?.toString() === booking.room.type?._id?.toString()) {
          score += 1000;
        }

        // Ưu tiên phòng cùng tầng
        if (room.floor === booking.room.floor) {
          score += 500;
        }

        // Ưu tiên phòng có giá gần nhất (chênh lệch nhỏ)
        const currentPrice = booking.roomPrice || 0;
        if (currentPrice > 0) {
          const priceDiff = Math.abs(newPrice - currentPrice);
          const priceDiffPercent = (priceDiff / currentPrice) * 100;
          // Giá càng gần càng tốt (tối đa 300 điểm)
          score += Math.max(0, 300 - priceDiffPercent * 3);
        }

        // Ưu tiên phòng Available hơn Dirty
        if (room.status === 'Available') {
          score += 100;
        } else if (room.status === 'Dirty') {
          score += 50; // Vẫn có thể dùng nhưng cần dọn
        }

        // Ưu tiên phòng cùng category
        if (room.category?._id?.toString() === booking.room.category?._id?.toString()) {
          score += 200;
        }

        availableRooms.push({
          ...room.toObject(),
          score,
          estimatedPrice: newPrice
        });
      }
    }

    // Sắp xếp theo điểm tối ưu (cao nhất trước)
    availableRooms.sort((a, b) => b.score - a.score);

    res.status(200).json(availableRooms);
  } catch (error) {
    console.error('Error fetching available rooms for change:', error);
    res.status(500).json({ message: 'Không thể tải danh sách phòng', error: error.message });
  }
};

// Đổi phòng cho booking (admin only)
export const changeRoom = async (req, res) => {
  try {
    const { newRoomId } = req.body;
    const booking = await Booking.findById(req.params.id).populate('room');

    if (!booking) {
      return res.status(404).json({ message: 'Đặt phòng không tồn tại' });
    }

    // Kiểm tra phòng mới có tồn tại không
    const newRoom = await Room.findById(newRoomId).populate('category').populate('type');
    if (!newRoom) {
      return res.status(404).json({ message: 'Phòng mới không tồn tại' });
    }

    // Format date strings đúng cách
    const formatDateString = (date) => {
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return date;
    };

    const bookingCheckInDate = formatDateString(booking.checkInDate);
    const bookingCheckOutDate = formatDateString(booking.checkOutDate);

    // Kiểm tra phòng mới có sẵn không trong khoảng thời gian booking
    let existingBookings = await Booking.find({
      room: newRoomId,
      _id: { $ne: booking._id }, // Không tính booking hiện tại
      status: { $in: ['pending', 'confirmed', 'checked-in', 'payment-pending'] }
    });

    // Nếu booking đã checked-in: chỉ kiểm tra trùng với booking tới
    if (booking.status === 'checked-in') {
      const now = new Date();
      existingBookings = existingBookings.filter(existingBooking => {
        const existingCheckIn = new Date(`${formatDateString(existingBooking.checkInDate)}T${existingBooking.checkInTime}`);
        return existingCheckIn > now;
      });

      // Kiểm tra phòng có đang được thuê không
      const checkedInBookings = await Booking.find({
        room: newRoomId,
        status: 'checked-in',
        _id: { $ne: booking._id }
      });

      if (checkedInBookings.length > 0) {
        return res.status(400).json({ message: 'Phòng mới đang được thuê. Vui lòng chọn phòng khác.' });
      }
    }

    // Kiểm tra xem có booking nào trùng thời gian không
    const hasConflict = existingBookings.some(existingBooking => {
      const existingCheckInDate = formatDateString(existingBooking.checkInDate);
      const existingCheckOutDate = formatDateString(existingBooking.checkOutDate);

      return checkTimeOverlap(
        bookingCheckInDate, booking.checkInTime,
        bookingCheckOutDate, booking.checkOutTime,
        existingCheckInDate, existingBooking.checkInTime,
        existingCheckOutDate, existingBooking.checkOutTime
      );
    });

    if (hasConflict) {
      return res.status(400).json({ message: 'Phòng mới đã được đặt trong khoảng thời gian này. Vui lòng chọn phòng khác.' });
    }

    // Lưu phòng cũ để cập nhật trạng thái
    const oldRoom = booking.room;

    // Tính toán lại giá phòng dựa trên loại booking
    let newRoomPrice = 0;
    if (booking.bookingType === 'hourly') {
      newRoomPrice = (newRoom.price?.hourly || 0) * booking.hours;
    } else if (booking.bookingType === 'overnight') {
      newRoomPrice = newRoom.price?.overnight || 0;
    } else {
      // Calculate số ngày
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      newRoomPrice = (newRoom.price?.daily || 0) * days;
    }

    // Cập nhật booking với phòng mới và giá mới
    const oldTotalPrice = booking.totalPrice;
    const oldRoomPrice = booking.roomPrice;

    booking.room = newRoomId;
    booking.roomPrice = newRoomPrice;
    booking.totalPrice = newRoomPrice + (booking.amenitiesPrice || 0) + (booking.servicesPrice || 0);

    // Kiểm tra nếu đã thanh toán một phần
    let refundAmount = 0;
    let needsRefund = false;

    if (booking.paidAmount > 0) {
      // Nếu tổng tiền mới nhỏ hơn số tiền đã thanh toán
      if (booking.totalPrice < booking.paidAmount) {
        refundAmount = booking.paidAmount - booking.totalPrice;
        needsRefund = true;
        booking.paidAmount = booking.totalPrice; // Giảm số tiền đã thanh toán về bằng tổng tiền mới
        booking.remainingAmount = 0;
        booking.paymentStatus = 'paid';
        booking.refundAmount = refundAmount; // Lưu số tiền hoàn lại
      } else {
        // Tổng tiền mới >= số tiền đã thanh toán
        booking.remainingAmount = booking.totalPrice - booking.paidAmount;

        if (booking.remainingAmount > 0) {
          booking.paymentStatus = 'partial';
        } else {
          booking.paymentStatus = 'paid';
        }
      }
    } else {
      // Chưa thanh toán gì
      booking.remainingAmount = booking.totalPrice;
      booking.paymentStatus = 'pending';
    }

    await booking.save();

    // Cập nhật trạng thái phòng cũ về Available nếu không còn booking nào khác
    const otherBookings = await Booking.find({
      room: oldRoom._id,
      _id: { $ne: booking._id },
      status: { $in: ['confirmed', 'checked-in'] }
    });

    if (otherBookings.length === 0) {
      oldRoom.status = 'Available';
      await oldRoom.save();
    }

    // Cập nhật trạng thái phòng mới
    if (booking.status === 'checked-in') {
      newRoom.status = 'Occupied';
    } else if (booking.status === 'confirmed') {
      newRoom.status = 'Occupied';
    }
    await newRoom.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'username email fullName phone')
      .populate('room')
      .populate('amenities')
      .populate('services');

    // Gửi thông báo real-time cho user
    try {
      const io = getIO();
      let message = `Phòng của bạn đã được chuyển từ ${oldRoom.roomNumber} sang ${newRoom.roomNumber}.`;

      if (needsRefund) {
        message += ` Phòng mới rẻ hơn, bạn sẽ được hoàn lại ${refundAmount.toLocaleString('vi-VN')} VND.`;
      } else if (booking.remainingAmount > 0) {
        message += ` Tổng tiền mới: ${populatedBooking.totalPrice.toLocaleString('vi-VN')} VND. Còn lại: ${booking.remainingAmount.toLocaleString('vi-VN')} VND.`;
      } else {
        message += ` Tổng tiền mới: ${populatedBooking.totalPrice.toLocaleString('vi-VN')} VND.`;
      }

      io.to(`user-${populatedBooking.user._id}`).emit('booking-updated', {
        booking: populatedBooking,
        message: message,
        type: 'room-change',
        refund: needsRefund ? refundAmount : 0
      });
    } catch (socketError) {
      console.error('Socket.IO error:', socketError);
    }

    // Trả về response với thông tin hoàn tiền nếu có
    res.status(200).json({
      ...populatedBooking.toObject(),
      refundInfo: needsRefund ? {
        refundAmount,
        message: `Khách hàng sẽ được hoàn lại ${refundAmount.toLocaleString('vi-VN')} VND do phòng mới rẻ hơn`
      } : null
    });
  } catch (error) {
    console.error('Error changing room:', error);
    res.status(500).json({ message: 'Không thể đổi phòng', error: error.message });
  }
};
