import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // 1. Thông tin đăng nhập
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true,
    trim: true,
    minlength: 3
  },

  // --- MỚI THÊM EMAIL VÀO ĐÂY ---
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true, // Không được trùng email
    lowercase: true, // Tự động chuyển thành chữ thường
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng nhập đúng định dạng email (VD: abc@gmail.com)'
    ]
  },

  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: 6,
  },

  // 2. Phân quyền (Admin vs Nhân viên)
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  },

  // 3. Thông tin cá nhân
  fullName: {
    type: String,
    default: ''
  },

  phone: {
    type: String,
    default: ''
  },
  
  // Trạng thái (True: Đang làm việc | False: Đã nghỉ/Bị khóa)
  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true 
});

// =======================================================
// MIDDLEWARE & METHODS
// =======================================================

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Kiểm tra mật khẩu khi đăng nhập
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;