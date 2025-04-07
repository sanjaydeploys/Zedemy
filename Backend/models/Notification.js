const { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });

class Notification {
    static async createNotification({ notificationId, userId, message, isRead = false }) {
        console.log('[Notification.createNotification] Creating notification:', { notificationId, userId, message });
        const params = {
            TableName: 'Notifications',
            Item: {
                notificationId: { S: notificationId },
                userId: { S: userId },
                message: { S: message },
                isRead: { BOOL: isRead },
                createdAt: { S: new Date().toISOString() }
            }
        };
        try {
            await dbClient.send(new PutItemCommand(params));
            console.log('[Notification.createNotification] Notification created successfully');
        } catch (error) {
            console.error('[Notification.createNotification] Error creating notification:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    static async getNotificationById(notificationId) {
        const params = {
            TableName: 'Notifications',
            Key: { notificationId: { S: notificationId } }
        };
        const { Item } = await dbClient.send(new GetItemCommand(params));
        if (!Item) return null;
        return {
            notificationId: Item.notificationId.S,
            userId: Item.userId.S,
            message: Item.message.S,
            isRead: Item.isRead.BOOL,
            createdAt: Item.createdAt ? Item.createdAt.S : null
        };
    }
}

module.exports = Notification;