import User from "../models/userModel.js";
import generateToken from "../ultis/generateToken.js";
import bcrypt from "bcryptjs";
export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "không được bỏ trống email, username hoặc password" });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "Email đã tồn tại" });
    }
    const user = await User.create({ username, email, password });
    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        return res.status(400).json({ message: "dữ liệu người dùng không hợp lệ" });
    }
};
export const authUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "không được bỏ trống email hoặc password" });
    }
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }
};
export const getUser = async (req, res) => {
    const { search } = req.query;
    let query = { isAdmin: false };
    
    // Nếu có search query, tìm kiếm theo tên, email, phone
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }
    
    const users = await User.find(query).select("-password").sort("-createdAt").limit(20);
    res.status(200).json(users);
};
export const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (user) {
        res.status(200).json(user);
    } else {
        return res.status(404).json({ message: "người dùng không tồn tại" });
    }
};
export const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if(!user) {
        return res.status(404).json({ message: "không tìm thấy người dùng" });
    }
    if (req.body.email && req.body.email !== user.email) {
        const userExists = await User.findOne({ email: req.body.email });
        if (userExists && userExists._id.toString() !== user._id.toString()) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }
    }
    if (user) {
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.fullName = req.body.fullName || user.fullName;
        user.phone = req.body.phone || user.phone;
        user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;
        user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;
        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } else {
        return res.status(404).json({ message: "không tìm thấy người dùng " });
    }
};
export const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
        await user.deleteOne();
        res.status(200).json({ message: "người dùng đã được xóa" });
    } else {
        return res.status(404).json({ message: "không tìm thấy người dùng" });
    }
};
export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
        res.status(200).json(user);
    } else {
        return res.status(404).json({ message: "không tìm thấy người dùng" });
    }
};
export const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if(!user) {
        return res.status(404).json({ message: "không tìm thấy người dùng" });
    }
    if (req.body.email && req.body.email !== user.email) {
        const userExists = await User.findOne({ email: req.body.email });
        if (userExists && userExists._id.toString() !== user._id.toString()) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }
    }
    if (user) {
        const updateData = {
            username: req.body.username || user.username,
            email: req.body.email || user.email,
            fullName: req.body.fullName !== undefined ? req.body.fullName : user.fullName,
            phone: req.body.phone !== undefined ? req.body.phone : user.phone
        };
        
        // Chỉ hash password nếu có thay đổi và có currentPassword
        if (req.body.password) {
            // Kiểm tra mật khẩu hiện tại nếu có yêu cầu đổi mật khẩu
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: "Vui lòng nhập mật khẩu hiện tại" });
            }
            
            // Kiểm tra mật khẩu hiện tại có đúng không
            const isPasswordMatch = await user.matchPassword(req.body.currentPassword);
            if (!isPasswordMatch) {
                return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
            }
            
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");
        
        res.status(200).json(updatedUser);
    }
    else {
        return res.status(404).json({ message: "không tìm thấy người dùng" });
    }
};