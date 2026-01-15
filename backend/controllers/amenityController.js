import Amenity from '../models/amenityModel.js';
export const createAmenity = async (req, res) => {
    const {name, description, price, isAvailable, image} = req.body;
    const amenityExists = await Amenity.findOne({name});
    if (amenityExists) {
        return res.status(400).json({ message: "Tiện ích đã tồn tại" });
    }
    const newAmenity = await Amenity.create({name, description, price, isAvailable, image: image || ''});
    res.status(201).json(newAmenity);
};
export const getAmenities = async (req, res) => {
    const amenities = await Amenity.find().sort("-createdAt");
    res.status(200).json(amenities);
};
export const getAmenityById = async (req, res) => {
    const amenity = await Amenity.findById(req.params.id);
    if (!amenity) {
        return res.status(404).json({ message: "Tiện ích không tồn tại" });
    }
    res.status(200).json(amenity);
};
export const updateAmenity = async (req, res) => {
    const amenity = await Amenity.findById(req.params.id);
    if (!amenity) {
        return res.status(404).json({ message: "Tiện ích không tồn tại" });
    }
    if (req.body.name && req.body.name !== amenity.name) {
        const amenityExists = await Amenity.findOne({name: req.body.name});
        if (amenityExists) {
            return res.status(400).json({ message: "Tiện ích đã tồn tại" });
        }
    }
    amenity.name = req.body.name || amenity.name;
    amenity.description = req.body.description !== undefined ? req.body.description : amenity.description;
    amenity.price = req.body.price !== undefined ? req.body.price : amenity.price;
    amenity.image = req.body.image !== undefined ? req.body.image : amenity.image;
    amenity.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : amenity.isAvailable;
    const updatedAmenity = await amenity.save();
    res.status(200).json(updatedAmenity);
};
export const deleteAmenity = async (req, res) => {
    const amenity = await Amenity.findById(req.params.id);
    if (amenity) {
        await amenity.deleteOne();
        res.status(200).json({ message: "Tiện ích đã được xóa" });
    }
    else {
        return res.status(404).json({ message: "Tiện ích không tồn tại" });
    }
};