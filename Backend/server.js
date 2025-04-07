const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const serverless = require('serverless-http');
const multer = require('multer');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const certificateRoutes = require('./routes/certificateRoutes'); // Added
const userRoutes = require('./routes/userRoutes');
require('dotenv').config({ path: __dirname + '/.env' });
const { fromEnv } = require('@aws-sdk/credential-providers');
require('./config/passport');

console.log('Initializing server...');

const region = process.env.AWS_REGION || process.env.AWS_REGION2;
if (!region) {
    console.error('AWS_REGION is not set. Please configure it.');
    process.exit(1);
}
console.log(`Using AWS region: ${region}`);

const app = express();

console.log('Setting up middleware...');
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Consider restricting in production
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});
app.use(express.json());
app.use(session({
    secret: process.env.JWT_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false
}));
console.log('Middleware setup complete');

console.log('Initializing AWS clients...');
const dbClient = new DynamoDBClient({ region, credentials: fromEnv() });
const docClient = DynamoDBDocumentClient.from(dbClient);
const s3 = new S3Client({ region, credentials: fromEnv() }); // Added credentials for consistency
console.log('AWS clients initialized');

(async () => {
    try {
        console.log('Checking DynamoDB connection...');
        await dbClient.send(new ScanCommand({ TableName: 'Posts', Limit: 1 }));
        console.log('✅ DynamoDB is connected successfully.');
    } catch (error) {
        console.error(`❌ Error connecting to DynamoDB: ${error.message}`);
    }
})();

setInterval(async () => {
    try {
        const keepAliveUrl = process.env.KEEP_ALIVE_URL || 'https://iu96y5asjc.execute-api.ap-south-1.amazonaws.com/prod';
        console.log('Keeping Lambda warm...');
        await fetch(keepAliveUrl);
        console.log('Keep-alive ping successful');
    } catch (error) {
        console.error(`Keep-alive request failed: ${error.message}`);
    }
}, 5 * 60 * 1000);

console.log('Configuring multer...');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
console.log('Multer configured');

const uploadToS3 = async (file, folder) => {
    console.log(`Uploading file to S3: ${file.originalname}`);
    try {
        const key = `${folder}/${Date.now()}_${file.originalname}`;
        const params = {
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };
        await s3.send(new PutObjectCommand(params));
        console.log(`File uploaded to S3: ${key}`);
        return { Location: `https://${process.env.S3_BUCKET}.s3.${region}.amazonaws.com/${key}` };
    } catch (error) {
        console.error(`S3 Upload Error: ${error.message}`);
        throw error; // Let caller handle the error
    }
};

app.post('/upload/image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        console.log('No image file selected');
        return res.status(400).json({ error: 'No file selected' });
    }
    try {
        const data = await uploadToS3(req.file, 'images');
        console.log(`Image uploaded: ${data.Location}`);
        res.json({ filePath: data.Location });
    } catch (error) {
        console.error(`Upload image error: ${error.message}`);
        res.status(500).json({ error: 'S3 upload failed. Please try again.' });
    }
});

app.post('/upload/video', upload.single('video'), async (req, res) => {
    if (!req.file) {
        console.log('No video file selected');
        return res.status(400).json({ error: 'No file selected' });
    }
    try {
        const data = await uploadToS3(req.file, 'videos');
        console.log(`Video uploaded: ${data.Location}`);
        res.json({ filePath: data.Location });
    } catch (error) {
        console.error(`Upload video error: ${error.message}`);
        res.status(500).json({ error: 'S3 upload failed. Please try again.' });
    }
});

app.use('/api/posts', postRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
    app.use('/api/certificates', certificateRoutes); // Added

app.get('/', (req, res) => {
    console.log('Received request to root endpoint');
    res.send('Welcome to My AWS Lambda API');
});

module.exports.handler = serverless(app);