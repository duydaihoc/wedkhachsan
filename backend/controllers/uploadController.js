export const uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
    }
    res.status(201).json({ imagePath: `/uploads/${req.file.filename}` });
}

export const uploadMultipleImages = (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Vui lòng chọn ít nhất một file ảnh' });
    }
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
    res.status(201).json({ imagePaths });
}
