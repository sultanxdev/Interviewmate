const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

// ─── Register ─────────────────────────────────────────────────────────────────

const register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }

    const existing = await User.findOne({ email });
    if (existing) {
        throw new ApiError(409, 'An account with this email already exists');
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
        email,
        password: hashed,
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
    });

    const token = signToken(user._id);

    res.status(201).json({
        success: true,
        token,
        user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar || null,
            role: user.role,
        },
    });
});

// ─── Login ────────────────────────────────────────────────────────────────────

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password');
    }

    const token = signToken(user._id);

    res.status(200).json({
        success: true,
        token,
        user: {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar || null,
            role: user.role,
        },
    });
});

// ─── Get Current User (Protected) ─────────────────────────────────────────────

const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            _id: req.user._id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            avatar: req.user.avatar || null,
            role: req.user.role,
        },
    });
});

module.exports = { register, login, getMe };
