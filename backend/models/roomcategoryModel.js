import mongoose from 'mongoose';

const roomCategorySchema = new mongoose.Schema({
  // 1. Tên danh mục (Giống tên Hãng)
  // VD: "Hạng Sang (Luxury)", "Hạng Phổ Thông (Standard)"
  name: { 
    type: String, 
    required: [true, 'Vui lòng nhập tên danh mục phòng'], 
    unique: true, // Tên không được trùng
    trim: true 
  },

  // 2. Mô tả ngắn gọn
  // VD: "Các phòng có diện tích lớn, view biển và bao gồm ăn sáng"
  description: {
    type: String,
    default: ''
  },

  // 3. Hình ảnh đại diện cho nhóm này
  image: {
    type: String, // Lưu đường dẫn ảnh
    default: ''
  },
  
  // 4. Trạng thái (Hiện/Ẩn)
  // Nếu false -> Không hiện nhóm này khi khách chọn phòng
  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

export default mongoose.model('RoomCategory', roomCategorySchema);