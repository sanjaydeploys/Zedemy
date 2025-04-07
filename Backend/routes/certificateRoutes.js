const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const router = express.Router();
const { DynamoDBClient, ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION2 });
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const s3 = new S3Client({
    region: process.env.AWS_REGION2,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID2,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY2
    }
});

router.get('/:uniqueId', async (req, res) => {
    try {
        const certificate = await Certificate.getCertificateByUniqueId(req.params.uniqueId);
        if (!certificate) return res.status(404).json({ msg: 'Certificate not found' });
        const user = await User.getUserById(certificate.userId);
        res.json({ ...certificate, user: { name: user.name } });
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:uniqueId/download', async (req, res) => {
    try {
        const certificate = await Certificate.getCertificateByUniqueId(req.params.uniqueId);
        if (!certificate) return res.status(404).json({ msg: 'Certificate not found' });

        const key = certificate.filePath.split('/').slice(3).join('/');
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key
        });
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
        res.json({ url: signedUrl });
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

router.get('/', async (req, res) => {
    try {
        console.log('Fetching certificates with query parameters:', req.query);
        const { userName, uniqueId, date } = req.query;

        let certificates = [];

        if (uniqueId) {
            const certificate = await Certificate.getCertificateByUniqueId(uniqueId);
            certificates = certificate ? [certificate] : [];
        } else {
            const scanParams = {
                TableName: 'Certificates'
            };
            const { Items } = await dbClient.send(new ScanCommand(scanParams));
            certificates = Items.map(item => ({
                certificateId: item.certificateId.S,
                userId: item.userId.S,
                category: item.category.S,
                uniqueId: item.uniqueId.S,
                filePath: item.filePath.S,
                createdAt: item.createdAt.S
            }));
        }

        if (userName) {
            console.log(`Searching for users with name matching: ${userName}`);
            const { Items: userItems } = await dbClient.send(new ScanCommand({
                TableName: 'Users',
                FilterExpression: 'contains(#name, :userName)',
                ExpressionAttributeNames: { '#name': 'name' },
                ExpressionAttributeValues: { ':userName': { S: userName.toLowerCase() } }
            }));
            const userIds = userItems.map(user => user.userId.S);
            console.log('User IDs found:', userIds);
            certificates = certificates.filter(cert => userIds.includes(cert.userId));
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            console.log(`Filtering by date: from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
            certificates = certificates.filter(cert => {
                const certDate = new Date(cert.createdAt);
                return certDate >= startOfDay && certDate <= endOfDay;
            });
        }

        const enrichedCertificates = await Promise.all(certificates.map(async (cert) => {
            const user = await User.getUserById(cert.userId);
            return { ...cert, user: { name: user.name } };
        }));
        

        console.log('Certificates found:', enrichedCertificates);
        res.json(enrichedCertificates);
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});
// New authenticated route: Fetch certificates for the logged-in user
router.get('/my-certificates', authMiddleware, async (req, res) => {
    try {
        console.log('Fetching certificates for user:', req.user.id);
        const scanParams = {
            TableName: 'Certificates',
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': { S: req.user.id } }
        };
        const { Items } = await dbClient.send(new ScanCommand(scanParams));
        const certificates = Items.map(item => ({
            certificateId: item.certificateId.S,
            userId: item.userId.S,
            category: item.category.S,
            uniqueId: item.uniqueId.S,
            filePath: item.filePath.S,
            createdAt: item.createdAt.S
        }));

        const enrichedCertificates = await Promise.all(certificates.map(async (cert) => {
            const user = await User.getUserById(cert.userId);
            return { ...cert, user: { name: user.name } };
        }));

        console.log('User-specific certificates found:', enrichedCertificates);
        res.json(enrichedCertificates);
    } catch (err) {
        console.error("Server error:", err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;