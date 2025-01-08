const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController');
const { ensureAdmin } = require('../middleware/adminAuth');
const homePageController = require('../controllers/admin/homePageController');
const { uploadSingle } = require('../middleware/upload');

// Admin auth routes
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected admin routes
router.get('/dashboard', ensureAdmin, adminController.getDashboard);

// Category Management
router.get('/categories', ensureAdmin, categoryController.getCategories);
router.post('/categories', ensureAdmin, uploadSingle, categoryController.createCategory);
router.put('/categories/:id', ensureAdmin, categoryController.updateCategory);
router.delete('/categories/:id', ensureAdmin, categoryController.deleteCategory);

// Product Management
router.get('/products', ensureAdmin, productController.getProducts);
router.get('/products/create', ensureAdmin, productController.getCreateProduct);
router.post('/products', ensureAdmin, productController.createProduct);
router.get('/products/:id/edit', ensureAdmin, productController.getEditProduct);
router.put('/products/:id', ensureAdmin, productController.updateProduct);
router.delete('/products/:id', ensureAdmin, productController.deleteProduct);

// Product Categories
router.get('/products/categories', ensureAdmin, categoryController.getProductCategories);

// User Management
router.get('/users', ensureAdmin, adminController.getUsers);
router.get('/users/create', ensureAdmin, adminController.getCreateUser);
router.post('/users/create', ensureAdmin, adminController.postCreateUser);

// Orders
router.get('/orders', ensureAdmin, adminController.getOrders);

// System Settings
router.get('/settings', ensureAdmin, adminController.getSettings);
router.post('/settings', ensureAdmin, adminController.updateSettings);

// Home Page Settings
router.get('/homepage/settings', ensureAdmin, homePageController.getHomePageSettings);
router.post('/homepage/featured-products', ensureAdmin, homePageController.updateFeaturedProducts);

module.exports = router; 