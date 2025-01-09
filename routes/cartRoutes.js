const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { ensureAuthenticated } = require('../middleware/auth');

// Cart routes
router.get('/', ensureAuthenticated, cartController.getCart);
router.post('/add', ensureAuthenticated, cartController.addToCart);
router.post('/update', ensureAuthenticated, cartController.updateCart);
router.post('/remove', ensureAuthenticated, cartController.removeFromCart);
router.post('/clear', ensureAuthenticated, cartController.clearCart);

module.exports = router; 