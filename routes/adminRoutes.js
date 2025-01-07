const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/adminAuth');

// Admin auth routes
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected admin routes
router.get('/dashboard', ensureAdmin, adminController.getDashboard);
router.get('/products', ensureAdmin, adminController.getProducts);
router.get('/users', ensureAdmin, adminController.getUsers);
router.get('/orders', ensureAdmin, adminController.getOrders);

module.exports = router; 