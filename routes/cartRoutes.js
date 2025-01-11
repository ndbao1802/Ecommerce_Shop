const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuth } = require('../middleware/auth');

// Cart routes
router.get('/', isAuth, cartController.getCart);
router.post('/add', isAuth, cartController.addToCart);
router.delete('/remove/:itemId', isAuth, cartController.removeItem);
router.put('/update', isAuth, cartController.updateQuantity);

// Validation and checkout routes
router.post('/validate', isAuth, cartController.validateCart);
router.get('/checkout', isAuth, cartController.renderCheckout);

module.exports = router; 