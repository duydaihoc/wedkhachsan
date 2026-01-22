import RestaurantTable from "../models/restaurantTableModel.js";
export const createTable = async (req, res) => {
    const { name, capacity, location, description } = req.body;
    const existingTable = await RestaurantTable.findOne({ name });
    if (existingTable) {
        return res.status(400).json({ success: false, message: "Bàn đã tồn tại" });
    }
    const table = await RestaurantTable.create({ name, capacity, location, description });
    res.status(201).json({ success: true, data: table });
}
export const updateTable = async (req, res) => {
    const { name, capacity, location, description } = req.body;
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) {
        return res.status(404).json({ success: false, message: "Bàn không tồn tại" });
    }
    const existingTable = await RestaurantTable.findOne({ name });
    if (existingTable) {
        return res.status(400).json({ success: false, message: "Bàn đã tồn tại" });
    }
    table.name = name || table.name;
    table.capacity = capacity || table.capacity;
    table.location = location || table.location;
    table.description = description || table.description;
    await table.save();
    res.status(200).json({ success: true, data: table });
}
export const deleteTable = async (req, res) => {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) {
        return res.status(404).json({ success: false, message: "Bàn không tồn tại" });
    }
    await table.deleteOne();
    res.status(200).json({ success: true, message: "Bàn đã được xóa" });
}
export const getTables = async (req, res) => {
    const tables = await RestaurantTable.find();
    res.status(200).json({ success: true, data: tables });
}
export const getTableById = async (req, res) => {
    const table = await RestaurantTable.findById(req.params.id);
    if (!table) {
        return res.status(404).json({ success: false, message: "Bàn không tồn tại" });
    }
    res.status(200).json({ success: true, data: table });
}
