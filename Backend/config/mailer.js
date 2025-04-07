const nodemailer = require('nodemailer');
const dayjs = require('dayjs');
const requestIp = require('request-ip');
const axios = require('axios');
const useragent = require('useragent');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    }
});

const getGeoLocation = async (ip) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1') return 'Localhost';
    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        if (response.data.status === 'success') {
            return `${response.data.city}, ${response.data.regionName}, ${response.data.country}`;
        }
    } catch (error) {
        console.error('Error fetching location:', error.message);
    }
    return 'Unknown location';
};

const sendWelcomeEmail = async (user, req) => {
    const clientIp = requestIp.getClientIp(req) || 'Unknown IP';
    const location = await getGeoLocation(clientIp);
    const agent = useragent.parse(req.headers['user-agent']);
    const timestamp = dayjs().format('MMMM D, YYYY h:mm:ss A');
    const device = `${agent.toAgent()} on ${agent.os}`;

    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: user.email.S || user.email, // Handle DynamoDB attribute or plain object
        subject: 'Welcome to HogwartsEdx!',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="background-color: #f5f5f5; padding: 20px;">
                    <h2 style="color: #4b0082;">Welcome to HogwartsEdx, ${user.name.S || user.name}!</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Thank you for signing in with Google. We are excited to have you join us!</p>
                    <h3>Sign-in Details</h3>
                    <ul style="list-style-type: none; padding: 0;">
                        <li><strong>Username:</strong> ${user.name.S || user.name}</li>
                        <li><strong>Email ID:</strong> ${user.email.S || user.email}</li>
                        <li><strong>Location:</strong> ${location}</li>
                        <li><strong>Timestamp:</strong> ${timestamp}</li>
                        <li><strong>Device:</strong> ${device}</li>
                    </ul>
                    <p>If you believe that this sign-in is suspicious, please reset your password immediately by clicking the button below:</p>
                    <a href="https://learnandshare.vercel.app/forgot-password" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4b0082; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p style="margin-top: 20px;">Best regards,<br>The HogwartsEdx Team</p>
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending welcome email:', error);
        } else {
            console.log('Welcome email sent:', info.response);
        }
    });
};

module.exports = { sendWelcomeEmail };