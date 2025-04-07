const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    console.log('Entering auth middleware');
    const token = req.header('x-auth-token');
    console.log(`Token received: ${token ? 'Yes' : 'No'}`);
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        console.log('Verifying JWT token...');
        const decoded = jwt.verify(token, jwtSecret);
        console.log('Token verified successfully');
        console.log(`Decoded user: ${JSON.stringify(decoded.user)}`);

        console.log(`Fetching user with ID: ${decoded.user.id}`);
        const user = await User.getUserById(decoded.user.id);
        if (!user) {
            console.log('User not found in database');
            return res.status(401).json({ message: 'User no longer exists' });
        }
        console.log(`User found: ${JSON.stringify(user)}`);

        req.user = decoded.user;
                console.log('Proceeding to next middleware');
        next();
    } catch (error) {
        console.error(`Error in auth middleware: ${error.message}`, error.stack);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token is not valid' });
        }
        res.status(500).json({ message: 'Server error during authentication' });
    }
};

const isAdmin = async (req, res, next) => {
    console.log('Entering isAdmin middleware');
    try {
        console.log(`Fetching user with ID: ${req.user.userId} for admin check`);
        const user = await User.getUserById(req.user.userId);
        if (!user || user.role !== 'admin') { // Use role directly from req.user
            console.log('User is not an admin');
            return res.status(403).json({ message: 'Admin access required' });
        }
        console.log('User is admin, proceeding');
        next();
    } catch (error) {
        console.error(`Error in isAdmin middleware: ${error.message}`, error.stack);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports.isAdmin = isAdmin;