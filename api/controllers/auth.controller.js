import bcrypt from "bcrypt";
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
  const { username, password } = req.body;

  try {
    console.log('🔐 Login attempt:', username);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials!" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Credentials!" });
    }

    // Generate JWT token
    const age = 1000 * 60 * 60 * 24 * 7; // 1 week
    const token = jwt.sign(
      {
        id: user.id,
        isAdmin: false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;

    console.log('✅ Login successful:', user.username);

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      })
      .status(200)
      .json({
        message: "Login successful!",
        user: userInfo
      });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: "Failed to login!" });
  }
};

export const logout = (req, res) => {
  console.log('👋 User logout');
  res
    .clearCookie("token")
    .status(200)
    .json({ message: "Logout Successful!" });
};
