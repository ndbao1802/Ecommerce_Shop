const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ecommerce',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const uploadSingle = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('image');

// Add error handling wrapper
const uploadMiddleware = (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            req.flash('error_msg', 'Error uploading image: ' + err.message);
            return res.redirect('back');
        }
        next();
    });
};

module.exports = {
    uploadSingle: uploadMiddleware,
    uploadMultiple: multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    }).array('images', 5)
}; 