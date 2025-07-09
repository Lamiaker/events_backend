const { PrismaClient } = require("@prisma/client");
const { generateToken } = require("../utils/jwt.util");
const { hashPassword, comparePassword } = require("../utils/bcrypt.util");
const { revokeToken } = require("../utils/jwt.util");

const prisma = new PrismaClient();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phone,
      wilaya,
      role,
      businessName,
      address,
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        phone,
        wilaya,
        role,
        businessName: role === "PROVIDER" ? businessName : null,
        address: role === "PROVIDER" ? address : null,
        isValid: role === "USER", // Users are valid by default, providers need admin validation
      },
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS seulement en production
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
      path: "/",
      // Ajoutez si vous utilisez un proxy
      // proxy: true,
      // sameSite: 'none' si vous avez besoin de cross-site
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isValid: user.isValid,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if provider is validated
    if (user.role === "PROVIDER" && !user.isValid) {
      return res
        .status(401)
        .json({ message: "Account not yet validated by admin" });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS seulement en production
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
      path: "/",
      // Ajoutez si vous utilisez un proxy
      // proxy: true,
      // sameSite: 'none' si vous avez besoin de cross-site
    });

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isValid: user.isValid,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private

const logout = async (req, res) => {
  const token = req.cookies.token;
  if (token) {
    revokeToken(token);
  }

  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        wilaya: true,
        role: true,
        businessName: true,
        address: true,
        isValid: true,
        createdAt: true,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, logout, getProfile };
