import {uploadImage, uploadMultipleImages} from '../controllers/uploadController.js';
import upload from '../middleware/uploadMiddleware.js';
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
const router = express.Router();

// Chỉ cho admin
router.route('/').post(protect, admin, upload.single('image'), uploadImage); 
router.route('/multiple').post(protect, admin, upload.array('images', 10), uploadMultipleImages);
export default router;
