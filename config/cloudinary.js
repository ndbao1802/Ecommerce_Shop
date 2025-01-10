const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'avatars',
            allowed_formats: ['jpg', 'jpeg', 'png'],
            public_id: `avatar-${Date.now()}`,
            transformation: [{ width: 500, height: 500, crop: 'fill' }],
            format: 'jpg'
        };
    }
});

// Create multer upload middleware
const uploadAvatar = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Export both cloudinary and upload middleware
module.exports = {
    cloudinary,
    uploadAvatar
}; 