const { DynamoDBClient, ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });
const Post = require('../models/Post');
const { v4: uuidv4 } = require('uuid');

const getPosts = async (req, res) => {
    try {
        const { Items } = await dbClient.send(new ScanCommand({ TableName: 'Posts' }));
        res.json(Items.map(Post.fromDynamoDB));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPostBySlug = async (req, res) => {
    try {
        const { Items } = await dbClient.send(new QueryCommand({
            TableName: 'Posts',
            IndexName: 'SlugIndex',
            KeyConditionExpression: 'slug = :slug',
            ExpressionAttributeValues: { ':slug': { S: req.params.slug } }
        }));
        if (!Items.length) return res.status(404).json({ message: 'Post not found' });
        res.json(Post.fromDynamoDB(Items[0]));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPostsByCategory = async (req, res) => {
    try {
        const { Items } = await dbClient.send(new QueryCommand({
            TableName: 'Posts',
            IndexName: 'CategoryIndex',
            KeyConditionExpression: 'category = :category',
            ExpressionAttributeValues: { ':category': { S: req.query.category } }
        }));
        res.json(Items.map(Post.fromDynamoDB));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserPosts = async (req, res) => {
    try {
        const { Items } = await dbClient.send(new QueryCommand({
            TableName: 'Posts',
            IndexName: 'AuthorIndex',
            KeyConditionExpression: 'author = :author',
            ExpressionAttributeValues: { ':author': { S: req.user.name } },
            ScanIndexForward: false
        }));
        res.json(Items.map(Post.fromDynamoDB));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPost = async (req) => {
    try {
        const { title, content, category, date, titleImage, titleVideo, summary, subtitles, superTitles } = req.body;
        if (!title || !content || !category) {
            throw new Error("Title, Content, and Category are required!");
        }

        const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        const postId = uuidv4();

        const newPost = await Post.createPost({
            postId,
            title,
            content,
            category,
            slug,
            author: req.user?.name || "Anonymous",
            date: date || new Date().toISOString(),
            titleImage,
            titleVideo,
            summary,
            subtitles,
            superTitles
        });

        console.log('[createPost] Post created successfully:', newPost);
        return newPost; // Return the post object for further processing in postRoutes.js
    } catch (error) {
        console.error("❌ Error creating post:", error);
        throw error;
    }
};

const searchPosts = async (req, res) => {
    if (!req.query.query) return res.status(400).json({ message: 'Search query is required' });
    try {
        const { Items } = await dbClient.send(new ScanCommand({
            TableName: 'Posts',
            FilterExpression: 'contains(title, :query) OR contains(content, :query)',
            ExpressionAttributeValues: { ':query': { S: req.query.query } }
        }));
        res.json(Items.map(Post.fromDynamoDB));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPosts, getPostsByCategory, getPostBySlug, getUserPosts, createPost, searchPosts };