import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema({
  // 1. Tên tiện ích
  // VD: "Giường phụ (Extra Bed)", "Máy chơi game PS5", "Tủ lạnh mini"
  name: { 
    type: String, 
    required: [true, 'Vui lòng nhập tên tiện ích'], 
    unique: true,
    trim: true 
  },

  // 2. Hình ảnh minh họa
  image: {
    type: String,
    default: ''
  },

  // 3. Giá tiền
  // Ý nghĩa tùy bạn quy định:
  // - Có thể là giá thuê thêm (VD: Giường phụ 100k/đêm)
  // - Có thể là giá đền bù nếu khách làm hỏng (VD: Vỡ cốc đền 50k)
  price: { 
    type: Number, 
    required: true,
    default: 0 // Nếu = 0 thì là miễn phí (VD: Wifi, Điều hòa)
  },

  // Trạng thái (Còn dùng được hay đang hỏng/hết)
  isAvailable: {
    type: Boolean,
    default: true
  },

  // Mô tả thêm
  description: {
    type: String
  }

}, { timestamps: true });

export default mongoose.model('Amenity', amenitySchema);