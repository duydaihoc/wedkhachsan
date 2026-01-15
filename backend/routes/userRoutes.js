import express from "express";
import { registerUser, authUser, getUser, getUserById, updateUser, deleteUser, getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
const router = express.Router();
//cho user lẫn admin đều có thể đăng nhập
router.route("/").post(registerUser).get(getUser);
router.route("/auth").post(authUser);
//cho user
router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile);
//cho admin
router.route("/:id").get(protect, admin, getUserById).put(protect, admin, updateUser).delete(protect, admin, deleteUser);
export default router;