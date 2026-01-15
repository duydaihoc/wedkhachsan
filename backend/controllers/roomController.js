import Room from '../models/roomModel.js';

export const createRoom = async (req, res) => {
    const { roomNumber, floor, category, type, amenities, price, status, note, image, images } = req.body;
    
    const roomExists = await Room.findOne({ roomNumber });
    if (roomExists) {
        return res.status(400).json({ message: "Số phòng đã tồn tại" });
    }

    // Xử lý ảnh đại diện
    let thumbnailImage = image || '';
    // Nếu có upload ảnh đại diện qua req.files['image'] (multer.fields)
    if (req.files && req.files['image'] && req.files['image'].length > 0) {
        thumbnailImage = `/uploads/${req.files['image'][0].filename}`;
    }

    // Xử lý ảnh chi tiết
    let detailImages = images || [];
    // Nếu có upload nhiều ảnh chi tiết qua req.files['images'] (multer.fields)
    if (req.files && req.files['images'] && req.files['images'].length > 0) {
        const filePaths = req.files['images'].map(file => `/uploads/${file.filename}`);
        detailImages = [...detailImages, ...filePaths];
    }

    const newRoom = await Room.create({
        roomNumber,
        floor: floor || '1',
        category,
        type,
        amenities: amenities || [],
        price: {
            firstHour: price?.firstHour || 0,
            nextHour: price?.nextHour || 0,
            overnight: price?.overnight || 0,
            daily: price?.daily || 0
        },
        status: status || 'Available',
        note: note || '',
        image: thumbnailImage,
        images: detailImages
    });

    const populatedRoom = await Room.findById(newRoom._id)
        .populate('category')
        .populate('type')
        .populate('amenities');

    res.status(201).json(populatedRoom);
};

export const getRooms = async (req, res) => {
    const rooms = await Room.find()
        .populate('category')
        .populate('type')
        .populate('amenities')
        .sort("-createdAt");
    res.status(200).json(rooms);
};

export const getRoomById = async (req, res) => {
    const room = await Room.findById(req.params.id)
        .populate('category')
        .populate('type')
        .populate('amenities');
    
    if (!room) {
        return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    res.status(200).json(room);
};

export const updateRoom = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
        const roomExists = await Room.findOne({ roomNumber: req.body.roomNumber });
        if (roomExists) {
            return res.status(400).json({ message: "Số phòng đã tồn tại" });
        }
    }

    room.roomNumber = req.body.roomNumber || room.roomNumber;
    room.floor = req.body.floor !== undefined ? req.body.floor : room.floor;
    room.category = req.body.category || room.category;
    room.type = req.body.type || room.type;
    room.amenities = req.body.amenities !== undefined ? req.body.amenities : room.amenities;
    
    if (req.body.price) {
        room.price.firstHour = req.body.price.firstHour !== undefined ? req.body.price.firstHour : room.price.firstHour;
        room.price.nextHour = req.body.price.nextHour !== undefined ? req.body.price.nextHour : room.price.nextHour;
        room.price.overnight = req.body.price.overnight !== undefined ? req.body.price.overnight : room.price.overnight;
        room.price.daily = req.body.price.daily !== undefined ? req.body.price.daily : room.price.daily;
    }

    room.status = req.body.status !== undefined ? req.body.status : room.status;
    room.note = req.body.note !== undefined ? req.body.note : room.note;
    
    // Xử lý ảnh đại diện
    if (req.body.image !== undefined) {
        room.image = req.body.image;
    }
    // Nếu có upload ảnh đại diện mới qua req.files['image'] (multer.fields)
    if (req.files && req.files['image'] && req.files['image'].length > 0) {
        room.image = `/uploads/${req.files['image'][0].filename}`;
    }
    
    // Xử lý ảnh chi tiết
    let updatedImages = req.body.images !== undefined ? req.body.images : room.images;
    // Nếu có upload nhiều ảnh chi tiết qua req.files['images'] (multer.fields)
    if (req.files && req.files['images'] && req.files['images'].length > 0) {
        const filePaths = req.files['images'].map(file => `/uploads/${file.filename}`);
        // Nếu có ảnh mới upload, thêm vào mảng ảnh hiện tại
        updatedImages = Array.isArray(updatedImages) 
            ? [...updatedImages, ...filePaths]
            : [...filePaths];
    }
    room.images = updatedImages;

    const updatedRoom = await room.save();
    
    const populatedRoom = await Room.findById(updatedRoom._id)
        .populate('category')
        .populate('type')
        .populate('amenities');

    res.status(200).json(populatedRoom);
};

export const deleteRoom = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    await room.deleteOne();
    res.status(200).json({ message: "Phòng đã được xóa" });
};

