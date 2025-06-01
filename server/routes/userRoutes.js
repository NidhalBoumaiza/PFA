import express from "express";
import {
  getUsers,
  getAllUsersAdmin,
  createUser,
  updateUser,
  deleteUser,
  register,
  login,
  purgeDeletedUsers,
  getAvailableUsers,
  getUserById,
  toggleTeamLeaderTaskPermission,
} from "../controllers/userController.js";
import { auth, adminAuth } from "../middleware/auth.js";
import { uploadUserPicture } from "../middleware/upload.js";

const router = express.Router();

// Auth routes
router.post("/register", uploadUserPicture, register);
router.post("/login", login);

// Get all active users
router.get("/", getUsers);

// Admin only - get all users including deleted ones
router.get("/all", auth, adminAuth, getAllUsersAdmin);

// Admin only - permanently delete soft-deleted users
router.delete("/purge", auth, adminAuth, purgeDeletedUsers);

// Admin only - toggle team leader's permission to manage tasks
router.put(
  "/toggle-task-permission/:userId",
  auth,
  adminAuth,
  toggleTeamLeaderTaskPermission
);

// Get users without teams (available users) - MUST BE BEFORE /:id
router.get("/available", auth, getAvailableUsers);

// Create a new user with optional profile picture
router.post("/", uploadUserPicture, createUser);

// Get a specific user
router.get("/:id", getUserById);

// Update a user with optional profile picture
router.put("/:id", uploadUserPicture, updateUser);

// Delete a user (soft delete)
router.delete("/:id", deleteUser);

export default router;
