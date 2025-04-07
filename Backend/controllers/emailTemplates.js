const nodemailer = require('nodemailer');
const axios = require('axios');
const requestIp = require('request-ip');
const dayjs = require('dayjs');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Function to get user's location from IP
const getGeoLocation = async (ip) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
        return 'Localhost';
    }
    
    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        if (response.data.status === "success") {
            return `${response.data.city}, ${response.data.regionName}, ${response.data.country}`;
        }
    } catch (error) {
        console.error("Error fetching location:", error.message);
    }

    return 'Unknown location';
};

// Send password reset email
const sendPasswordResetEmail = async (req, email, token) => {
    const clientIp = requestIp.getClientIp(req) || 'Unknown IP';
    const location = await getGeoLocation(clientIp);
    const timestamp = dayjs().format('MMMM D, YYYY h:mm:ss A');

    const mailOptions = {
        from: 'workrework.sanjay@gmail.com',
        to: email,
        subject: 'Reset Your Password',
        html: `
            <div style="font-family: 'Courier New', Courier, monospace; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #3A3A3A; border-radius: 10px; background-color: #F5F5DC;">
                <div style="text-align: center;">
                    <img src="https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/email_hogwartsedx_logo.jpeg" alt="HogwartsEdx" style="width: 150px;">
                </div>
                <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
                <p style="font-size: 16px; color: #666;">Greetings from HogwartsEdx,</p>
                <p style="font-size: 16px; color: #666;">Click on the magical button below to reset your password:</p>
                <div style="text-align: center; margin: 20px;">
                    <a href="https://learnandshare.vercel.app/reset-password/${token}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #4B0082; border-radius: 5px; text-decoration: none;">Reset Password</a>
                </div>
                <p style="font-size: 16px; color: #666;">Access Details:</p>
                <ul style="font-size: 14px; color: #666;">
                    <li>IP Address: ${clientIp}</li>
                    <li>Location: ${location}</li>
                    <li>Time: ${timestamp}</li>
                </ul>
                <p style="font-size: 14px; color: #999; text-align: center;">If you did not request this, please ignore this email. Mischief Managed!</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

// Send password reset confirmation email
const sendPasswordResetConfirmationEmail = async (req, email) => {
    const clientIp = requestIp.getClientIp(req) || 'Unknown IP';
    const location = await getGeoLocation(clientIp);
    const timestamp = dayjs().format('MMMM D, YYYY h:mm:ss A');

    const mailOptions = {
        from: 'workrework.sanjay@gmail.com',
        to: email,
        subject: 'Your Password Has Been Reset Successfully',
        html: `
            <div style="font-family: 'Courier New', Courier, monospace; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #3A3A3A; border-radius: 10px; background-color: #F5F5DC;">
                <div style="text-align: center;">
                    <img src="https://sanjaybasket.s3.ap-south-1.amazonaws.com/HogwartsEdX/email_hogwartsedx_logo.jpeg" alt="HogwartsEdx" style="width: 150px;">
                </div>
                <h2 style="color: #333; text-align: center;">Password Reset Successful</h2>
                <p style="font-size: 16px; color: #666;">This confirms your password was reset.</p>
                <div style="text-align: center; margin: 20px;">
                    <a href="https://learnandshare.vercel.app/login" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #4B0082; border-radius: 5px; text-decoration: none;">Login Now</a>
                </div>
                <p style="font-size: 16px; color: #666;">Access Details:</p>
                <ul style="font-size: 14px; color: #666;">
                    <li>IP Address: ${clientIp}</li>
                    <li>Location: ${location}</li>
                    <li>Time: ${timestamp}</li>
                </ul>
                <p style="font-size: 14px; color: #999; text-align: center;">If you did not request this, contact support. Mischief Managed!</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = {
    sendPasswordResetEmail,
    sendPasswordResetConfirmationEmail
};
