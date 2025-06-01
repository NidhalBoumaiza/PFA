import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Task from "../models/Task.js";
import Equipment from "../models/Equipment.js";

export const getUsers = async (req, res) => {
  try {
    // Only return non-deleted users and include virtual fields
    const users = await User.find({ isDeleted: false }).populate(
      "teamId"
    );
    // Convert to JSON to include virtuals, then parse back to ensure profilePictureUrl is included
    const usersWithVirtuals = users.map((user) => user.toJSON());
    res.json(usersWithVirtuals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users including deleted ones (admin only)
export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().populate("teamId");
    // Convert to JSON to include virtuals
    const usersWithVirtuals = users.map((user) => user.toJSON());
    res.json(usersWithVirtuals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    // Handle profile picture upload
    if (req.file) {
      req.body.profilePicture = req.file.filename;
    }

    const user = new User(req.body);
    const savedUser = await user.save();
    // Return user with virtual fields included
    res.status(201).json(savedUser.toJSON());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    // Handle profile picture upload
    if (req.file) {
      req.body.profilePicture = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    // Return user with virtual fields included
    res.json(updatedUser.toJSON());
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Soft delete a user (mark as deleted)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find user to be marked as deleted
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mark user as deleted
    user.isDeleted = true;
    await user.save();

    // Clear user assignment from tasks
    await Task.updateMany(
      { assignedTo: userId },
      { $unset: { assignedTo: "" } }
    );

    // Clear user assignment from equipment
    await Equipment.updateMany(
      { assignedTo: userId },
      { $unset: { assignedTo: "" }, status: "available" }
    );

    res.json({
      message: "User marked as deleted and all assignments cleared",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Permanently delete soft-deleted users
export const purgeDeletedUsers = async (req, res) => {
  try {
    const result = await User.deleteMany({ isDeleted: true });
    res.json({
      message: "Permanently deleted users",
      count: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle profile picture upload
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: "user",
      phone,
    };

    if (req.file) {
      userData.profilePicture = req.file.filename;
    }

    // Create new user
    const user = new User(userData);
    const savedUser = await user.save();

    // Create token
    const token = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        profilePictureUrl: savedUser.profilePictureUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and is not deleted
    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        teamId: user.teamId,
        canManageTasks: user.canManageTasks,
        avatar: user.avatar,
        profilePictureUrl: user.profilePictureUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available users (without teams)
export const getAvailableUsers = async (req, res) => {
  try {
    // Find users who are not admins, not deleted, and don't have a teamId
    const availableUsers = await User.find({
      role: { $ne: "admin" },
      isDeleted: false,
      $or: [{ teamId: { $exists: false } }, { teamId: null }],
    }).select("_id name email phone role avatar profilePicture");

    // Convert to JSON to include virtuals
    const usersWithVirtuals = availableUsers.map((user) =>
      user.toJSON()
    );
    res.json(usersWithVirtuals);
  } catch (error) {
    console.error("Error in getAvailableUsers:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Return user with virtual fields included
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle team leader's permission to manage tasks (admin only)
export const toggleTeamLeaderTaskPermission = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify this is a team leader
    if (user.role !== "team_leader") {
      return res.status(400).json({
        message: "This action can only be performed on team leaders",
      });
    }

    // Toggle the permission
    user.canManageTasks = !user.canManageTasks;
    await user.save();

    res.json({
      message: `Team leader's task management permission ${
        user.canManageTasks ? "enabled" : "disabled"
      }`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        teamId: user.teamId,
        canManageTasks: user.canManageTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
