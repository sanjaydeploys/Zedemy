const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand, QueryCommand, PutItemCommand, BatchGetItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const request = require('request');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');
require('dotenv').config();

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });
const s3 = new S3Client({ region: process.env.AWS_REGION2 });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    }
});

const generateCertificatePDF = (user, category) => {
    const uniqueId = uuidv4();
    const certificateId = uuidv4();
    const formattedDate = new Date().toISOString().split('T')[0];
    const userName = user.name.replace(/\s+/g, '_');
    const fileName = `certificates/${userName}_${category}_${formattedDate}_${uniqueId}.pdf`;
    const bucket = process.env.S3_BUCKET || 'sanjaybasket';

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 20 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            const s3Params = {
                Bucket: bucket,
                Key: fileName,
                Body: buffer,
                ContentType: 'application/pdf',
                ACL: 'public-read'
            };

            try {
                console.log('[generateCertificatePDF] Uploading certificate to S3:', s3Params.Key);
                await s3.send(new PutObjectCommand(s3Params));
                const filePath = `https://${bucket}.s3.${process.env.AWS_REGION2}.amazonaws.com/${fileName}`;
                console.log('[generateCertificatePDF] Certificate uploaded to S3:', filePath);

                await Certificate.createCertificate({
                    certificateId,
                    userId: user.id,
                    category,
                    uniqueId,
                    filePath
                });
                console.log('[generateCertificatePDF] Certificate saved in DynamoDB:', filePath);

                resolve({ filePath, uniqueId });
            } catch (error) {
                console.error('[generateCertificatePDF] Error uploading to S3 or saving to DynamoDB:', error);
                reject(error);
            }
        });
        doc.on('error', err => reject(err));

        request.get('https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/background-certificate-HogwartsEdx.jpg', { encoding: null }, (err, res, body) => {
            if (err) return reject(err);
            doc.image(body, 0, 0, { width: doc.page.width, height: doc.page.height });
            doc.save().rect(10, 10, doc.page.width - 20, doc.page.height - 20).lineWidth(5).strokeColor('#FFD700').stroke().restore();
            doc.registerFont('HarryP', path.join(__dirname, '..', 'uploads', 'fonts', 'HARRYP__.TTF'));
            doc.fontSize(60).font('HarryP').fillColor('#000000').text('Certificate of Completion', { align: 'center', underline: true }).moveDown(0.8);
            doc.fontSize(28).font('HarryP').fillColor('#000000').text('This certifies that', { align: 'center' }).moveDown(0.5);
            doc.fontSize(40).font('HarryP').fillColor('#000000').text(user.name, { align: 'center', underline: true }).moveDown(0.5);
            doc.fontSize(28).font('HarryP').fillColor('#000000').text('has successfully completed all modules in the', { align: 'center' }).moveDown(0.5);
            doc.fontSize(40).font('HarryP').fillColor('#000000').text(category, { align: 'center', underline: true }).moveDown(0.5);
            doc.fontSize(24).font('HarryP').fillColor('#000000').text(`Category on ${new Date().toLocaleDateString()}`, { align: 'center' }).moveDown(0.5);
            doc.fontSize(20).font('HarryP').fillColor('#000000').text('The bearer of this certificate has demonstrated proficiency', { align: 'center' }).moveDown(0.5);
            doc.fontSize(20).font('HarryP').fillColor('#000000').text('in the magical arts of technology through completion', { align: 'center' }).moveDown(0.5);
            doc.fontSize(20).font('HarryP').fillColor('#000000').text('of courses at HogwartsEdx.', { align: 'center' }).moveDown(0.5);

            const signatureX = doc.page.width - 250;
            const signatureY = doc.page.height - 100;
            doc.fontSize(13).font('HarryP').fillColor('#000000').text('Sanjay Patidar', signatureX, signatureY).moveUp(0.5);
            doc.fontSize(11).font('HarryP').fillColor('#000000').text('Founder: HogwartsEdx', signatureX, signatureY + 15);

            request.get('https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/signature.png', { encoding: null }, (err, res, body) => {
                if (err) return reject(err);
                doc.image(body, signatureX, signatureY + 40, { width: 100, height: 50 }).opacity(1);
                const verifyLinkX = doc.page.width / 2;
                const verifyLinkY = doc.page.height - 60;
                doc.fontSize(14).font('HarryP').fillColor('#000000').text(`Verify certificate: /${uniqueId}`, {
                    align: 'center',
                    link: `https://learnandshare.vercel.app/verify/${uniqueId}`,
                    continued: true
                }).moveTo(verifyLinkX, verifyLinkY).text('.', { continued: true }).text('.', { continued: true }).text('.', { continued: true }).moveDown(1);
                doc.end();
            });
        });
    });
};

