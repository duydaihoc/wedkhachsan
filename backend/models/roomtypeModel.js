import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema({
  // 1. LIÊN KẾT DANH MỤC (Cha)
  // VD: Thuộc hạng "VIP" hay hạng "Thường"
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomCategory', 
    required: [true, 'Vui lòng chọn danh mục']
  },

  // 2. Tên loại phòng (Con)
  // VD: "VIP 1 Giường", "VIP 2 Giường", "Giường Tròn"
  name: { 
    type: String, 
    required: [true, 'Vui lòng nhập tên loại phòng'], 
    trim: true
  },

  // 3. Sức chứa (Để lễ tân biết phòng này cho ở mấy người)
  maxAdults: { 
    type: Number, 
    default: 2 
  },
  maxChildren: { 
    type: Number, 
    default: 1 
  },

  // Mô tả thêm (nếu cần ghi chú nội bộ)
  description: { 
    type: String 
  }

}, { timestamps: true });

// Ngăn chặn trùng tên trong cùng 1 danh mục
// VD: Trong danh mục VIP, không được có 2 loại tên là "Giường Đôi"
roomTypeSchema.index({ category: 1, name: 1 }, { unique: true });

export default mongoose.model('RoomType', roomTypeSchema);