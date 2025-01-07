const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated, ensureGuest } = require('../middleware/auth');

// Auth routes
router.get('/login', ensureGuest, userController.getLogin);
router.get('/register', ensureGuest, userController.getRegister);
router.post('/login', ensureGuest, userController.postLogin);
router.post('/register', ensureGuest, userController.postRegister);
router.get('/logout', ensureAuthenticated, userController.logout);

// Protected routes
router.get('/profile', ensureAuthenticated, userController.getProfile);

module.exports = router; 