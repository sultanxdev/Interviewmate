const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    avatar: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
