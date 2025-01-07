const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Authentication routes
router.get('/login', userController.getLogin);
router.get('/register', userController.getRegister);
router.post('/login', userController.postLogin);
router.post('/register', userController.postRegister);
router.get('/logout', userController.logout);

module.exports = router; 