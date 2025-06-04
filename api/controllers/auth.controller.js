import bcrypt from "bcryptjs";
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
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    console.log('✅ Login successful for:', user.email);
    console.log('🔑 Generated JWT token for user ID:', user.id);

    // Return user data and token
    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      token: token,
      createdAt: user.createdAt,
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
