const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { ensureAuthenticated } = require('../middleware/auth');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductDetails);

// Review routes
router.post('/:id/reviews', ensureAuthenticated, productController.addReview);
router.get('/:id/reviews', productController.getReviews);

module.exports = router; 