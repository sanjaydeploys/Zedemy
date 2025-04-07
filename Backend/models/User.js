const { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const region = process.env.AWS_REGION2;
if (!region) {
    console.error('AWS_REGION is not set in .env file. User operations will fail.');
    throw new Error('AWS_REGION is missing');
}
console.log(`User.js: Using AWS region: ${region}`);
const dbClient = new DynamoDBClient({ region });

class User {
    static async createUser({ userId, name, email, password = '', role = 'user', googleId, policyAccepted = false }) {
        console.log(`Creating user with userId: ${userId}, email: ${email}`);
        const params = {
            TableName: 'Users',
            Item: {
                userId: { S: userId },
                name: { S: name },
                email: { S: email },
                password: { S: password },
                role: { S: role },
                policyAccepted: { BOOL: policyAccepted },
                completedPosts: { L: [] }
            }
        };
        if (googleId) params.Item.googleId = { S: googleId };
        try {
            console.log('Sending PutItemCommand to DynamoDB...');
            await dbClient.send(new PutItemCommand(params));
            console.log('User created successfully in DynamoDB');
        } catch (error) {
            console.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    static async getUserById(userId) {
        console.log(`Fetching user by userId: ${userId}, type: ${typeof userId}`);
        const params = {
            TableName: 'Users',
            Key: { userId: { S: userId } }
        };
        try {
            console.log('Sending GetItemCommand to DynamoDB with params:', JSON.stringify(params));
            const { Item } = await dbClient.send(new GetItemCommand(params));
            if (!Item) {
                console.log(`No user found for userId: ${userId}`);
                return null;
            }
            console.log(`Raw DynamoDB Item: ${JSON.stringify(Item)}`);
            return {
                userId: Item.userId.S,
                name: Item.name.S,
                email: Item.email.S,
                role: Item.role.S,
                googleId: Item.googleId ? Item.googleId.S : null,
                policyAccepted: Item.policyAccepted ? Item.policyAccepted.BOOL : false,
                completedPosts: Item.completedPosts ? Item.completedPosts.L.map(item => item.S) : [],
                followedCategories: Item.followedCategories && Item.followedCategories.S ? Item.followedCategories.S.split(',').filter(cat => cat) : []
            };
        } catch (error) {
            console.error(`Error fetching user by ID: ${error.message}`, error.stack);
            throw error;
        }
    }

    static async getUserByEmail(email) {
        console.log(`Fetching user by email: ${email}`);
        const params = {
            TableName: 'Users',
            IndexName: 'EmailIndex',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': { S: email } }
        };
        try {
            console.log('Sending QueryCommand to DynamoDB...');
            const { Items } = await dbClient.send(new QueryCommand(params));
            if (Items.length === 0) {
                console.log(`No user found with email: ${email}`);
                return null;
            }
            const Item = Items[0];
            return {
                userId: Item.userId.S,
                name: Item.name.S,
                email: Item.email.S,
                password: Item.password.S,
                role: Item.role.S,
                googleId: Item.googleId ? Item.googleId.S : null,
                policyAccepted: Item.policyAccepted ? Item.policyAccepted.BOOL : false,
                completedPosts: Item.completedPosts ? Item.completedPosts.L.map(item => item.S) : [],
                followedCategories: Item.followedCategories && Item.followedCategories.S ? Item.followedCategories.S.split(',').filter(cat => cat) : []
            };
        } catch (error) {
            console.error(`Error fetching user by email: ${error.message}`);
            throw error;
        }
    }

    static async getUserByGoogleId(googleId) {
        console.log(`Fetching user by googleId: ${googleId}`);
        const params = {
            TableName: 'Users',
            IndexName: 'GoogleIdIndex',
            KeyConditionExpression: 'googleId = :googleId',
            ExpressionAttributeValues: { ':googleId': { S: googleId } }
        };
        try {
            console.log('Sending QueryCommand to DynamoDB...');
            const { Items } = await dbClient.send(new QueryCommand(params));
            if (!Items || Items.length === 0) return null;
            const Item = Items[0];
            return {
                userId: Item.userId.S,
                name: Item.name.S,
                email: Item.email.S,
                role: Item.role.S,
                googleId: Item.googleId ? Item.googleId.S : null,
                policyAccepted: Item.policyAccepted ? Item.policyAccepted.BOOL : false,
                completedPosts: Item.completedPosts ? Item.completedPosts.L.map(item => item.S) : [],
                followedCategories: Item.followedCategories && Item.followedCategories.S ? Item.followedCategories.S.split(',').filter(cat => cat) : []
            };
        } catch (error) {
            console.error(`Error fetching user by googleId: ${error.message}`);
            throw error;
        }
    }

    static async acceptPolicy(userId) {
        console.log(`Updating policy acceptance for userId: ${userId}`);
        const params = {
            TableName: 'Users',
            Key: { userId: { S: userId } },
            UpdateExpression: 'SET policyAccepted = :true',
            ExpressionAttributeValues: { ':true': { BOOL: true } }
        };
        try {
            console.log('Sending UpdateItemCommand to DynamoDB...');
            await dbClient.send(new UpdateItemCommand(params));
            console.log('Policy acceptance updated successfully');
        } catch (error) {
            console.error(`Error updating policy acceptance: ${error.message}`);
            throw error;
        }
    }

    static async markPostCompleted(userId, postId) {
        const currentCompletedPosts = await User.getCompletedPosts(userId);
        if (currentCompletedPosts.includes(postId)) return currentCompletedPosts;

        const params = {
            TableName: 'Users',
            Key: { userId: { S: userId } },
            UpdateExpression: 'SET completedPosts = list_append(if_not_exists(completedPosts, :emptyList), :postId)',
            ExpressionAttributeValues: {
                ':postId': { L: [{ S: postId }] },
                ':emptyList': { L: [] }
            },
            ReturnValues: 'ALL_NEW'
        };
        const { Attributes } = await dbClient.send(new UpdateItemCommand(params));
        return Attributes.completedPosts ? Attributes.completedPosts.L.map(item => item.S) : [];
    }

    static async getCompletedPosts(userId) {
        const params = {
            TableName: 'Users',
            Key: { userId: { S: userId } },
            ProjectionExpression: 'completedPosts'
        };
        const { Item } = await dbClient.send(new GetItemCommand(params));
        return Item && Item.completedPosts ? Item.completedPosts.L.map(item => item.S) : [];
    }

 

    static async followCategory(userId, category) {
        const user = await User.getUserById(userId);
        if (!user) throw new Error('User not found');
        const categories = user.followedCategories || [];
        if (categories.includes(category)) return categories;

        const newCategories = [...categories, category];
        const params = {
            TableName: 'Users',
            Key: { userId: { S: userId } },
            UpdateExpression: 'SET followedCategories = :newCategories, followedCategoriesTimestamp = :timestamp',
            ExpressionAttributeValues: {
                ':newCategories': { S: newCategories.join(',') },
                ':timestamp': { S: new Date().toISOString() }
            },
            ReturnValues: 'ALL_NEW'
        };
        const { Attributes } = await dbClient.send(new UpdateItemCommand(params));
        return Attributes.followedCategories.S.split(',').filter(cat => cat);
    }

    static async unfollowCategory(userId, category) {
        const user = await User.getUserById(userId);
        if (!user) throw new Error('User not found');
        const categories = user.followedCategories || [];
        if (!categories.includes(category)) return categories;

        const newCategories = categories.filter(cat => cat !== category);
        const params = {
            TableName: 'Users',
            Key: { userId: { S: userId } },
            ReturnValues: 'ALL_NEW'
        };
        if (newCategories.length === 0) {
            params.UpdateExpression = 'REMOVE followedCategories';
        } else {
            params.UpdateExpression = 'SET followedCategories = :newCategories, followedCategoriesTimestamp = :timestamp';
            params.ExpressionAttributeValues = {
                ':newCategories': { S: newCategories.join(',') },
                ':timestamp': { S: new Date().toISOString() }
            };
        }
        const { Attributes } = await dbClient.send(new UpdateItemCommand(params));
        return Attributes && Attributes.followedCategories && Attributes.followedCategories.S
            ? Attributes.followedCategories.S.split(',').filter(cat => cat)
            : [];
    }

    static async getUsersByCategory(category) {
        console.log('[getUsersByCategory] Fetching users following category:', category);
        const params = {
            TableName: 'Users',
            FilterExpression: 'contains(followedCategories, :category)',
            ExpressionAttributeValues: { ':category': { S: category } }
        };
        try {
            console.log('[getUsersByCategory] Scanning DynamoDB with params:', params);
            const { Items } = await dbClient.send(new ScanCommand(params));
            const users = Items.map(item => ({
                userId: item.userId.S,
                email: item.email.S,
                name: item.name.S,
                followedCategories: item.followedCategories && item.followedCategories.S ? item.followedCategories.S.split(',').filter(cat => cat) : []
            }));
            console.log('[getUsersByCategory] Users found:', users);
            return users;
        } catch (error) {
            console.error('[getUsersByCategory] Error fetching users by category:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = User;