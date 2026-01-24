import jwt from 'jsonwebtoken';

/**
 * WebSocket Authentication Middleware
 * Verifies JWT token from socket handshake
 */
export default (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user ID to socket
        socket.userId = decoded.userId;

        next();
    } catch (error) {
        console.error('WebSocket auth error:', error);
        next(new Error('Invalid or expired token'));
    }
};
