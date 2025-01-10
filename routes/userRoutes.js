const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuth } = require('../middleware/auth');

// Auth routes
router.get('/login', (req, res) => {
    res.render('users/login');
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

module.exports = router; 