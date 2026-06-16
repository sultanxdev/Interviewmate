const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const auth = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        throw new ApiError(401, 'Unauthorized: No token provided');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new ApiError(401, 'Unauthorized: Invalid or expired token');
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    req.user = user;
    next();
});

module.exports = auth;
