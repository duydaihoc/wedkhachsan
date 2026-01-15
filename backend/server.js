import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import connectDB from "./config/db.js";
import { initializeSocket } from "./socket.js";
import userRoutes from "./routes/userRoutes.js";
import roomcategoryRoutes from "./routes/roomcategoryRoutes.js";
import roomtypeRoutes from "./routes/roomtypeRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import amenityRoutes from "./routes/amenityRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
dotenv.config();
connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Tạo HTTP server từ Express app
const httpServer = createServer(app);

// Khởi tạo Socket.IO
initializeSocket(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/users", userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/roomcategories', roomcategoryRoutes);
app.use('/api/roomtypes', roomtypeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.IO is ready for connections`);
});

export default app;