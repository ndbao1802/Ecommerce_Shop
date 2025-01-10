const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuth } = require('../middleware/auth');

// Checkout routes
router.get('/checkout', isAuth, orderController.getCheckout);
router.post('/create', isAuth, orderController.createOrder);

// Order list and details
router.get('/', isAuth, orderController.getOrders);
router.get('/:orderId', isAuth, orderController.getOrderDetails);

// Payment routes
router.get('/:orderId/payment', isAuth, orderController.getPayment);
router.post('/:orderId/payment', isAuth, orderController.processPayment);

module.exports = router; 