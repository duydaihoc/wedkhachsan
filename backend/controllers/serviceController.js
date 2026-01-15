import Service from '../models/serviceModel.js';
export const createService = async (req, res) => {
    const {name, price, unit, type, description, image, isAvailable} = req.body;
    const serviceExists = await Service.findOne({name});
    if (serviceExists) {
        return res.status(400).json({ message: "Dịch vụ đã tồn tại" });
    }
    const newService = await Service.create({name, price, unit, type, description, image, isAvailable});
    res.status(201).json(newService);
};
export const getServices = async (req, res) => {
    const services = await Service.find().sort("-createdAt");
    res.status(200).json(services);
};
export const getServiceById = async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
        return res.status(404).json({ message: "Dịch vụ không tồn tại" });
    }
    res.status(200).json(service);
};
export const updateService = async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
        return res.status(404).json({ message: "Dịch vụ không tồn tại" });
    }
    if (req.body.name && req.body.name !== service.name) {
        const serviceExists = await Service.findOne({name: req.body.name});
        if (serviceExists) {
            return res.status(400).json({ message: "Dịch vụ đã tồn tại" });
        }
    }
    service.name = req.body.name || service.name;
    service.price = req.body.price || service.price;
    service.unit = req.body.unit || service.unit;
    service.type = req.body.type || service.type;
    service.description = req.body.description !== undefined ? req.body.description : service.description;
    service.image = req.body.image !== undefined ? req.body.image : service.image;
    service.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : service.isAvailable;
    const updatedService = await service.save();
    res.status(200).json({ message: "Dịch vụ đã được cập nhật", service: updatedService });
};
export const deleteService = async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
        return res.status(404).json({ message: "Dịch vụ không tồn tại" });
    }
    await service.deleteOne();
    res.status(200).json({ message: "Dịch vụ đã được xóa" });
};