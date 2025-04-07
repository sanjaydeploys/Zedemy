const { DynamoDBClient, QueryCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });

const getNotifications = async (req, res) => {
    console.log('[notificationController.getNotifications] Fetching notifications for user:', req.user.id);
    try {
        const params = {
            TableName: 'Notifications',
            IndexName: 'UserIdIndex', // Corrected from 'UserIndex' to match table GSI
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': { S: req.user.id } },
            ScanIndexForward: false // Latest first
        };
        const { Items } = await dbClient.send(new QueryCommand(params));
        if (!Items || Items.length === 0) {
            console.log('[notificationController.getNotifications] No notifications found');
            return res.json([]);
        }
        const notifications = Items.map(item => ({
            id: item.notificationId.S,
            user: item.userId.S,
            message: item.message.S,
            isRead: item.isRead.BOOL,
            date: item.createdAt.S // Use createdAt instead of date
        }));
        console.log('[notificationController.getNotifications] Notifications fetched:', notifications);
        res.json(notifications);
    } catch (error) {
        console.error('[notificationController.getNotifications] Error fetching notifications:', error);
        res.status(500).json({ message: error.message });
    }
};

const markNotificationAsRead = async (req, res) => {
    console.log('[notificationController.markNotificationAsRead] Marking notification as read:', req.params.id, 'for user:', req.user.id);
    try {
        if (!req.user || !req.user.id) {
            console.log('[notificationController.markNotificationAsRead] User ID from token is missing');
            return res.status(401).json({ message: 'User not authorized' });
        }

        const params = {
            TableName: 'Notifications',
            Key: { notificationId: { S: req.params.id } },
            UpdateExpression: 'SET isRead = :true',
            ConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':true': { BOOL: true },
                ':userId': { S: req.user.id }
            },
            ReturnValues: 'ALL_NEW'
        };

        const { Attributes } = await dbClient.send(new UpdateItemCommand(params));
        if (!Attributes) {
            console.log('[notificationController.markNotificationAsRead] Notification not found or not authorized');
            return res.status(404).json({ message: 'Notification not found or not authorized' });
        }

        const updatedNotification = {
            id: Attributes.notificationId.S,
            user: Attributes.userId.S,
            message: Attributes.message.S,
            isRead: Attributes.isRead.BOOL,
            date: Attributes.createdAt.S
        };
        console.log('[notificationController.markNotificationAsRead] Notification updated:', updatedNotification);
        res.json(updatedNotification);
    } catch (error) {
        console.error('[notificationController.markNotificationAsRead] Error marking notification as read:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNotifications, markNotificationAsRead };