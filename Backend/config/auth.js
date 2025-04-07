module.exports = {
    jwtSecret: process.env.JWT_SECRET || process.env.JWT_SECRET2 // Fallback to secondary secret if primary isn't available
};