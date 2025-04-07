const express = require('express');
const router = express.Router();
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { UpdateItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

router.post('/follow-category', authMiddleware, async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) return res.status(400).json({ msg: 'Category is required' });

        const followedCategories = await User.followCategory(req.user.id, category);
        res.json(followedCategories);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/unfollow-category', authMiddleware, async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) return res.status(400).json({ msg: 'Category is required' });

        const followedCategories = await User.unfollowCategory(req.user.id, category);
        res.json(followedCategories);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/', authMiddleware, async (req, res) => {
    console.log('[GET /notifications] Fetching notifications for user:', req.user.id);
    try {
        const params = {
            TableName: 'Notifications',
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': { S: req.user.id } },
            ScanIndexForward: false
        };
        console.log('[GET /notifications] Querying DynamoDB with params:', params);
        const { Items } = await dbClient.send(new QueryCommand(params));
        if (!Items || Items.length === 0) {
            console.log('[GET /notifications] No notifications found for user:', req.user.id);
            return res.json([]);
        }
        const notifications = Items.map(item => ({
            notificationId: item.notificationId.S,
            userId: item.userId.S,
            message: item.message.S,
            isRead: item.isRead.BOOL,
            createdAt: item.createdAt ? item.createdAt.S : null
        }));
        console.log('[GET /notifications] Notifications fetched:', notifications);
        res.json(notifications);
    } catch (err) {
        console.error('[GET /notifications] Error fetching notifications:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).send('Server Error');
    }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        const params = {
            TableName: 'Notifications',
            Key: { notificationId: { S: req.params.id } },
            UpdateExpression: 'SET isRead = :true',
            ExpressionAttributeValues: { ':true': { BOOL: true } },
            ReturnValues: 'ALL_NEW'
        };
        const { Attributes } = await dbClient.send(new UpdateItemCommand(params));
        if (!Attributes) return res.status(404).json({ msg: 'Notification not found' });
        res.json({
            notificationId: Attributes.notificationId.S,
            userId: Attributes.userId.S,
            message: Attributes.message.S,
            isRead: Attributes.isRead.BOOL,
            createdAt: Attributes.createdAt ? Attributes.createdAt.S : null
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/followed-categories', authMiddleware, async (req, res) => {
    console.log('[GET /followed-categories] Fetching followed categories for user:', req.user.id);
    try {
        const user = await User.getUserById(req.user.id);
        if (!user) {
            console.log('[GET /followed-categories] User not found:', req.user.id);
            return res.status(404).json({ msg: 'User not found' });
        }
        const followedCategories = user.followedCategories || [];
        console.log('[GET /followed-categories] Followed categories:', followedCategories);
        res.json(followedCategories);
    } catch (err) {
        console.error('[GET /followed-categories] Server Error:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).send('Server Error');
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { userId, message } = req.body;
        if (!userId || !message) return res.status(400).json({ msg: 'userId and message are required' });

        const notificationId = uuidv4();
        await Notification.createNotification({ notificationId, userId, message });
        res.status(201).json({ notificationId, userId, message, isRead: false });
    } catch (err) {
        console.error('Error adding notification:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;