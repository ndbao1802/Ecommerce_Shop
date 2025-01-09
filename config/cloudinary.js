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

cloudinary.api.ping()
    .then(result => console.log(result))
    .catch(error => console.error(error));

module.exports = { cloudinary }; 