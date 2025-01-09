const cloudinary = require('cloudinary').v2;

// Add debug logging
console.log('Configuring Cloudinary with:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: '***' // Don't log the actual secret
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Test the configuration
cloudinary.api.ping()
    .then(result => console.log('Cloudinary connection test successful:', result))
    .catch(error => console.error('Cloudinary connection test failed:', error));

module.exports = { cloudinary }; 