import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  // 1. Tên dịch vụ
  // VD: "Buffet Sáng", "Giặt ủi thường", "Dọn phòng theo yêu cầu"
  name: { 
    type: String, 
    required: [true, 'Vui lòng nhập tên dịch vụ'], 
    unique: true, 
    trim: true 
  },

  // 2. Giá tiền
  // VD: Buffet 100k, Giặt ủi 20k, Dọn phòng 50k
  price: { 
    type: Number, 
    required: [true, 'Vui lòng nhập giá dịch vụ'],
    default: 0 
  },

  // 3. Đơn vị tính (Cực kỳ quan trọng cho loại dịch vụ này)
  // VD: "suất" (bữa sáng), "kg" (giặt), "lần" (dọn phòng)
  unit: {
    type: String,
    required: true,
    default: 'lần' 
  },

  // 4. Phân loại (Đã cập nhật theo yêu cầu của bạn)
  type: {
    type: String,
    enum: [
      'food',      // Ăn uống (Bữa sáng, Cơm trưa)
      'laundry',   // Giặt là
      'cleaning',  // Dọn dẹp
      'transport', // Xe đưa đón
      'other'      // Khác (Massage, Spa...)
    ], 
    default: 'food'
  },

  // 5. Hình ảnh minh họa
  image: {
    type: String,
    default: ''
  },

  // 6. Trạng thái (Có đang phục vụ không?)
  // VD: Bếp nghỉ thì tắt dịch vụ Buffet sáng đi
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Mô tả chi tiết (VD: "Bao gồm ủi phẳng", "Từ 6h sáng đến 9h sáng")
  description: {
    type: String,
    default: ''
  }

}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);