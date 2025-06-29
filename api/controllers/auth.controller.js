import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";

// Register a new user
export const register = async (req, res) => {
  const userData = req.body.userData || {};
  try {
    // Check if user already exists

    const existingUser = await User.findOne({ $or: [ { username: userData.username }, { email: userData.email } ] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.username === userData.username ? "Username already exists!" : "Email already exists!"
      });
    }
    // Hash the password using SHA256
    const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');

    // Handle avatar upload to Cloudinary if present and is base64
    let avatarUrl = undefined;
    if (userData.avatar && typeof userData.avatar === 'string' && userData.avatar.startsWith('data:image/')) {
      try {
        const uploadRes = await cloudinary.uploader.upload(userData.avatar, {
          folder: 'user-avatars',
          resource_type: 'image',
        });
        avatarUrl = uploadRes.secure_url;
      } catch (err) {
        // keep error for cloudinary upload
        console.error('[REGISTER] Cloudinary avatar upload error:', err);
      }
    }

    // Create the user
    const newUser = await User.create({
      ...userData,
      avatar: avatarUrl !== undefined ? avatarUrl : undefined, // Only store Cloudinary URL if uploaded, else undefined
      password: hashedPassword
    });
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET_KEY
    );
    // Remove password from user object
    const userObj = newUser.toObject();
    delete userObj.password;
    res.status(201).json({
      success: true,
      message: "User created successfully!",
      user: userObj,
      token
    });
  } catch (err) {
    // error creating user
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Login a user
export const login = async (req, res) => {
  // Accept both { userData: { ... } } and direct fields in body
  const userData = req.body.userData || req.body;
  const { email, username, password } = userData;
  try {
    if (!email && !username) {
      return res.status(400).json({ success: false, message: "Email or username is required" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }
    let user;
    if (email && username) {
      user = await User.findOne({ $or: [ { email }, { username } ] });
    } else if (email) {
      user = await User.findOne({ email });
    } else if (username) {
      user = await User.findOne({ username });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedPassword !== user.password) {
      return res.status(401).json({ success: false, message: "wrong password" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY
    );
    // Remove password from user object
    const userObj = user.toObject();
    delete userObj.password;
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: userObj,
      token
    });
  } catch (err) {
    // error logging in
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Logout a user
export const logout = (req, res) => {
  res.status(200).json({ message: "Logout Successful!" });
};
