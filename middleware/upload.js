const { cloudinary } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'categories',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
    }
});

const uploadSingle = multer({ storage: storage }).single('image');
const uploadMultiple = multer({ storage: storage }).array('images', 5);

module.exports = {
    uploadSingle,
    uploadMultiple
}; 