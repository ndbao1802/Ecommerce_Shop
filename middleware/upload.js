const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

// Avatar storage configuration
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: 'fill' }]
    }
});

// Product image storage configuration
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products',
        allowed_formats: ['jpg', 'jpeg', 'png']
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

// Export middleware
module.exports = {
    uploadSingle: multer({
        storage: productStorage,
        fileFilter: fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }).single('image'),

    uploadMultiple: multer({
        storage: productStorage,
        fileFilter: fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }
    }).array('images', 5),

    uploadAvatar: multer({
        storage: avatarStorage,
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Not an image! Please upload an image.'), false);
            }
        },
        limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for avatars
    }).single('avatar')
}; 