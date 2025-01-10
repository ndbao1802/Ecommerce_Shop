const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuth } = require('../middleware/auth');
const User = require('../models/userModel');
const passport = require('passport');
const { uploadAvatar } = require('../config/cloudinary');
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
router.put('/profile', isAuth, userController.updateProfile);
router.put('/password', isAuth, userController.updatePassword);
router.put('/profile/avatar', isAuth, (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                error: err.message || 'Error uploading file'
            });
        }
        next();
    });
}, userController.updateAvatar);

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

// Email availability check
router.post('/check-email', userController.checkEmail);

// Activation route
router.get('/activate/:token', userController.activateAccount);

// Password reset routes
router.get('/forgot-password', (req, res) => {
    res.render('users/forgot-password');
});
router.post('/forgot-password', userController.forgotPassword);
router.get('/reset-password/:token', (req, res) => {
    const { token } = req.params;
    // Verify token exists and is not expired before showing the form
    User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    }).then(user => {
        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired');
            return res.redirect('/users/forgot-password');
        }
        res.render('users/reset-password', { token });
    }).catch(err => {
        console.error('Error verifying reset token:', err);
        req.flash('error_msg', 'Error verifying reset token');
        res.redirect('/users/forgot-password');
    });
});
router.post('/reset-password/:token', userController.resetPassword);

// Google authentication routes
router.get('/auth/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email']
    })
);

router.get('/auth/google/callback',
    (req, res, next) => {
        passport.authenticate('google', (err, user, info) => {
            console.log('Google callback - user:', user);
            console.log('Google callback - info:', info);

            if (err) {
                console.error('Google auth error:', err);
                req.flash('error_msg', 'Authentication error');
                return res.redirect('/users/login');
            }

            if (!user) {
                req.flash('error_msg', info?.message || 'Authentication failed');
                return res.redirect('/users/login');
            }

            req.logIn(user, (err) => {
                if (err) {
                    console.error('Login error:', err);
                    req.flash('error_msg', 'Error during login');
                    return res.redirect('/users/login');
                }

                // Check if user needs to complete setup
                if (!user.isSetupComplete) {
                    return res.redirect('/users/complete-setup');
                }
                res.redirect('/');
            });
        })(req, res, next);
    }
);

// Google setup routes
router.get('/complete-setup', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }
    
    if (req.user.isSetupComplete) {
        return res.redirect('/');
    }
    
    res.render('users/google-setup');
});

router.post('/complete-setup', (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/users/login');
    }
    
    next();
}, async (req, res) => {
    try {
        const { phone } = req.body;
        console.log('Completing setup for user:', req.user._id);
        
        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                phone,
                isSetupComplete: true
            },
            { new: true }
        );

        if (!updatedUser) {
            throw new Error('User not found');
        }

        // Update the session user data
        req.user.phone = phone;
        req.user.isSetupComplete = true;

        console.log('Setup completed:', updatedUser);
        req.flash('success_msg', 'Profile setup completed!');
        res.redirect('/');
    } catch (error) {
        console.error('Setup error:', error);
        res.render('users/google-setup', {
            error: 'Error completing setup. Please try again.'
        });
    }
});

// Add these routes after your existing user routes
router.get('/orders', isAuth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product');

        res.render('orders/list', {
            title: 'My Orders',
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        req.flash('error_msg', 'Error loading orders');
        res.redirect('/');
    }
});

router.get('/orders/:orderId', isAuth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.product')
            .populate('user', 'name email');

        if (!order || order.user._id.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/users/orders');
        }

        res.render('orders/details', {
            title: 'Order Details',
            order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        req.flash('error_msg', 'Error loading order details');
        res.redirect('/users/orders');
    }
});

module.exports = router; 