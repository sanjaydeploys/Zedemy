const { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });

class Certificate {
    static async createCertificate({ certificateId, userId, category, uniqueId, filePath }) {
        console.log('[Certificate.createCertificate] Creating certificate:', { certificateId, userId, category, uniqueId, filePath });
        const params = {
            TableName: 'Certificates',
            Item: {
                certificateId: { S: certificateId },
                userId: { S: userId },
                category: { S: category },
                uniqueId: { S: uniqueId },
                filePath: { S: filePath },
                createdAt: { S: new Date().toISOString() }
            }
        };
        try {
            await dbClient.send(new PutItemCommand(params));
            console.log('[Certificate.createCertificate] Certificate created successfully');
        } catch (error) {
            console.error('[Certificate.createCertificate] Error creating certificate:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    static async getCertificateById(certificateId) {
        const params = {
            TableName: 'Certificates',
            Key: { certificateId: { S: certificateId } }
        };
        const { Item } = await dbClient.send(new GetItemCommand(params));
        if (!Item) return null;
        return {
            certificateId: Item.certificateId.S,
            userId: Item.userId.S,
            category: Item.category.S,
            uniqueId: Item.uniqueId.S,
            filePath: Item.filePath.S,
            createdAt: Item.createdAt.S
        };
    }

    static async getCertificateByUniqueId(uniqueId) {
        const params = {
            TableName: 'Certificates',
            IndexName: 'UniqueIdIndex',
            KeyConditionExpression: 'uniqueId = :uniqueId',
            ExpressionAttributeValues: { ':uniqueId': { S: uniqueId } }
        };
        const { Items } = await dbClient.send(new QueryCommand(params));
        if (!Items || Items.length === 0) return null;
        const Item = Items[0];
        return {
            certificateId: Item.certificateId.S,
            userId: Item.userId.S,
            category: Item.category.S,
            uniqueId: Item.uniqueId.S,
            filePath: Item.filePath.S,
            createdAt: Item.createdAt.S
        };
    }
}

module.exports = Certificate;