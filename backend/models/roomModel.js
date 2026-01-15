import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  // =========================================================
  // 1. ĐỊNH DANH CƠ BẢN
  // =========================================================
  roomNumber: { 
    type: String, 
    required: [true, 'Vui lòng nhập số phòng'], 
    unique: true, // Không trùng (VD: 101, 102)
    trim: true
  },

  floor: {
    type: String,
    required: [true, 'Vui lòng nhập số tầng'], // VD: "Tầng 1", "Lầu 2"
    default: '1'
  },

  // =========================================================
  // 2. LIÊN KẾT (RELATIONSHIPS) - Theo yêu cầu của bạn
  // =========================================================
  
  // A. Hạng phòng (Cha - VD: Hạng Sang)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomCategory',
    required: [true, 'Phòng này thuộc hạng mục nào?']
  },

  // B. Loại phòng (Con - VD: Giường Đôi)
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: [true, 'Phòng này thuộc loại nào?']
  },

  // C. Tiện ích RIÊNG (Specific Amenities)
  // Các tiện ích có sẵn TRONG PHÒNG này (Tivi, Tủ lạnh...)
  // Lưu ý: "Dịch vụ" (Mì, Nước) không nằm ở đây, mà nằm ở Booking khi khách gọi.
  amenities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Amenity'
  }],

  // =========================================================
  // 3. BẢNG GIÁ NIÊM YẾT (QUAN TRỌNG)
  // =========================================================
  price: {
    // Giá giờ đầu (Tàu nhanh) - VD: 80k
    firstHour: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    
    // Giá các giờ tiếp theo - VD: 20k/giờ
    // (Logic: Tổng tiền = firstHour + (số giờ thêm * nextHour))
    nextHour: { 
      type: Number, 
      required: true, 
      default: 0 
    },

    // Giá qua đêm (Thường từ 21h - 12h hôm sau) - VD: 250k
    overnight: { 
      type: Number, 
      required: true, 
      default: 0 
    },

    // Giá theo ngày (24h) - VD: 400k
    daily: { 
      type: Number, 
      required: true, 
      default: 0 
    }
  },

  // =========================================================
  // 4. TRẠNG THÁI VẬN HÀNH
  // =========================================================
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Dirty', 'Maintenance'],
    default: 'Available'
  },
  // Available: Trống (Màu Xanh) - Sẵn sàng đón khách
  // Occupied:  Đang có khách (Màu Đỏ)
  // Dirty:     Bẩn (Màu Xám) - Khách vừa trả, chưa dọn xong
  // Maintenance: Bảo trì (Màu Vàng) - Hỏng hóc

  // Ghi chú nội bộ (VD: "Máy lạnh hơi ồn", "Cửa sổ kẹt")
  note: {
    type: String,
    default: ''
  },
  
  // =========================================================
  // 5. HÌNH ẢNH PHÒNG
  // =========================================================
  
  // Ảnh đại diện của phòng (1 ảnh chính)
  // Đường dẫn tương đối (VD: "/uploads/room-thumbnail-1234567890.jpg")
  // Hiển thị trong danh sách phòng, card phòng
  image: {
    type: String,
    default: ''
  },
  
  // Mảng các ảnh chi tiết của phòng (nhiều ảnh)
  // Mỗi phần tử là object với {url: String, category: String, label: String}
  // Hiển thị trong trang chi tiết phòng, gallery theo từng khu vực
  images: {
    type: [{
      url: {
        type: String,
        required: true
      },
      category: {
        type: String,
        enum: ['living_room', 'bedroom', 'bathroom', 'other'],
        default: 'other'
      },
      label: {
        type: String,
        default: ''
      }
    }],
    default: []
  }

}, { timestamps: true });

export default mongoose.model('Room', roomSchema);