import RoomType from '../models/roomtypeModel.js';
export const createRoomType = async (req, res) => {
    const {category, name, description, maxAdults, maxChildren} = req.body;
    const roomTypeExists = await RoomType.findOne({name});
    if (roomTypeExists) {
        return res.status(400).json({ message: "Loại phòng đã tồn tại" });
    }
    const newRoomType = await RoomType.create({category, name, description, maxAdults, maxChildren});
    res.status(201).json(newRoomType);
};
export const getRoomTypes = async (req, res) => {
    const roomTypes = await RoomType.find().sort("-createdAt").populate("category");
    res.status(200).json(roomTypes);
};
export const getRoomTypeById = async (req, res) => {
    const roomType = await RoomType.findById(req.params.id).populate("category");
    if (!roomType) {
        return res.status(404).json({ message: "Loại phòng không tồn tại" });
    }
    res.status(200).json(roomType);
};
export const updateRoomType = async (req, res) => {
    const roomType = await RoomType.findById(req.params.id);
    if (!roomType) {
        return res.status(404).json({ message: "Loại phòng không tồn tại" });
    }
    if (req.body.name && req.body.name !== roomType.name) {
        const roomTypeExists = await RoomType.findOne({name: req.body.name});
        if (roomTypeExists) {
            return res.status(400).json({ message: "Loại phòng đã tồn tại" });
        }
    }
    roomType.category = req.body.category || roomType.category;
    roomType.name = req.body.name || roomType.name;
    roomType.description = req.body.description || roomType.description;
    roomType.maxAdults = req.body.maxAdults || roomType.maxAdults;
    roomType.maxChildren = req.body.maxChildren || roomType.maxChildren;
    const updatedRoomType = await roomType.save();
    res.status(200).json(updatedRoomType);
};
export const deleteRoomType = async (req, res) => {
    const roomType = await RoomType.findById(req.params.id);
    if (roomType) {
        await roomType.deleteOne();
        res.status(200).json({ message: "Loại phòng đã được xóa" });
    }
    else {
        return res.status(404).json({ message: "Loại phòng không tồn tại" });
    }
};
