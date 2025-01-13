const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuth } = require('../middleware/auth');

// Cart routes
router.get('/', isAuth, cartController.getCart);
router.post('/add', isAuth, cartController.addToCart);

// Validation and checkout routes
router.post('/validate', isAuth, cartController.validateCart);
router.get('/checkout', isAuth, cartController.renderCheckout);

// Stripe routes
router.post('/create-payment-intent', isAuth, cartController.createPaymentIntent);
router.post('/process-checkout', isAuth, cartController.processCheckout);
router.get('/payment-success', isAuth, cartController.handlePaymentSuccess);

module.exports = router; 