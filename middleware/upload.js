const { upload } = require('../config/cloudinary');

const uploadSingle = upload.single('image');
const uploadMultiple = upload.array('images', 5); // Max 5 images

module.exports = {
    uploadSingle,
    uploadMultiple
}; 