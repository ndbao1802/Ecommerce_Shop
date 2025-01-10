const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuth } = require('../middleware/auth');

// Cart routes
router.get('/', isAuth, cartController.getCart);
router.post('/add', isAuth, cartController.addToCart);
router.delete('/remove/:itemId([0-9a-fA-F]{24})', isAuth, cartController.removeItem);
router.put('/update', isAuth, cartController.updateQuantity);

// Validation and checkout routes
router.post('/validate', isAuth, cartController.validateCart);
router.get('/checkout', isAuth, cartController.validateCart, cartController.renderCheckout);
router.post('/checkout', isAuth, cartController.validateCart, cartController.processCheckout);

// Add this route temporarily for debugging
router.get('/debug', (req, res) => {
    res.json({
        message: 'Cart routes are working',
        routes: router.stack.map(r => ({
            path: r.route?.path,
            methods: r.route?.methods
        }))
    });
});

module.exports = router; 