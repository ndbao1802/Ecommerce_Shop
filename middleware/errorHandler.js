const multer = require('multer');

const errorHandler = (err, req, res, next) => {
    // Detailed error logging
    console.error('Error details:');
    console.error('Name:', err.name);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('Full error:', JSON.stringify(err, null, 2));

    if (err instanceof multer.MulterError) {
        console.error('Multer error details:', err);
        req.flash('error_msg', `Upload error: ${err.message}`);
        return res.redirect('back');
    }

    if (err.message === 'Not an image! Please upload an image.') {
        req.flash('error_msg', err.message);
        return res.redirect('back');
    }

    // Handle Cloudinary errors
    if (err.http_code) {
        req.flash('error_msg', `Cloudinary error: ${err.message}`);
        return res.redirect('back');
    }

    let errorMessage = 'Something went wrong!';
    if (typeof err === 'object' && err !== null) {
        errorMessage = err.message || JSON.stringify(err);
    }

    req.flash('error_msg', errorMessage);
    res.redirect('back');
};

module.exports = errorHandler; 