const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const passport = require('passport');
require('../config/passport');

console.log('Setting up auth routes...');
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], (req, res) => {
    console.log('Received POST request to /register');
    authController.register(req, res);
});

router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], (req, res) => {
    console.log('Received POST request to /login');
    authController.login(req, res);
});

router.get('/google', (req, res, next) => {
    console.log('Received GET request to /google');
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }), 
    (req, res) => {
        console.log('Google OAuth callback executed');
        const token = req.user.token;
        console.log(`Redirecting with token: ${token}`);
        res.redirect(`https://learnandshare.vercel.app/dashboard?user=${encodeURIComponent(JSON.stringify(req.user))}&token=${token}`);
    }
);

router.post('/accept-policy', authMiddleware, (req, res) => {
    console.log('Received POST request to /accept-policy');
    authController.acceptPolicy(req, res);
});

router.get('/user', authMiddleware, (req, res) => {
    console.log('Received GET request to /user');
    authController.getAuthenticatedUser(req, res);
});

console.log('Auth routes setup complete');

module.exports = router;