import mongoose from 'mongoose';

const restaurantTableSchema = new mongoose.Schema({
    // ==========================================
    // 1. ĐỊNH DANH BÀN
    // ==========================================
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên/số bàn'],
        unique: true, // Không trùng tên (VD: Bàn 01, VIP 1...)
        trim: true
    },

    // ==========================================
    // 2. SỨC CHỨA (Quan trọng để xếp bàn)
    // ==========================================
    capacity: {
        type: Number,
        required: [true, 'Bàn này ngồi được mấy người?'],
        default: 4
    },
    // VD: 2 (Bàn đôi), 4 (Gia đình), 10 (Tiệc)

    // ==========================================
    // 3. VỊ TRÍ (Để khách chọn view)
    // ==========================================
    location: {
        type: String,
        enum: ['MainHall', 'Garden', 'Rooftop', 'VIP_Room', 'Window'],
        default: 'MainHall'
    },

    // ==========================================
    // 4. TRẠNG THÁI THỰC TẾ (Real-time)
    // ==========================================
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
        default: 'Available'
    },
    // Available: Trống (Màu Xanh)
    // Occupied: Đang có khách ngồi (Màu Đỏ)
    // Reserved: Đã đặt, khách chưa tới (Màu Vàng - Nhấp nháy)
    // Maintenance: Hỏng/Gãy chân (Màu Xám)

    // ==========================================
    // 5. LIÊN KẾT NHANH (Optional)
    // ==========================================
    // Lưu ID của đơn đặt bàn đang ngồi tại đây (nếu có)
    // Giúp Admin click vào bàn là hiện ngay tên khách đang ăn
    currentReservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TableReservation',
        default: null
    },

    description: { type: String } // Mô tả thêm (VD: "Gần loa nhạc", "Góc yên tĩnh")

}, { timestamps: true });

export default mongoose.model('RestaurantTable', restaurantTableSchema);