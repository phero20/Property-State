import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    console.log('📝 Registration attempt:', { username, email });

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.username === username ? "Username already exists!" : "Email already exists!" 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    console.log('✅ User created successfully:', newUser.username);

    res.status(201).json({ 
      message: "User created successfully!",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: "Failed to create user!" });
  }
};

export const login = async (req, res) => {
  try {
    // Check if database is connected
    try {
      const dbTest = await prisma.user.count();
      console.log('✅ Database connection verified:', dbTest, 'users found');
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return res.status(500).json({ message: "Database connection error" });
    }
    
    const { email, username, password } = req.body;
    
    // Check if we have either email or username
    if (!email && !username) {
      return res.status(400).json({ message: "Email or username is required" });
    }

    console.log('🔐 Login attempt with:', email ? `email: ${email}` : `username: ${username}`);
    
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: email } : {},
          username ? { username: username } : {}
        ]
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    console.log('✅ Login successful for:', user.email);
    console.log('🔑 Generated JWT token for user ID:', user.id);

    // Set token as cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data and token
    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      token: token,
      createdAt: user.createdAt,
      fullName: user.fullName || user.username
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const logout = (req, res) => {
  console.log('👋 User logout');
  res
    .clearCookie("token")
    .status(200)
    .json({ message: "Logout Successful!" });
};
