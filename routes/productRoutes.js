const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { isAuth } = require('../middleware/auth');

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', isAuth, productController.createProduct);
router.put('/:id', isAuth, productController.updateProduct);
router.delete('/:id', isAuth, productController.deleteProduct);

// Reviews
router.get('/:id/reviews', productController.getReviews);
router.post('/:id/reviews', isAuth, productController.addReview);

// Categories
router.get('/category/:categoryId', productController.getProductsByCategory);

// Search
router.get('/search/:query', productController.searchProducts);

// Filters
router.get('/brand/:brand', productController.getProductsByBrand);
router.get('/price/:min/:max', productController.getProductsByPriceRange);

// API routes
router.get('/api/products/search', productController.searchProducts);

module.exports = router; 