router.get('/', postController.getPosts);
router.get('/post/:slug', postController.getPostBySlug);
router.get('/search', postController.searchPosts);
router.get('/user', authMiddleware, postController.getUserPosts);
router.get('/userposts', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.user.id;
      const { Items } = await dbClient.send(new QueryCommand({
        TableName: 'Posts',
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': { S: userId } },
      }));
      const posts = Items.map(item => ({
        postId: item.postId.S,
        userId: item.userId.S,
        title: item.title.S,
        slug: item.slug.S,
        content: item.content.S,
        category: item.category.S,
      }));
      res.json(posts);
    } catch (err) {
      console.error('[GET /user] Error:', err);
      res.status(500).json({ msg: 'Server Error' });
    }
  });
router.post('/', [
    authMiddleware,
    [
        check('title', 'Title is required').not().isEmpty(),
        check('content', 'Content is required').not().isEmpty(),
        check('subtitles', 'Subtitles must be an array').isArray(),
        check('superTitles', 'Super titles must be an array').isArray()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('[POST /] Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log('[POST /] Creating post with data:', req.body);
        const post = await postController.createPost(req);
        if (!post) {
            console.log('[POST /] Post creation failed or returned null');
            return res.status(500).json({ msg: 'Post creation failed' });
        }

        const category = post.category;
        const postCreatedAt = new Date().toISOString();
        console.log('[POST /] Post created, notifying users for category:', category);

        const users = await User.getUsersByCategory(category);
        console.log('[POST /] Users following category:', users.map(u => ({ userId: u.userId, email: u.email })));

        if (!users || users.length === 0) {
            console.log('[POST /] No users found to notify for category:', category);
        } else {
            for (const user of users) {
                const userData = await User.getUserById(user.userId);
                const followedAt = userData.followedCategories && userData.followedCategories.includes(category)
                    ? (await dbClient.send(new GetItemCommand({
                        TableName: 'Users',
                        Key: { userId: { S: user.userId } },
                        ProjectionExpression: 'followedCategoriesTimestamp'
                      }))).Item?.followedCategoriesTimestamp?.S || '1970-01-01T00:00:00Z'
                    : '1970-01-01T00:00:00Z';

                if (new Date(followedAt) > new Date(postCreatedAt)) {
                    console.log(`[POST /] Skipping notification for user ${user.userId} - followed category after post creation`);
                    continue;
                }

                const notificationId = uuidv4();
                const message = `A new post "${post.title}" has been added to the ${category} category!`;
                await Notification.createNotification({
                    notificationId,
                    userId: user.userId,
                    message
                });
                console.log('[POST /] Notification created for user:', user.userId);

                const mailOptions = {
                    from: process.env.EMAIL_ADDRESS || 'workrework.sanjay@gmail.com',
                    to: user.email,
                    subject: `Exciting Announcement: New Post Alert in ${category} on HogwartsEdx`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <header style="text-align: center; margin-bottom: 20px;">
                                <img src="https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/email_hogwartsedx_logo.jpeg" alt="HogwartsEdx Logo" style="max-width: 200px;">
                            </header>
                            <section style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                                <h2 style="text-align: center; color: #007bff;">New Post Notification</h2>
                                <p style="font-size: 16px; color: #333; text-align: center;">Check out the new post: <strong>${post.title}</strong> in the <strong>${category}</strong> category!</p>
                            </section>
                        </div>
                    `
                };
                await transporter.sendMail(mailOptions);
                console.log('[POST /] Email sent to:', user.email);
            }
        }

        console.log('[POST /] Post creation successful, returning response');
        res.status(201).json(post);
    } catch (err) {
        console.error('[POST /] Error in post creation or notification process:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

router.put('/complete/:postId', authMiddleware, async (req, res) => {
    console.log('[PUT /complete/:postId] Route hit for postId:', req.params.postId, 'user:', JSON.stringify(req.user));
    if (!req.user || !req.user.id) {
        console.error('[PUT /complete/:postId] No valid user in request');
        return res.status(401).json({ msg: 'User not authenticated' });
    }

    try {
        if (!req.params.postId) {
            console.error('[PUT /complete/:postId] Invalid postId:', req.params.postId);
            return res.status(400).json({ msg: 'Post ID is required' });
        }

        const postParams = {
            TableName: 'Posts',
            Key: { postId: { S: req.params.postId } }
        };
        console.log('[PUT /complete/:postId] Fetching post from DynamoDB:', postParams);
        const { Item: post } = await dbClient.send(new GetItemCommand(postParams));
        if (!post) {
            console.log('[PUT /complete/:postId] Post not found:', req.params.postId);
            return res.status(404).json({ msg: 'Post not found' });
        }

        const category = post.category.S;
        console.log('[PUT /complete/:postId] Post category:', category);

        const completedPosts = await User.getCompletedPosts(req.user.id);
        console.log('[PUT /complete/:postId] Current completed posts:', completedPosts);
        if (completedPosts.includes(req.params.postId)) {
            console.log('[PUT /complete/:postId] Post already marked as completed:', req.params.postId);
            return res.status(400).json({ msg: 'Post already marked as completed' });
        }

        console.log('[PUT /complete/:postId] Marking post as completed for user:', req.user.id);
        const updatedCompletedPosts = await User.markPostCompleted(req.user.id, req.params.postId);
        console.log('[PUT /complete/:postId] Updated completed posts:', updatedCompletedPosts);

        let categoryPosts = [];
        let lastEvaluatedKey = null;
        do {
            const categoryParams = {
                TableName: 'Posts',
                IndexName: 'CategoryIndex',
                KeyConditionExpression: 'category = :category',
                ExpressionAttributeValues: { ':category': { S: category } },
                ExclusiveStartKey: lastEvaluatedKey
            };
            console.log('[PUT /complete/:postId] Querying posts in category:', categoryParams);
            const response = await dbClient.send(new QueryCommand(categoryParams));
            categoryPosts = categoryPosts.concat(response.Items || []);
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        const categoryPostIds = categoryPosts.map(p => p.postId.S);
        const allCompleted = categoryPostIds.every(id => updatedCompletedPosts.includes(id));
        console.log('[PUT /complete/:postId] All posts in category completed:', allCompleted);

        if (allCompleted) {
            const dbUser = await User.getUserById(req.user.id);
            if (!dbUser) throw new Error('User not found');
            const { filePath, uniqueId } = await generateCertificatePDF(req.user, category);
            console.log('[PUT /complete/:postId] Certificate generated:', filePath);

            const mailOptions = {
                from: process.env.EMAIL_ADDRESS || 'workrework.sanjay@gmail.com',
                to: dbUser.email,
                subject: `Congratulations! You've completed all modules in the ${category} category!`,
                html: `
                    <div style="font-family: 'HarryP', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <header style="text-align: center; margin-bottom: 20px;">
                            <img src="https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/email_hogwartsedx_logo.jpeg" alt="HogwartsEdx Logo" style="max-width: 200px;">
                        </header>
                        <section style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
                            <h2 style="text-align: center; color: #007bff; font-family: 'HarryP';">Congratulations, ${req.user.name}!</h2>
                            <p style="font-size: 16px; color: #333; text-align: center; font-family: 'HarryP';">You've successfully completed all the modules in the <strong>${category}</strong> category. Keep up the great work!</p>
                            <p style="font-size: 16px; color: #333; text-align: center; font-family: 'HarryP';">Download your certificate <a href="${filePath}" style="color: #007bff;">here</a>.</p>
                        </section>
                    </div>
                `,
                attachments: [{
                    filename: 'Certificate_of_Completion.pdf',
                    path: filePath, // Directly use S3 URL
                    contentType: 'application/pdf'
                }]
            };

            console.log('[PUT /complete/:postId] Sending certificate email to:', dbUser.email);
            await transporter.sendMail(mailOptions);
            console.log('[PUT /complete/:postId] Certificate email sent successfully to:', dbUser.email);

            return res.json({ msg: 'Category completed! Certificate issued.', certificateUrl: filePath, uniqueId });
        }

        console.log('[PUT /complete/:postId] Post marked as completed');
        res.json({ msg: 'Post marked as completed' });
    } catch (err) {
        console.error('[PUT /complete/:postId] Server Error:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

router.get('/completed', authMiddleware, async (req, res) => {
    console.log('[GET /completed] Fetching completed posts for user:', req.user.id);
    try {
        const completedPostIds = await User.getCompletedPosts(req.user.id);
        if (!completedPostIds || completedPostIds.length === 0) return res.json([]);

        const postParams = {
            RequestItems: {
                Posts: {
                    Keys: completedPostIds.map(postId => ({ postId: { S: postId } })),
                    ProjectionExpression: 'postId, title, category'
                }
            }
        };
        const { Responses } = await dbClient.send(new BatchGetItemCommand(postParams));
        const posts = Responses.Posts.map(post => ({
            postId: post.postId.S,
            title: post.title.S,
            category: post.category.S
        }));
        res.json(posts);
    } catch (err) {
        console.error('[GET /completed] Server Error:', { message: err.message, stack: err.stack });
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});
router.get('/category', async (req, res) => {
    const { category } = req.query;
    if (!category) {
        console.log('[GET /category] Category parameter missing');
        return res.status(400).json({ msg: 'Category is required' });
    }
    try {
        console.log('[GET /category] Fetching posts for category:', category);
        const { Items } = await dbClient.send(new QueryCommand({
            TableName: 'Posts',
            IndexName: 'CategoryIndex',
            KeyConditionExpression: 'category = :category',
            ExpressionAttributeValues: { ':category': { S: category } }
        }));
        const posts = Items.map(item => ({
            postId: item.postId.S,
            title: item.title.S,
            category: item.category.S,
            slug: item.slug.S,
            content: item.content.S
        }));
        console.log('[GET /category] Posts found:', posts.length);
        res.json(posts);
    } catch (err) {
        console.error('[GET /category] Server Error:', { message: err.message, stack: err.stack });
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});
module.exports = router;