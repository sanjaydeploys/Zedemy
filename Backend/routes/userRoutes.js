const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
require('dotenv').config();

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });

router.get('/category/:category', authMiddleware, async (req, res) => {
    try {
        const users = await User.getUsersByCategory(req.params.category);
        res.json(users.map(user => ({
            userId: user.userId,
            name: user.name,
            email: user.email
        })));
    } catch (err) {
        console.error('[GET /users/category/:category] Error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
      const user = await User.getUserById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'User not found' });
      res.json({
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        followedCategories: user.followedCategories || [],
        completedPosts: user.completedPosts || []
      });
    } catch (err) {
      console.error('[GET /users/me] Error:', err.message);
      res.status(500).json({ msg: 'Server Error', error: err.message });
    }
  });
module.exports = router;