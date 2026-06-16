require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const ApiError = require('./utils/ApiError');
const vapiInterviewRouter = require('./routes/vapiInterviewRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vapi-interview', vapiInterviewRouter);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'InterviewMate API is running...' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
    }

    console.error("Internal Server Error:", err);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
