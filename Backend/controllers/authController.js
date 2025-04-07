const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/auth');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
    console.log('Entering register function');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(`Validation errors: ${JSON.stringify(errors.array())}`);
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;
    console.log(`Registering user: ${email}`);

    try {
        console.log(`Checking if user exists with email: ${email}`);
        let user = await User.getUserByEmail(email);
        if (user) {
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString();
        console.log(`Generated userId: ${userId}`);

        console.log('Creating user in DynamoDB...');
        await User.createUser({ userId, name, email, password: hashedPassword, role: role || 'user' });
        console.log('User created successfully');

        const payload = { user: { id: userId, name, email, role: role || 'user' } };
        console.log(`Generating JWT with payload: ${JSON.stringify(payload)}`);
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
        console.log(`JWT generated: ${token}`);

        console.log('Sending response with token');
        res.json({ token, user: payload.user });
    } catch (error) {
        console.error(`Error in register: ${error.message}`);
        res.status(500).send('Server Error');
    }
};

const login = async (req, res) => {
    console.log('Entering login function');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(`Validation errors: ${JSON.stringify(errors.array())}`);
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    try {
        console.log(`Fetching user with email: ${email}`);
        const user = await User.getUserByEmail(email);
        if (!user) {
            console.log('User not found');
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log(`User found: ${user.userId}`);

        console.log('Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password); // Use user.password directly
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        console.log('Password matched');

        const payload = {
            user: {
                id: user.userId, // Use user.userId directly
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
        console.log(`Generating JWT with payload: ${JSON.stringify(payload)}`);
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
        console.log(`JWT generated: ${token}`);

        console.log('Sending response with token');
        res.json({ token, user: payload.user });
    } catch (error) {
        console.error(`Error in login: ${error.message}`);
        res.status(500).send('Server Error');
    }
};

const acceptPolicy = async (req, res) => {
    console.log('Entering acceptPolicy function');
    try {
        const userId = req.user.id;
        console.log(`Accepting policy for userId: ${userId}`);
        await User.acceptPolicy(userId);
        console.log('Policy accepted successfully');
        res.status(200).json({ message: 'Policy accepted successfully' });
    } catch (error) {
        console.error(`Error in acceptPolicy: ${error.message}`);
        res.status(500).send('Server Error');
    }
};

const getAuthenticatedUser = async (req, res) => {
    console.log('Entering getAuthenticatedUser function');
    try {
        console.log(`Fetching user with ID: ${req.user.id}`);
        const user = await User.getUserById(req.user.id);
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(`User retrieved: ${user.userId}`);
        const userData = {
            id: user.userId, // Use user.userId directly
            name: user.name,
            email: user.email,
            role: user.role
        };
        console.log(`Sending user data: ${JSON.stringify(userData)}`);
        res.json(userData);
    } catch (error) {
        console.error(`Error in getAuthenticatedUser: ${error.message}`);
        res.status(500).send('Server Error');
    }
};

module.exports = { register, login, acceptPolicy, getAuthenticatedUser };