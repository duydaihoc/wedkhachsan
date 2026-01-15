import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // =========================================================
  // 1. THÔNG TIN ĐẶT PHÒNG
  // =========================================================
  bookingCode: {
    type: String,
    unique: true,
    trim: true
    // Không required vì sẽ được tự động tạo trong pre('save') hook
  },

  // Người đặt phòng
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng đăng nhập để đặt phòng']
  },

  // Phòng được đặt
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Vui lòng chọn phòng']
  },

  // Loại thuê: hourly, overnight, daily
  bookingType: {
    type: String,
    enum: ['hourly', 'overnight', 'daily'],
    required: true
  },

  // Ngày giờ nhận phòng
  checkInDate: {
    type: Date,
    required: true
  },
  checkInTime: {
    type: String, // Format: "HH:mm"
    required: true
  },

  // Ngày giờ trả phòng
  checkOutDate: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: String, // Format: "HH:mm"
    required: true
  },

  // Số giờ (nếu bookingType = 'hourly')
  hours: {
    type: Number,
    default: 1
  },

  // Số khách
  adults: {
    type: Number,
    default: 1
  },
  children: {
    type: Number,
    default: 0
  },

  // =========================================================
  // 2. TIỆN ÍCH VÀ DỊCH VỤ
  // =========================================================
  amenities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Amenity'
  }],

  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],

  // =========================================================
  // 3. THANH TOÁN
  // =========================================================
  // Tổng tiền phòng
  roomPrice: {
    type: Number,
    required: true,
    default: 0
  },

  // Tổng tiền tiện ích
  amenitiesPrice: {
    type: Number,
    default: 0
  },

  // Tổng tiền dịch vụ
  servicesPrice: {
    type: Number,
    default: 0
  },

  // Tổng tiền
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },

  // Phương thức thanh toán
  paymentMethod: {
    type: String,
    enum: ['cash', 'online'],
    default: 'cash'
  },

  // Số tiền đã thanh toán
  paidAmount: {
    type: Number,
    default: 0
  },

  // Số tiền còn lại
  remainingAmount: {
    type: Number,
    default: 0
  },

  // Trạng thái thanh toán
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },

  // Ngày thanh toán
  paymentDate: {
    type: Date
  },

  // =========================================================
  // 4. TRẠNG THÁI ĐẶT PHÒNG
  // =========================================================
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'completed', 'cancelled'],
    default: 'pending'
  },

  // Ghi chú
  note: {
    type: String,
    default: ''
  }

}, { timestamps: true });

// Tạo mã đặt phòng tự động trước khi save
bookingSchema.pre('save', async function(next) {
  // Chỉ tạo bookingCode nếu document mới và chưa có code
  if (this.isNew && !this.bookingCode) {
    let code;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Tạo code duy nhất
    while (exists && attempts < maxAttempts) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
      const random = Math.floor(1000 + Math.random() * 9000);
      code = `BOOK-${dateStr}-${timeStr}-${random}`;
      
      // Kiểm tra code đã tồn tại chưa
      const existingBooking = await mongoose.models.Booking?.findOne({ bookingCode: code });
      if (!existingBooking) {
        exists = false;
      }
      attempts++;
    }
    
    if (exists) {
      // Nếu không tạo được code duy nhất sau maxAttempts lần, dùng timestamp + random
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      code = `BOOK-${timestamp}-${random}`;
    }
    
    this.bookingCode = code;
  }
  
  if (typeof next === 'function') {
    next();
  }
});

export default mongoose.model('Booking', bookingSchema);
