const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.get('/shop', pageController.getShop);
router.get('/featured', pageController.getFeatured);
router.get('/pages', pageController.getPages);
router.get('/about', pageController.getAbout);

module.exports = router; 