const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuth } = require('../middleware/auth');
const User = require('../models/userModel');
const passport = require('passport');
const { uploadAvatar } = require('../middleware/upload');
const Order = require('../models/orderModel');

// Auth routes
router.get('/login', (req, res) => {
    res.render('users/login', {
        success_msg: req.flash('success_msg'),
        error_msg: req.flash('error_msg'),
        warning_msg: req.flash('warning_msg')
    });
});

router.get('/register', (req, res) => {
    res.render('users/register');
});

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/logout', userController.logout);

// Protected routes
router.get('/profile', isAuth, userController.getProfile);
router.post('/profile', isAuth, uploadAvatar, userController.updateProfile);
router.post('/profile/password', isAuth, userController.updatePassword);

// Report routes
router.post('/report/product/:productId', isAuth, userController.reportProduct);
router.post('/report/page', isAuth, userController.reportPage);

// Cart routes
router.get('/cart', isAuth, userController.getCart);
router.post('/cart/add', isAuth, userController.addToCart);
router.delete('/cart/remove/:productId', isAuth, userController.removeFromCart);

// Wishlist routes
router.get('/wishlist', isAuth, userController.getWishlist);
router.post('/wishlist/add/:productId', isAuth, userController.addToWishlist);
router.delete('/wishlist/remove/:productId', isAuth, userController.removeFromWishlist);

// Address routes
router.get('/addresses', isAuth, userController.getAddresses);
router.post('/addresses', isAuth, userController.addAddress);
router.put('/addresses/:addressId', isAuth, userController.updateAddress);
router.delete('/addresses/:addressId', isAuth, userController.deleteAddress);

// Order routes
router.get('/orders', isAuth, userController.getOrders);
router.get('/orders/:orderId', isAuth, userController.getOrderDetails);

// Email availability check
router.post('/check-email', userController.checkEmail);

// Activation route
router.get('/activate/:token', userController.activateAccount);

// Password reset routes
router.get('/forgot-password', (req, res) => {
    res.render('users/forgot-password');
});
router.post('/forgot-password', userController.forgotPassword);
router.get('/reset-password/:token', userController.getResetPassword);
router.post('/reset-password/:token', userController.postResetPassword);

module.exports = router; 