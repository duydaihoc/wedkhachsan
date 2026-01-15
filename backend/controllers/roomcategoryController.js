import RoomCategory from '../models/roomcategoryModel.js';
export const createRoomCategory = async (req, res) => {
    const { name, description, image } = req.body;
    const roomCategoryExists = await RoomCategory.findOne({ name });
    if (roomCategoryExists) {
        return res.status(400).json({ message: "Danh mục phòng đã tồn tại" });
    }
    const newRoomCategory = await RoomCategory.create({ name, description, image, isActive: true });
    res.status(201).json(newRoomCategory);
};
export const getRoomCategories = async (req, res) => {
    const roomCategories = await RoomCategory.find().sort("-createdAt");
    res.status(200).json(roomCategories);
};
export const getRoomCategoryById = async (req, res) => {
    const roomCategory = await RoomCategory.findById(req.params.id);
    if (!roomCategory) {
        return res.status(404).json({ message: "Danh mục phòng không tồn tại" });
    }
    res.status(200).json(roomCategory);
};
export const updateRoomCategory = async (req, res) => {
    const roomCategory = await RoomCategory.findById(req.params.id);
    if (!roomCategory) {
        return res.status(404).json({ message: "Danh mục phòng không tồn tại" });
    }
    
    // Kiểm tra tên trùng nếu có thay đổi tên
    if (req.body.name && req.body.name !== roomCategory.name) {
        const roomCategoryExists = await RoomCategory.findOne({ name: req.body.name });
        if (roomCategoryExists) {
            return res.status(400).json({ message: "Danh mục phòng đã tồn tại" });
        }
    }
    
    // Cập nhật các trường
    roomCategory.name = req.body.name || roomCategory.name;
    roomCategory.description = req.body.description !== undefined ? req.body.description : roomCategory.description;
    roomCategory.image = req.body.image !== undefined ? req.body.image : roomCategory.image;
    roomCategory.isActive = req.body.isActive !== undefined ? req.body.isActive : roomCategory.isActive;
    
    const updatedRoomCategory = await roomCategory.save();
    res.status(200).json(updatedRoomCategory);
};
export const deleteRoomCategory = async (req, res) => {
    const roomCategory = await RoomCategory.findById(req.params.id);
    if (roomCategory){
        await roomCategory.deleteOne();
        res.status(200).json({ message: "Danh mục phòng đã được xóa" });
    }
    else {
        return res.status(404).json({ message: "Danh mục phòng không tồn tại" });
    }
};