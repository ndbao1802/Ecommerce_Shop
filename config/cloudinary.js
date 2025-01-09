const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Test the configuration
cloudinary.api.ping()
    .then(result => console.log('Cloudinary connected:', result))
    .catch(error => console.error('Cloudinary error:', error));

module.exports = { cloudinary }; 