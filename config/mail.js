const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendMail = async (options) => {
    try {
        const info = await transporter.sendMail({
            from: `"Gaming Store" <${process.env.EMAIL_USER}>`,
            ...options
        });
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email error:', error);
        throw error;
    }
};

module.exports = { sendMail }; 