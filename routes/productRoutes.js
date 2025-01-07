const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { uploadMultiple } = require('../middleware/upload');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', uploadMultiple, productController.createProduct);
router.put('/:id', uploadMultiple, productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router; 